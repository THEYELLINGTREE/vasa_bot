import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import db from '../database/init.js';
import { PermissionManager } from '../utils/permissions.js';

export const data = new SlashCommandBuilder()
    .setName('event')
    .setDescription('Create a new event with guided DM flow');

export async function execute(interaction) {
    try {
        // Check permissions
        const canCreate = await PermissionManager.canCreateEvents(
            interaction.guild.id,
            interaction.user.id,
            interaction.member
        );

        if (!canCreate) {
            await interaction.reply({
                content: '❌ You don\'t have permission to create events in this server.',
                ephemeral: true
            });
            return;
        }

        // Send initial DM with event creation flow
        try {
            const dmEmbed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle('🎉 Create New Event')
                .setDescription('Let\'s create your event! I\'ll guide you through the process step by step.')
                .addFields(
                    { name: '📋 What we\'ll need:', value: '• Event title\n• Description (optional)\n• Date and time\n• Additional settings (optional)', inline: false }
                )
                .setFooter({ text: 'Click the button below to start creating your event' });

            const startButton = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`create_event_start_${interaction.guild.id}_${interaction.channel.id}`)
                        .setLabel('Start Creating Event')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('🎯')
                );

            await interaction.user.send({
                embeds: [dmEmbed],
                components: [startButton]
            });

            await interaction.reply({
                content: '✅ I\'ve sent you a DM to guide you through creating your event!',
                ephemeral: true
            });

        } catch (error) {
            if (error.code === 50007) { // Cannot send messages to this user
                await interaction.reply({
                    content: '❌ I couldn\'t send you a DM. Please make sure your DMs are enabled and try again.',
                    ephemeral: true
                });
            } else {
                throw error;
            }
        }

    } catch (error) {
        console.error('Error in event command:', error);
        await interaction.reply({
            content: '❌ An error occurred while starting the event creation process.',
            ephemeral: true
        });
    }
}

// Handle the button interaction for starting event creation
export async function handleEventCreationStart(interaction, guildId, channelId) {
    const modal = new ModalBuilder()
        .setCustomId(`event_basic_info_${guildId}_${channelId}`)
        .setTitle('Event Basic Information');

    const titleInput = new TextInputBuilder()
        .setCustomId('event_title')
        .setLabel('Event Title')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(100)
        .setPlaceholder('Enter the event title...');

    const descriptionInput = new TextInputBuilder()
        .setCustomId('event_description')
        .setLabel('Event Description')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false)
        .setMaxLength(1000)
        .setPlaceholder('Describe your event... (optional)');

    const dateInput = new TextInputBuilder()
        .setCustomId('event_date')
        .setLabel('Date and Time')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setPlaceholder('YYYY-MM-DD HH:MM or natural language like "tomorrow 8pm"');

    const locationInput = new TextInputBuilder()
        .setCustomId('event_location')
        .setLabel('Location (Optional)')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setMaxLength(200)
        .setPlaceholder('Where is this event taking place?');

    modal.addComponents(
        new ActionRowBuilder().addComponents(titleInput),
        new ActionRowBuilder().addComponents(descriptionInput),
        new ActionRowBuilder().addComponents(dateInput),
        new ActionRowBuilder().addComponents(locationInput)
    );

    await interaction.showModal(modal);
}

