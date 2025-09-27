import cron from 'node-cron';
import { EmbedBuilder } from 'discord.js';
import db from '../database/init.js';

export class SchedulerService {
    constructor(client) {
        this.client = client;
        this.isRunning = false;
    }

    start() {
        if (this.isRunning) return;

        // Check for upcoming events every 5 minutes
        this.eventCheckTask = cron.schedule('*/5 * * * *', () => {
            this.checkUpcomingEvents();
        }, {
            scheduled: false
        });

        // Check for pending reminders every minute
        this.reminderCheckTask = cron.schedule('* * * * *', () => {
            this.checkPendingReminders();
        }, {
            scheduled: false
        });

        this.eventCheckTask.start();
        this.reminderCheckTask.start();
        this.isRunning = true;

        console.log('⏰ Scheduler service started');
    }

    stop() {
        if (!this.isRunning) return;

        if (this.eventCheckTask) {
            this.eventCheckTask.stop();
        }
        if (this.reminderCheckTask) {
            this.reminderCheckTask.stop();
        }

        this.isRunning = false;
        console.log('⏰ Scheduler service stopped');
    }

    async checkUpcomingEvents() {
        try {
            // Get events that need reminders (based on their reminder time)
            const upcomingEvents = await new Promise((resolve, reject) => {
                db.all(`
                    SELECT e.*, COALESCE(bc.default_reminder_minutes, 15) as reminder_minutes
                    FROM events e
                    LEFT JOIN bot_config bc ON e.guild_id = bc.guild_id
                    WHERE e.reminder_sent = 0 
                    AND e.status = 'active'
                    AND datetime(e.date_time, '-' || COALESCE(bc.default_reminder_minutes, 15) || ' minutes') <= datetime('now')
                    AND e.date_time > datetime('now')
                    ORDER BY e.date_time ASC
                `, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });

            for (const event of upcomingEvents) {
                await this.sendEventReminder(event);
            }

        } catch (error) {
            console.error('Error checking upcoming events:', error);
        }
    }

    async checkPendingReminders() {
        try {
            // Get reminders that should be sent now
            const pendingReminders = await new Promise((resolve, reject) => {
                db.all(`
                    SELECT r.*, e.title as event_title 
                    FROM reminders r
                    LEFT JOIN events e ON r.event_id = e.id
                    WHERE r.sent = 0 
                    AND datetime(r.remind_at) <= datetime('now')
                    ORDER BY r.remind_at ASC
                `, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });

            for (const reminder of pendingReminders) {
                await this.sendReminder(reminder);
            }

        } catch (error) {
            console.error('Error checking pending reminders:', error);
        }
    }

    async sendEventReminder(event) {
        try {
            // Get guild config for reminder settings
            const guildConfig = await new Promise((resolve, reject) => {
                db.get('SELECT * FROM bot_config WHERE guild_id = ?', [event.guild_id], (err, row) => {
                    if (err) reject(err);
                    else resolve(row || { default_reminder_minutes: 15 });
                });
            });

            const eventDate = new Date(event.date_time);
            const reminderMinutes = guildConfig.default_reminder_minutes || 15;
            const reminderTime = new Date(eventDate.getTime() - (reminderMinutes * 60 * 1000));
            
            // Only send reminder if we're at the right time (within the reminder window)
            const now = new Date();
            if (now < reminderTime) {
                return; // Too early for reminder
            }

            // Get all users who RSVPed as attending or maybe
            const rsvps = await new Promise((resolve, reject) => {
                db.all(`
                    SELECT DISTINCT user_id, status, username FROM event_rsvps 
                    WHERE event_id = ? AND status IN ('attending', 'maybe')
                `, [event.id], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });

            // Send DMs to attendees (modern event management style)
            let dmSuccessCount = 0;
            for (const rsvp of rsvps) {
                try {
                    const user = await this.client.users.fetch(rsvp.user_id);
                    if (user) {
                        const statusEmoji = rsvp.status === 'attending' ? '✅' : '❓';
                        const embed = new EmbedBuilder()
                            .setColor(0x5865F2)
                            .setTitle('🔔 Event Reminder')
                            .setDescription(`${statusEmoji} You have an upcoming event in ${reminderMinutes} minutes!`)
                            .addFields(
                                { name: '📅 Event', value: `**${event.title}**`, inline: false },
                                { name: '🕐 Time', value: `<t:${Math.floor(eventDate.getTime() / 1000)}:F>`, inline: true },
                                { name: '👥 Your RSVP', value: `${statusEmoji} ${rsvp.status.replace('_', ' ').toUpperCase()}`, inline: true }
                            )
                            .setFooter({ text: 'You can manage your notification preferences in the server settings' });
                        
                        if (event.location) {
                            embed.addFields({ name: '📍 Location', value: event.location, inline: true });
                        }
                        
                        await user.send({ embeds: [embed] });
                        dmSuccessCount++;
                    }
                } catch (dmError) {
                    console.log(`Could not send DM reminder to ${rsvp.username} (${rsvp.user_id}): ${dmError.message}`);
                }
            }

            // Send channel reminder
            const channel = this.client.channels.cache.get(event.channel_id);
            if (channel) {
                const attendingCount = rsvps.filter(r => r.status === 'attending').length;
                const maybeCount = rsvps.filter(r => r.status === 'maybe').length;
                
                const embed = new EmbedBuilder()
                    .setColor(0xFFD700)
                    .setTitle('🔔 Event Starting Soon!')
                    .setDescription(`**${event.title}** starts in ${reminderMinutes} minutes!`)
                    .addFields(
                        { name: '🕐 Start Time', value: `<t:${Math.floor(eventDate.getTime() / 1000)}:F>`, inline: true },
                        { name: '👥 Attendees', value: `**${attendingCount}** attending, **${maybeCount}** maybe`, inline: true }
                    )
                    .setFooter({ text: `Event ID: ${event.id} • ${dmSuccessCount} DM reminders sent` });

                if (event.location) {
                    embed.addFields({ name: '📍 Location', value: event.location, inline: true });
                }
                if (event.description) {
                    embed.addFields({ name: '📝 Description', value: event.description, inline: false });
                }

                await channel.send({ embeds: [embed] });
            }

            // Mark reminder as sent
            await new Promise((resolve, reject) => {
                db.run('UPDATE events SET reminder_sent = 1 WHERE id = ?', [event.id], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });

            console.log(`✅ Event reminder sent for: ${event.title} (${dmSuccessCount} DMs sent)`);

        } catch (error) {
            console.error(`Error sending event reminder for event ${event.id}:`, error);
        }
    }

    async sendReminder(reminder) {
        try {
            const channel = this.client.channels.cache.get(reminder.channel_id);
            if (!channel) {
                console.warn(`Channel ${reminder.channel_id} not found for reminder ${reminder.id}`);
                return;
            }

            const user = this.client.users.cache.get(reminder.user_id);
            const userMention = user ? `<@${user.id}>` : 'User';

            const embed = new EmbedBuilder()
                .setColor(0xFF6B6B)
                .setTitle('🔔 Personal Reminder')
                .setDescription(reminder.message)
                .setFooter({ text: reminder.event_title ? `Related to: ${reminder.event_title}` : 'Personal reminder' })
                .setTimestamp();

            await channel.send({
                content: `${userMention}`,
                embeds: [embed]
            });

            // Mark reminder as sent
            await new Promise((resolve, reject) => {
                db.run('UPDATE reminders SET sent = 1 WHERE id = ?', [reminder.id], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });

            console.log(`✅ Reminder sent for user ${reminder.user_id}`);

        } catch (error) {
            console.error(`Error sending reminder ${reminder.id}:`, error);
        }
    }
}