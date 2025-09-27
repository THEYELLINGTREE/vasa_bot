import express from 'express';
import db from '../database/init.js';

const router = express.Router();

// Get all events (for admin/frontend use)
router.get('/', async (req, res) => {
    try {
        const { limit = 100, upcoming = 'false' } = req.query;
        
        let query = `
            SELECT 
                e.*,
                COUNT(r.id) as rsvp_count,
                SUM(CASE WHEN r.status = 'attending' THEN 1 ELSE 0 END) as attending_count,
                SUM(CASE WHEN r.status = 'maybe' THEN 1 ELSE 0 END) as maybe_count,
                SUM(CASE WHEN r.status = 'not_attending' THEN 1 ELSE 0 END) as not_attending_count
            FROM events e
            LEFT JOIN event_rsvps r ON e.id = r.event_id
        `;
        const params = [];
        
        if (upcoming === 'true') {
            query += ' WHERE e.date_time > datetime("now")';
        }
        
        query += ' GROUP BY e.id ORDER BY e.date_time DESC LIMIT ?';
        params.push(parseInt(limit));

        const events = await new Promise((resolve, reject) => {
            db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        res.json(events);
    } catch (error) {
        console.error('Error fetching all events:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

// Get all events for a guild
router.get('/:guildId', async (req, res) => {
    try {
        const { guildId } = req.params;
        const { limit = 50, upcoming = 'true' } = req.query;
        
        let query = 'SELECT * FROM events WHERE guild_id = ?';
        const params = [guildId];
        
        if (upcoming === 'true') {
            query += ' AND date_time > datetime("now")';
        }
        
        query += ' ORDER BY date_time ASC LIMIT ?';
        params.push(parseInt(limit));

        const events = await new Promise((resolve, reject) => {
            db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        res.json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

// Create new event
router.post('/', async (req, res) => {
    try {
        const { title, description, dateTime, channelId, guildId, creatorId } = req.body;

        if (!title || !dateTime || !channelId || !guildId || !creatorId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Validate date
        const eventDate = new Date(dateTime);
        if (isNaN(eventDate.getTime()) || eventDate <= new Date()) {
            return res.status(400).json({ error: 'Invalid or past date' });
        }

        const result = await new Promise((resolve, reject) => {
            const stmt = db.prepare(`
                INSERT INTO events (title, description, date_time, channel_id, guild_id, creator_id)
                VALUES (?, ?, ?, ?, ?, ?)
            `);
            
            stmt.run([title, description || '', eventDate.toISOString(), channelId, guildId, creatorId], function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID });
            });
            stmt.finalize();
        });

        res.status(201).json({ id: result.id, message: 'Event created successfully' });
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ error: 'Failed to create event' });
    }
});

// Update event
router.put('/:eventId', async (req, res) => {
    try {
        const { eventId } = req.params;
        const { title, description, dateTime } = req.body;

        const updates = [];
        const params = [];

        if (title) {
            updates.push('title = ?');
            params.push(title);
        }
        if (description !== undefined) {
            updates.push('description = ?');
            params.push(description);
        }
        if (dateTime) {
            const eventDate = new Date(dateTime);
            if (isNaN(eventDate.getTime()) || eventDate <= new Date()) {
                return res.status(400).json({ error: 'Invalid or past date' });
            }
            updates.push('date_time = ?');
            params.push(eventDate.toISOString());
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        params.push(eventId);

        await new Promise((resolve, reject) => {
            db.run(`UPDATE events SET ${updates.join(', ')} WHERE id = ?`, params, function(err) {
                if (err) reject(err);
                else resolve();
            });
        });

        res.json({ message: 'Event updated successfully' });
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ error: 'Failed to update event' });
    }
});

// Delete event
router.delete('/:eventId', async (req, res) => {
    try {
        const { eventId } = req.params;

        await new Promise((resolve, reject) => {
            db.run('DELETE FROM events WHERE id = ?', [eventId], function(err) {
                if (err) reject(err);
                else resolve();
            });
        });

        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ error: 'Failed to delete event' });
    }
});

// Get reminders for an event
router.get('/:eventId/reminders', async (req, res) => {
    try {
        const { eventId } = req.params;

        const reminders = await new Promise((resolve, reject) => {
            db.all('SELECT * FROM reminders WHERE event_id = ? ORDER BY remind_at ASC', [eventId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        res.json(reminders);
    } catch (error) {
        console.error('Error fetching reminders:', error);
        res.status(500).json({ error: 'Failed to fetch reminders' });
    }
});

// Create reminder for event
router.post('/:eventId/reminders', async (req, res) => {
    try {
        const { eventId } = req.params;
        const { message, remindAt, channelId, userId } = req.body;

        if (!message || !remindAt || !channelId || !userId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const reminderDate = new Date(remindAt);
        if (isNaN(reminderDate.getTime()) || reminderDate <= new Date()) {
            return res.status(400).json({ error: 'Invalid or past reminder date' });
        }

        const result = await new Promise((resolve, reject) => {
            const stmt = db.prepare(`
                INSERT INTO reminders (event_id, message, remind_at, channel_id, user_id)
                VALUES (?, ?, ?, ?, ?)
            `);
            
            stmt.run([eventId, message, reminderDate.toISOString(), channelId, userId], function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID });
            });
            stmt.finalize();
        });

        res.status(201).json({ id: result.id, message: 'Reminder created successfully' });
    } catch (error) {
        console.error('Error creating reminder:', error);
        res.status(500).json({ error: 'Failed to create reminder' });
    }
});

export default router;