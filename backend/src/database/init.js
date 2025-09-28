import sqlite3 from 'sqlite3';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = process.env.DATABASE_PATH || join(__dirname, '../../data/vasa_bot.db');

// Ensure data directory exists
const dataDir = dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite3.Database(DB_PATH);

export const initializeDatabase = () => {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Events table
            db.run(`CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT,
                date_time DATETIME NOT NULL,
                channel_id TEXT NOT NULL,
                guild_id TEXT NOT NULL,
                creator_id TEXT NOT NULL,
                max_attendees INTEGER,
                image_url TEXT,
                location TEXT,
                reminder_sent BOOLEAN DEFAULT 0,
                signup_restrictions TEXT DEFAULT 'none',
                required_roles TEXT,
                status TEXT DEFAULT 'active',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            // Event RSVPs table
            db.run(`CREATE TABLE IF NOT EXISTS event_rsvps (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_id INTEGER NOT NULL,
                user_id TEXT NOT NULL,
                username TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'attending',
                response_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                notes TEXT,
                FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
                UNIQUE(event_id, user_id)
            )`);

            // Guild permissions table
            db.run(`CREATE TABLE IF NOT EXISTS guild_permissions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id TEXT NOT NULL,
                permission_type TEXT NOT NULL,
                role_id TEXT,
                user_id TEXT,
                allowed BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(guild_id, permission_type, role_id, user_id)
            )`);

            // User preferences table
            db.run(`CREATE TABLE IF NOT EXISTS user_preferences (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                guild_id TEXT NOT NULL,
                reminder_dm BOOLEAN DEFAULT 1,
                reminder_minutes INTEGER DEFAULT 15,
                timezone TEXT DEFAULT 'UTC',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, guild_id)
            )`);

            // Reminders table
            db.run(`CREATE TABLE IF NOT EXISTS reminders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_id INTEGER,
                message TEXT NOT NULL,
                remind_at DATETIME NOT NULL,
                channel_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                sent BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE
            )`);

            // Social media feeds table (for future use)
            db.run(`CREATE TABLE IF NOT EXISTS social_feeds (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                platform TEXT NOT NULL,
                feed_url TEXT NOT NULL,
                channel_id TEXT NOT NULL,
                guild_id TEXT NOT NULL,
                last_post_id TEXT,
                active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            // Bot configuration table
            db.run(`CREATE TABLE IF NOT EXISTS bot_config (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id TEXT NOT NULL UNIQUE,
                prefix TEXT DEFAULT '!',
                event_channel_id TEXT,
                announcement_channel_id TEXT,
                timezone TEXT DEFAULT 'UTC',
                default_reminder_minutes INTEGER DEFAULT 15,
                allow_event_creation BOOLEAN DEFAULT 1,
                require_manage_server_for_all BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            // Create indexes for performance
            db.run('CREATE INDEX IF NOT EXISTS idx_events_guild_id ON events(guild_id)');
            db.run('CREATE INDEX IF NOT EXISTS idx_events_date_time ON events(date_time)');
            db.run('CREATE INDEX IF NOT EXISTS idx_events_creator_id ON events(creator_id)');
            db.run('CREATE INDEX IF NOT EXISTS idx_events_status ON events(status)');
            
            db.run('CREATE INDEX IF NOT EXISTS idx_rsvps_event_id ON event_rsvps(event_id)');
            db.run('CREATE INDEX IF NOT EXISTS idx_rsvps_user_id ON event_rsvps(user_id)');
            db.run('CREATE INDEX IF NOT EXISTS idx_rsvps_status ON event_rsvps(status)');
            
            db.run('CREATE INDEX IF NOT EXISTS idx_permissions_guild_id ON guild_permissions(guild_id)');
            db.run('CREATE INDEX IF NOT EXISTS idx_permissions_user_id ON guild_permissions(user_id)');
            db.run('CREATE INDEX IF NOT EXISTS idx_permissions_role_id ON guild_permissions(role_id)');
            
            db.run('CREATE INDEX IF NOT EXISTS idx_reminders_event_id ON reminders(event_id)');
            db.run('CREATE INDEX IF NOT EXISTS idx_reminders_remind_at ON reminders(remind_at)');
            db.run('CREATE INDEX IF NOT EXISTS idx_reminders_sent ON reminders(sent)');
            
            db.run('CREATE INDEX IF NOT EXISTS idx_config_guild_id ON bot_config(guild_id)');
            
            console.log('📊 Database tables and indexes initialized');
            resolve();
        });
    });
};

export const getDatabase = () => db;

export default db;