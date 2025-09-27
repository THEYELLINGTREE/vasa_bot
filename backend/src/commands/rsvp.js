import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import db from '../database/init.js';

export const data = new SlashCommandBuilder()
    .setName('rsvp')
    .setDescription('View or manage your RSVPs')
    .addSubcommand(subcommand =>
        subcommand
            .setName('list')
            .setDescription('List your upcoming RSVPs'))
    .addSubcommand(subcommand =>
        subcommand
            .setName('change')
            .setDescription('Change your RSVP for an event')
            .addIntegerOption(option =>
                option.setName('event_id')
                    .setDescription('The event ID to change RSVP for')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('status')
                    .setDescription('Your new RSVP status')
                    .setRequired(true)
                    .addChoices(
                        { name: '✅ Attending', value: 'attending' },
                        { name: '❓ Maybe', value: 'maybe' },
                        { name: '❌ Not Attending', value: 'not_attending' }
                    )));

export async function execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'list') {
        await handleListRSVPs(interaction);
    } else if (subcommand === 'change') {
        await handleChangeRSVP(interaction);
    }
}

async function handleListRSVPs(interaction) {
    try {
        await interaction.deferReply({ ephemeral: true });

        const rsvps = await new Promise((resolve, reject) => {
            db.all(`
                SELECT r.*, e.title, e.description, e.date_time, e.location, e.id as event_id
                FROM event_rsvps r
                JOIN events e ON r.event_id = e.id
                WHERE r.user_id = ? AND e.guild_id = ? AND e.date_time > datetime('now')
                ORDER BY e.date_time ASC
            `, [interaction.user.id, interaction.guild.id], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        if (rsvps.length === 0) {
            await interaction.editReply({
                content: '📅 You haven\'t RSVPed to any upcoming events.',
            });
            return;
        }

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('📋 Your Upcoming RSVPs')
            .setDescription(`You have RSVPed to ${rsvps.length} upcoming event(s)`)
            .setTimestamp();

        rsvps.forEach((rsvp, index) => {
            const eventDate = new Date(rsvp.date_time);
            const statusEmoji = rsvp.status === 'attending' ? '✅' : rsvp.status === 'maybe' ? '❓' : '❌';
            
            embed.addFields({
                name: `${index + 1}. ${rsvp.title}`,
                value: [
                    `**Status:** ${statusEmoji} ${rsvp.status.replace('_', ' ').toUpperCase()}`,
                    `**Date:** <t:${Math.floor(eventDate.getTime() / 1000)}:F>`,
                    rsvp.location ? `**Location:** ${rsvp.location}` : '',
                    `**Event ID:** ${rsvp.event_id}`
                ].filter(Boolean).join('\n'),
                inline: false
            });
        });

        await interaction.editReply({
            embeds: [embed]
        });

    } catch (error) {
        console.error('Error listing RSVPs:', error);
        await interaction.editReply({
            content: '❌ Failed to retrieve your RSVPs. Please try again.',
        });
    }
}

async function handleChangeRSVP(interaction) {
    const eventId = interaction.options.getInteger('event_id');
    const newStatus = interaction.options.getString('status');

    try {
        await interaction.deferReply({ ephemeral: true });

        // Check if event exists and user has existing RSVP
        const existingRSVP = await new Promise((resolve, reject) => {
            db.get(`
                SELECT r.*, e.title, e.date_time 
                FROM event_rsvps r
                JOIN events e ON r.event_id = e.id
                WHERE r.event_id = ? AND r.user_id = ? AND e.guild_id = ?
            `, [eventId, interaction.user.id, interaction.guild.id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!existingRSVP) {
            await interaction.editReply({
                content: '❌ You don\'t have an RSVP for this event, or the event doesn\'t exist.',
            });
            return;
        }

        // Update RSVP status
        const stmt = db.prepare(`
            UPDATE event_rsvps 
            SET status = ?, response_time = CURRENT_TIMESTAMP
            WHERE event_id = ? AND user_id = ?
        `);

        await new Promise((resolve, reject) => {
            stmt.run([newStatus, eventId, interaction.user.id], function(err) {
                stmt.finalize();
                if (err) reject(err);
                else resolve({ changes: this.changes });
            });
        });

        const statusEmoji = newStatus === 'attending' ? '✅' : newStatus === 'maybe' ? '❓' : '❌';
        const statusText = newStatus.replace('_', ' ').toUpperCase();

        await interaction.editReply({
            content: `${statusEmoji} **RSVP Updated!**\n\nYour RSVP for **${existingRSVP.title}** has been changed to **${statusText}**.`
        });

    } catch (error) {
        console.error('Error changing RSVP:', error);
        await interaction.editReply({
            content: '❌ Failed to update your RSVP. Please try again.',
        });
    }
}

// Handle RSVP button interactions
export async function handleRSVPButton(interaction, action, eventId) {
    try {
        await interaction.deferReply({ ephemeral: true });

        // Get event info
        const event = await new Promise((resolve, reject) => {
            db.get(`
                SELECT * FROM events 
                WHERE id = ? AND guild_id = ? AND status = 'active'
            `, [eventId, interaction.guild.id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!event) {
            await interaction.editReply({
                content: '❌ Event not found or no longer active.',
            });
            return;
        }

        // Check if event has passed
        if (new Date(event.date_time) <= new Date()) {
            await interaction.editReply({
                content: '❌ This event has already passed.',
            });
            return;
        }

        // Determine RSVP status from action
        const status = action === 'yes' ? 'attending' : action === 'maybe' ? 'maybe' : 'not_attending';

        // Insert or update RSVP
        const stmt = db.prepare(`
            INSERT OR REPLACE INTO event_rsvps 
            (event_id, user_id, username, status, response_time)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        `);

        await new Promise((resolve, reject) => {
            stmt.run([eventId, interaction.user.id, interaction.user.displayName, status], function(err) {
                stmt.finalize();
                if (err) reject(err);
                else resolve({ changes: this.changes });
            });
        });

        const statusEmoji = status === 'attending' ? '✅' : status === 'maybe' ? '❓' : '❌';
        const statusText = status.replace('_', ' ').toUpperCase();

        await interaction.editReply({
            content: `${statusEmoji} **RSVP Recorded!**\n\nYour response for **${event.title}** has been set to **${statusText}**.`
        });

        // Update the original event message with new RSVP counts (optional enhancement)
        try {
            await updateEventMessage(interaction, eventId);
        } catch (error) {
            console.error('Failed to update event message:', error);
            // Don't fail the RSVP if we can't update the message
        }

    } catch (error) {
        console.error('Error handling RSVP:', error);
        await interaction.editReply({
            content: '❌ Failed to record your RSVP. Please try again.',
        });
    }
}

// Helper function to update event message with new RSVP counts
async function updateEventMessage(interaction, eventId) {
    // This would require storing message IDs or finding the original message
    // For now, we'll skip this functionality
    return;
}