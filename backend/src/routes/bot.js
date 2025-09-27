import express from 'express';
import db from '../database/init.js';

const router = express.Router();

// Get bot status and stats
router.get('/status', async (req, res) => {
    try {
        // Get event counts
        const eventStats = await new Promise((resolve, reject) => {
            db.get(`
                SELECT 
                    COUNT(*) as total_events,
                    COUNT(CASE WHEN date_time > datetime('now') THEN 1 END) as upcoming_events,
                    COUNT(CASE WHEN reminder_sent = 1 THEN 1 END) as events_with_reminders
                FROM events
            `, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        // Get reminder counts
        const reminderStats = await new Promise((resolve, reject) => {
            db.get(`
                SELECT 
                    COUNT(*) as total_reminders,
                    COUNT(CASE WHEN sent = 0 AND remind_at > datetime('now') THEN 1 END) as pending_reminders,
                    COUNT(CASE WHEN sent = 1 THEN 1 END) as sent_reminders
                FROM reminders
            `, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        // Get guild count (assuming we store this info somewhere or calculate it)
        const guildStats = await new Promise((resolve, reject) => {
            db.get(`
                SELECT COUNT(DISTINCT guild_id) as total_guilds
                FROM events
            `, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        res.json({
            status: 'online',
            uptime: process.uptime(),
            stats: {
                events: eventStats,
                reminders: reminderStats,
                guilds: guildStats
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error getting bot status:', error);
        res.status(500).json({ error: 'Failed to get bot status' });
    }
});

// Get guild configuration
router.get('/config/:guildId', async (req, res) => {
    try {
        const { guildId } = req.params;

        const config = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM bot_config WHERE guild_id = ?', [guildId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!config) {
            // Return default config
            res.json({
                guild_id: guildId,
                prefix: '!',
                timezone: 'UTC',
                event_channel_id: null,
                announcement_channel_id: null
            });
        } else {
            res.json(config);
        }
    } catch (error) {
        console.error('Error getting guild config:', error);
        res.status(500).json({ error: 'Failed to get guild configuration' });
    }
});

// Update guild configuration
router.put('/config/:guildId', async (req, res) => {
    try {
        const { guildId } = req.params;
        const { prefix, timezone, eventChannelId, announcementChannelId } = req.body;

        // Check if config exists
        const existingConfig = await new Promise((resolve, reject) => {
            db.get('SELECT id FROM bot_config WHERE guild_id = ?', [guildId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (existingConfig) {
            // Update existing config
            const updates = [];
            const params = [];

            if (prefix) {
                updates.push('prefix = ?');
                params.push(prefix);
            }
            if (timezone) {
                updates.push('timezone = ?');
                params.push(timezone);
            }
            if (eventChannelId !== undefined) {
                updates.push('event_channel_id = ?');
                params.push(eventChannelId);
            }
            if (announcementChannelId !== undefined) {
                updates.push('announcement_channel_id = ?');
                params.push(announcementChannelId);
            }

            if (updates.length > 0) {
                updates.push('updated_at = CURRENT_TIMESTAMP');
                params.push(guildId);

                await new Promise((resolve, reject) => {
                    db.run(`UPDATE bot_config SET ${updates.join(', ')} WHERE guild_id = ?`, params, (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
            }
        } else {
            // Create new config
            await new Promise((resolve, reject) => {
                const stmt = db.prepare(`
                    INSERT INTO bot_config (guild_id, prefix, timezone, event_channel_id, announcement_channel_id)
                    VALUES (?, ?, ?, ?, ?)
                `);
                
                stmt.run([
                    guildId, 
                    prefix || '!', 
                    timezone || 'UTC', 
                    eventChannelId || null, 
                    announcementChannelId || null
                ], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
                stmt.finalize();
            });
        }

        res.json({ message: 'Configuration updated successfully' });
    } catch (error) {
        console.error('Error updating guild config:', error);
        res.status(500).json({ error: 'Failed to update guild configuration' });
    }
});

// Get social media feeds (placeholder for future implementation)
router.get('/feeds/:guildId', async (req, res) => {
    try {
        const { guildId } = req.params;

        const feeds = await new Promise((resolve, reject) => {
            db.all('SELECT * FROM social_feeds WHERE guild_id = ? AND active = 1', [guildId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        res.json(feeds);
    } catch (error) {
        console.error('Error getting social feeds:', error);
        res.status(500).json({ error: 'Failed to get social media feeds' });
    }
});

export default router;