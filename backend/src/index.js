import { Client, GatewayIntentBits, Collection } from 'discord.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

import { initializeDatabase } from './database/init.js';
import { SchedulerService } from './services/SchedulerService.js';
import eventRoutes from './routes/events.js';
import botRoutes from './routes/bot.js';
import { handleEventCreationStart, handleEventBasicInfoSubmission } from './commands/event.js';
import { handleRSVPButton } from './commands/rsvp.js';

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

// Initialize collections
client.commands = new Collection();
client.events = new Collection();

// Load commands
const loadCommands = async () => {
    const commandsPath = join(__dirname, 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
        const filePath = join(commandsPath, file);
        const command = await import(filePath);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            console.log(`✅ Loaded command: ${command.data.name}`);
        }
    }
};

// Discord event handlers
client.once('ready', async () => {
    console.log(`🤖 Bot is ready! Logged in as ${client.user.tag}`);
    
    // Initialize database
    await initializeDatabase();
    console.log('📊 Database initialized');
    
    // Start scheduler service
    const scheduler = new SchedulerService(client);
    scheduler.start();
    console.log('⏰ Scheduler service started');
});

client.on('interactionCreate', async (interaction) => {
    try {
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }
            await command.execute(interaction);
        } else if (interaction.isButton()) {
            await handleButtonInteraction(interaction);
        } else if (interaction.isModalSubmit()) {
            await handleModalSubmission(interaction);
        }
    } catch (error) {
        console.error('Error handling interaction:', error);
        const reply = { content: 'There was an error while processing this interaction!', ephemeral: true };
        
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(reply);
        } else {
            await interaction.reply(reply);
        }
    }
});

// API Routes
app.use('/api/events', eventRoutes);
app.use('/api/bot', botRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        bot_status: client.isReady() ? 'online' : 'offline'
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// Start services
const startServices = async () => {
    try {
        // Load commands
        await loadCommands();
        
        // Start Discord bot
        await client.login(process.env.DISCORD_TOKEN);
        
        // Start Express server
        app.listen(PORT, () => {
            console.log(`🚀 API server running on http://localhost:${PORT}`);
        });
        
    } catch (error) {
        console.error('Failed to start services:', error);
        process.exit(1);
    }
};

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('🔄 Shutting down gracefully...');
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
