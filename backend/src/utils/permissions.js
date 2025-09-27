import db from '../database/init.js';

export class PermissionManager {
    /**
     * Check if user can create events
     */
    static async canCreateEvents(guildId, userId, member) {
        // Check if user has Manage Server permission (always allowed)
        if (member.permissions.has('ManageGuild')) {
            return true;
        }

        // Check guild configuration
        const guildConfig = await this.getGuildConfig(guildId);
        if (!guildConfig.allow_event_creation) {
            return false;
        }

        if (guildConfig.require_manage_server_for_all) {
            return false;
        }

        // Check specific permissions for this user/roles
        const hasPermission = await this.checkPermission(guildId, 'create_event', userId, member.roles.cache.map(r => r.id));
        return hasPermission;
    }

    /**
     * Check if user can edit/delete a specific event
     */
    static async canModifyEvent(guildId, userId, member, eventCreatorId) {
        // Event creator can always modify their events
        if (userId === eventCreatorId) {
            return true;
        }

        // Users with Manage Server can modify any event
        if (member.permissions.has('ManageGuild')) {
            return true;
        }

        return false;
    }

    /**
     * Check specific permission type for user
     */
    static async checkPermission(guildId, permissionType, userId, roleIds) {
        return new Promise((resolve, reject) => {
            db.all(`
                SELECT * FROM guild_permissions 
                WHERE guild_id = ? AND permission_type = ? 
                AND (user_id = ? OR role_id IN (${roleIds.map(() => '?').join(',')}))
                ORDER BY user_id IS NOT NULL DESC, allowed DESC
            `, [guildId, permissionType, userId, ...roleIds], (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }

                // If no specific permissions set, default to allowed
                if (rows.length === 0) {
                    resolve(true);
                    return;
                }

                // Return the first (most specific) permission
                resolve(rows[0].allowed === 1);
            });
        });
    }

    /**
     * Get guild configuration
     */
    static async getGuildConfig(guildId) {
        return new Promise((resolve, reject) => {
            db.get(`
                SELECT * FROM bot_config WHERE guild_id = ?
            `, [guildId], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }

                // Return default config if not found
                resolve(row || {
                    guild_id: guildId,
                    allow_event_creation: true,
                    require_manage_server_for_all: false,
                    default_reminder_minutes: 15,
                    timezone: 'UTC'
                });
            });
        });
    }

    /**
     * Set permission for role or user
     */
    static async setPermission(guildId, permissionType, targetId, targetType, allowed) {
        return new Promise((resolve, reject) => {
            const stmt = db.prepare(`
                INSERT OR REPLACE INTO guild_permissions 
                (guild_id, permission_type, ${targetType === 'role' ? 'role_id' : 'user_id'}, allowed)
                VALUES (?, ?, ?, ?)
            `);

            stmt.run([guildId, permissionType, targetId, allowed ? 1 : 0], function(err) {
                stmt.finalize();
                if (err) reject(err);
                else resolve({ changes: this.changes });
            });
        });
    }

    /**
     * Update guild configuration
     */
    static async updateGuildConfig(guildId, config) {
        return new Promise((resolve, reject) => {
            const stmt = db.prepare(`
                INSERT OR REPLACE INTO bot_config 
                (guild_id, allow_event_creation, require_manage_server_for_all, default_reminder_minutes, timezone, updated_at)
                VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `);

            stmt.run([
                guildId,
                config.allow_event_creation,
                config.require_manage_server_for_all,
                config.default_reminder_minutes,
                config.timezone
            ], function(err) {
                stmt.finalize();
                if (err) reject(err);
                else resolve({ changes: this.changes });
            });
        });
    }
}