// Handle the modal submission for basic event info
export async function handleEventBasicInfoSubmission(interaction, guildId, channelId) {
    const title = interaction.fields.getTextInputValue('event_title');
    const description = interaction.fields.getTextInputValue('event_description') || '';
    const dateString = interaction.fields.getTextInputValue('event_date');
    const location = interaction.fields.getTextInputValue('event_location') || '';

    // Parse and validate date
    let eventDate;
    try {
        eventDate = parseEventDate(dateString);
        if (eventDate <= new Date()) {
            await interaction.reply({
                content: '❌ Event date must be in the future. Please try again.',
                ephemeral: true
            });
            return;
        }
    } catch (error) {
        await interaction.reply({
            content: '❌ Invalid date format. Please use YYYY-MM-DD HH:MM format or natural language like "tomorrow 8pm".',
            ephemeral: true
        });
        return;
    }

    try {
        await interaction.deferReply({ ephemeral: true });

        // Create the event in database
        const stmt = db.prepare(`
            INSERT INTO events (title, description, date_time, channel_id, guild_id, creator_id, location, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
        `);

        const result = await new Promise((resolve, reject) => {
            stmt.run([title, description, eventDate.toISOString(), channelId, guildId, interaction.user.id, location], function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID });
            });
            stmt.finalize();
        });

        // Create event embed with RSVP buttons
        const eventEmbed = await createEventEmbed(result.id, {
            title,
            description,
            date_time: eventDate.toISOString(),
            location,
            creator_id: interaction.user.id,
            guild_id: guildId
        }, interaction.client);

        const rsvpButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`rsvp_yes_${result.id}`)
                    .setLabel('✅ Attending')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`rsvp_maybe_${result.id}`)
                    .setLabel('❓ Maybe')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`rsvp_no_${result.id}`)
                    .setLabel('❌ Not Attending')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId(`event_details_${result.id}`)
                    .setLabel('📋 View Details')
                    .setStyle(ButtonStyle.Primary)
            );

        // Get the channel and send the event
        const guild = interaction.client.guilds.cache.get(guildId);
        const channel = guild.channels.cache.get(channelId);

        if (channel) {
            await channel.send({
                content: '🎉 **New Event Created!**',
                embeds: [eventEmbed],
                components: [rsvpButtons]
            });
        }

        // Send success message to user
        await interaction.editReply({
            content: `✅ **Event created successfully!**\n\n🎯 **${title}**\n📅 <t:${Math.floor(eventDate.getTime() / 1000)}:F>\n📍 ${location || 'No location specified'}\n\n🔗 Your event has been posted in ${channel} with RSVP buttons!`,
            ephemeral: true
        });

    } catch (error) {
        console.error('Error creating event:', error);
        await interaction.editReply({
            content: '❌ Failed to create event. Please try again.',
            ephemeral: true
        });
    }
}

// Helper function to create event embed
async function createEventEmbed(eventId, eventData, client) {
    const eventDate = new Date(eventData.date_time);
    const creator = await client.users.fetch(eventData.creator_id);

    // Get RSVP counts
    const rsvpCounts = await getRSVPCounts(eventId);

    const embed = new EmbedBuilder()
        .setColor(0x00AE86)
        .setTitle(`📅 ${eventData.title}`)
        .setDescription(eventData.description || 'No description provided')
        .addFields(
            { name: '🕐 Date & Time', value: `<t:${Math.floor(eventDate.getTime() / 1000)}:F>`, inline: true },
            { name: '👤 Created by', value: `${creator}`, inline: true }
        )
        .setFooter({ text: `Event ID: ${eventId}` })
        .setTimestamp();

    if (eventData.location) {
        embed.addFields({ name: '📍 Location', value: eventData.location, inline: true });
    }

    // Add RSVP counts
    const attendeeText = [
        `✅ **${rsvpCounts.attending}** Attending`,
        `❓ **${rsvpCounts.maybe}** Maybe`,
        `❌ **${rsvpCounts.not_attending}** Not Attending`
    ].join('\n');

    embed.addFields({ name: '👥 RSVPs', value: attendeeText, inline: false });

    return embed;
}

// Helper function to get RSVP counts
async function getRSVPCounts(eventId) {
    return new Promise((resolve, reject) => {
        db.all(`
            SELECT status, COUNT(*) as count 
            FROM event_rsvps 
            WHERE event_id = ? 
            GROUP BY status
        `, [eventId], (err, rows) => {
            if (err) {
                reject(err);
                return;
            }

            const counts = {
                attending: 0,
                maybe: 0,
                not_attending: 0
            };

            rows.forEach(row => {
                counts[row.status] = row.count;
            });

            resolve(counts);
        });
    });
}

// Helper function to parse event dates (basic implementation)
function parseEventDate(dateString) {
    // Try ISO format first
    let date = new Date(dateString);
    if (!isNaN(date.getTime())) {
        return date;
    }

    // Try to handle some natural language (basic implementation)
    const now = new Date();
    const lower = dateString.toLowerCase();

    if (lower.includes('tomorrow')) {
        date = new Date(now);
        date.setDate(date.getDate() + 1);
        
        // Extract time if provided
        const timeMatch = dateString.match(/(\d{1,2}):?(\d{0,2})\s?(am|pm)?/i);
        if (timeMatch) {
            let hour = parseInt(timeMatch[1]);
            const minute = parseInt(timeMatch[2]) || 0;
            const ampm = timeMatch[3]?.toLowerCase();
            
            if (ampm === 'pm' && hour !== 12) hour += 12;
            if (ampm === 'am' && hour === 12) hour = 0;
            
            date.setHours(hour, minute, 0, 0);
        }
        return date;
    }

    // If all else fails, throw an error
    throw new Error('Unable to parse date');
}