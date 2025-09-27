import fs from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure logs directory exists
const logsDir = join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

class Logger {
    constructor() {
        this.logFile = join(logsDir, 'vasa_bot.log');
    }

    formatMessage(level, message, context = {}) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level: level.toUpperCase(),
            message,
            ...context
        };
        
        return JSON.stringify(logEntry);
    }

    writeToFile(logEntry) {
        if (process.env.NODE_ENV !== 'test') {
            fs.appendFileSync(this.logFile, logEntry + '\n');
        }
    }

    log(level, message, context = {}) {
        const formattedMessage = this.formatMessage(level, message, context);
        
        // Console output
        const consoleMessage = `[${level.toUpperCase()}] ${message}`;
        if (context.userId || context.guildId || context.action) {
            const contextStr = [
                context.userId ? `User:${context.userId}` : null,
                context.guildId ? `Guild:${context.guildId}` : null,
                context.action ? `Action:${context.action}` : null
            ].filter(Boolean).join(' | ');
            
            console.log(`${consoleMessage} [${contextStr}]`);
        } else {
            console.log(consoleMessage);
        }
        
        // File output
        this.writeToFile(formattedMessage);
    }

    error(message, context = {}) {
        this.log('error', message, context);
    }

    warn(message, context = {}) {
        this.log('warn', message, context);
    }

    info(message, context = {}) {
        this.log('info', message, context);
    }

    debug(message, context = {}) {
        if (process.env.NODE_ENV === 'development') {
            this.log('debug', message, context);
        }
    }

    // Helper methods for common Discord contexts
    discordError(message, interaction, additionalContext = {}) {
        const context = {
            userId: interaction?.user?.id,
            guildId: interaction?.guild?.id,
            channelId: interaction?.channel?.id,
            commandName: interaction?.commandName,
            action: interaction?.customId || interaction?.commandName || 'unknown',
            ...additionalContext
        };
        this.error(message, context);
    }

    apiError(message, req, additionalContext = {}) {
        const context = {
            userId: req?.user?.id,
            method: req?.method,
            url: req?.url,
            ip: req?.ip,
            userAgent: req?.get('User-Agent'),
            ...additionalContext
        };
        this.error(message, context);
    }

    securityEvent(message, context = {}) {
        this.error(`SECURITY: ${message}`, {
            ...context,
            security: true
        });
    }
}

export default new Logger();