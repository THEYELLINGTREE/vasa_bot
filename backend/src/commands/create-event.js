import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import db from '../database/init.js';

export const data = new SlashCommandBuilder()
    .setName('create-event')
    .setDescription('Create a new event')
    .addStringOption(option =>
        option.setName('title')
            .setDescription('Event title')
            .setRequired(true))
    .addStringOption(option =>
        option.setName('description')
            .setDescription('Event description'))
    .addStringOption(option =>
        option.setName('date')
            .setDescription('Event date and time (YYYY-MM-DD HH:MM)')
            .setRequired(true))
    .addChannelOption(option =>
        option.setName('channel')
            .setDescription('Channel for event announcements'));

export async function execute(interaction) {
    const title = interaction.options.getString('title');
    const description = interaction.options.getString('description') || '';
    const dateString = interaction.options.getString('date');
    const channel = interaction.options.getChannel('channel') || interaction.channel;

    // Validate date format
    const dateTime = new Date(dateString);
    if (isNaN(dateTime.getTime())) {
        await interaction.reply({
            content: '❌ Invalid date format. Please use YYYY-MM-DD HH:MM format.',
            ephemeral: true
        });
        return;
    }

    // Check if date is in the future
    if (dateTime <= new Date()) {
        await interaction.reply({
            content: '❌ Event date must be in the future.',
            ephemeral: true
        });
        return;
    }

    try {
        await interaction.deferReply();

        // Insert event into database
        const stmt = db.prepare(`
            INSERT INTO events (title, description, date_time, channel_id, guild_id, creator_id)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        const result = await new Promise((resolve, reject) => {
            stmt.run([title, description, dateTime.toISOString(), channel.id, interaction.guild.id, interaction.user.id], function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID });
            });
            stmt.finalize();
        });

        // Create embed for event
        const embed = new EmbedBuilder()
            .setColor(0x00AE86)
            .setTitle(`📅 ${title}`)
            .setDescription(description || 'No description provided')
            .addFields(
                { name: '🕐 Date & Time', value: `<t:${Math.floor(dateTime.getTime() / 1000)}:F>`, inline: true },
                { name: '📍 Channel', value: `${channel}`, inline: true },
                { name: '👤 Created by', value: `${interaction.user}`, inline: true }
            )
            .setFooter({ text: `Event ID: ${result.id}` })
            .setTimestamp();

        await interaction.editReply({
            content: '✅ Event created successfully!',
            embeds: [embed]
        });

        // Post to event channel if different from current channel
        if (channel.id !== interaction.channel.id) {
            await channel.send({
                content: '🎉 New event created!',
                embeds: [embed]
            });
        }

    } catch (error) {
        console.error('Error creating event:', error);
        await interaction.editReply({
            content: '❌ Failed to create event. Please try again.',
            ephemeral: true
        });
    }
}