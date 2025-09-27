import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import db from '../database/init.js';

export const data = new SlashCommandBuilder()
    .setName('list-events')
    .setDescription('List upcoming events')
    .addIntegerOption(option =>
        option.setName('limit')
            .setDescription('Number of events to show (default: 5)')
            .setMinValue(1)
            .setMaxValue(10));

export async function execute(interaction) {
    const limit = interaction.options.getInteger('limit') || 5;

    try {
        await interaction.deferReply();

        // Get upcoming events from database
        const events = await new Promise((resolve, reject) => {
            db.all(`
                SELECT * FROM events 
                WHERE guild_id = ? AND date_time > datetime('now') 
                ORDER BY date_time ASC 
                LIMIT ?
            `, [interaction.guild.id, limit], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        if (events.length === 0) {
            await interaction.editReply({
                content: '📅 No upcoming events found.',
                ephemeral: true
            });
            return;
        }

        // Create embed with events list
        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('📅 Upcoming Events')
            .setDescription(`Showing ${events.length} upcoming event(s)`)
            .setTimestamp();

        events.forEach((event, index) => {
            const eventDate = new Date(event.date_time);
            const channel = interaction.guild.channels.cache.get(event.channel_id);
            
            embed.addFields({
                name: `${index + 1}. ${event.title}`,
                value: `**Description:** ${event.description || 'No description'}\n**Date:** <t:${Math.floor(eventDate.getTime() / 1000)}:F>\n**Channel:** ${channel ? channel.toString() : 'Unknown'}\n**ID:** ${event.id}`,
                inline: false
            });
        });

        await interaction.editReply({
            embeds: [embed]
        });

    } catch (error) {
        console.error('Error listing events:', error);
        await interaction.editReply({
            content: '❌ Failed to retrieve events. Please try again.',
            ephemeral: true
        });
    }
}