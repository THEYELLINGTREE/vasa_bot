import { Client, GatewayIntentBits, Collection } from 'discord.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

import { initializeDatabase } from './database/init.js';
import { SchedulerService } from './services/SchedulerService.js';
import eventRoutes from './routes/events.js';
import botRoutes from './routes/bot.js';
import authRoutes, { authenticateToken } from './routes/auth.js';
import { handleEventCreationStart, handleEventBasicInfoSubmission } from './commands/event.js';
import { handleRSVPButton } from './commands/rsvp.js';
import logger from './utils/logger.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:5173'],
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api', limiter);

app.use(express.json());
app.use(cookieParser());

// Initialize collections
client.commands = new Collection();
client.events = new Collection();

// Load commands
const loadCommands = async () => {
    const commandsPath = join(__dirname, 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
        const filePath = join(commandsPath, file);
        // Convert Windows path to file:// URL for ESM import
        const fileUrl = new URL(`file:///${filePath.replace(/\\/g, '/')}`);
        const command = await import(fileUrl.href);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            logger.info(`Command loaded: ${command.data.name}`, { action: 'command_load', commandName: command.data.name });
        }
    }
};

// Discord event handlers
client.once('ready', async () => {
    logger.info(`Bot is ready! Logged in as ${client.user.tag}`, { 
        action: 'bot_ready',
        botId: client.user.id,
        botTag: client.user.tag
    });
    
    // Start scheduler service
    const scheduler = new SchedulerService(client);
    scheduler.start();
    logger.info('Scheduler service started', { action: 'scheduler_start' });
});

client.on('interactionCreate', async (interaction) => {
    try {
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) {
                logger.error('Command not found', {
                    userId: interaction.user.id,
                    guildId: interaction.guild?.id,
                    commandName: interaction.commandName,
                    action: 'command_not_found'
                });
                return;
            }
            
            logger.debug('Executing command', {
                userId: interaction.user.id,
                guildId: interaction.guild?.id,
                commandName: interaction.commandName,
                action: 'command_execute'
            });
            
            await command.execute(interaction);
        } else if (interaction.isButton()) {
            await handleButtonInteraction(interaction);
        } else if (interaction.isModalSubmit()) {
            await handleModalSubmission(interaction);
        }
    } catch (error) {
        logger.discordError('Error handling interaction', interaction, { 
            error: error.message,
            stack: error.stack
        });
        
        const reply = { content: 'There was an error while processing this interaction!', ephemeral: true };
        
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(reply);
        } else {
            await interaction.reply(reply);
        }
    }
});

// API Routes
app.use('/auth', authRoutes);
app.use('/api/events', authenticateToken, eventRoutes);
app.use('/api/bot', authenticateToken, botRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        bot_status: client.isReady() ? 'online' : 'offline',
        mode: (!process.env.DISCORD_TOKEN || process.env.DISCORD_TOKEN === 'your_discord_bot_token_here') ? 'api-only' : 'full'
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    logger.apiError('API Error', req, { 
        error: error.message,
        stack: error.stack 
    });
    res.status(500).json({ error: 'Internal server error' });
});

// Start services
const startServices = async () => {
    try {
        // Initialize database first (independent of Discord)
        await initializeDatabase();
        logger.info('Database initialized', { action: 'database_init' });
        
        // Load commands
        await loadCommands();
        
        // Check if Discord credentials are provided
        if (!process.env.DISCORD_TOKEN || process.env.DISCORD_TOKEN === 'your_discord_bot_token_here') {
            logger.warn('Discord bot token not configured. Bot will run in API-only mode.', {
                action: 'api_only_mode'
            });
            logger.warn('To use Discord features, update DISCORD_TOKEN in backend/.env', {
                action: 'configuration_warning'
            });
        } else {
            // Start Discord bot
            await client.login(process.env.DISCORD_TOKEN);
        }
        
        // Start Express server
        app.listen(PORT, () => {
            logger.info(`API server running on http://localhost:${PORT}`, { 
                action: 'server_start',
                port: PORT
            });
            
            if (!process.env.DISCORD_TOKEN || process.env.DISCORD_TOKEN === 'your_discord_bot_token_here') {
                logger.info('Web interface available (Discord bot features disabled)', {
                    action: 'api_only_ready'
                });
            } else {
                logger.info('Discord bot and web interface ready', {
                    action: 'full_service_ready'
                });
            }
        });
        
    } catch (error) {
        logger.error('Failed to start services', { 
            error: error.message,
            stack: error.stack,
            action: 'startup_failure'
        });
        
        if (error.message.includes('TOKEN_INVALID')) {
            logger.error('Invalid Discord token. Please check your .env file.', {
                action: 'invalid_token'
            });
        }
        
        process.exit(1);
    }
};

// Handle graceful shutdown
process.on('SIGINT', () => {
    logger.info('Shutting down gracefully...', { action: 'graceful_shutdown' });
    client.destroy();
    process.exit(0);
});

// Button interaction handler
async function handleButtonInteraction(interaction) {
    const customId = interaction.customId;
    
    if (customId.startsWith('create_event_start_')) {
        const [, , , guildId, channelId] = customId.split('_');
        await handleEventCreationStart(interaction, guildId, channelId);
    } else if (customId.startsWith('rsvp_')) {
        const [, action, eventId] = customId.split('_');
        await handleRSVPButton(interaction, action, eventId);
    } else if (customId.startsWith('event_details_')) {
        const [, , eventId] = customId.split('_');
        // Handle event details view (to be implemented)
        await interaction.reply({
            content: `📋 Event details for event ${eventId} - Feature coming soon!`,
            ephemeral: true
        });
    }
}

// Modal submission handler
async function handleModalSubmission(interaction) {
    const customId = interaction.customId;
    
    if (customId.startsWith('event_basic_info_')) {
        const [, , , guildId, channelId] = customId.split('_');
        await handleEventBasicInfoSubmission(interaction, guildId, channelId);
    }
}

startServices();
