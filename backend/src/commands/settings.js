import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { PermissionManager } from '../utils/permissions.js';

export const data = new SlashCommandBuilder()
    .setName('settings')
    .setDescription('Manage bot settings and permissions (Manage Server required)')
    .addSubcommand(subcommand =>
        subcommand
            .setName('view')
            .setDescription('View current bot settings'))
    .addSubcommand(subcommand =>
        subcommand
            .setName('role')
            .setDescription('Configure role permissions')
            .addRoleOption(option =>
                option.setName('role')
                    .setDescription('Role to configure')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('permission')
                    .setDescription('Permission to set')
                    .setRequired(true)
                    .addChoices(
                        { name: 'Create Events', value: 'create_event' },
                        { name: 'Manage All Events', value: 'manage_all_events' }
                    ))
            .addBooleanOption(option =>
                option.setName('allowed')
                    .setDescription('Allow or deny this permission')
                    .setRequired(true)))
    .addSubcommand(subcommand =>
        subcommand
            .setName('user')
            .setDescription('Configure user permissions')
            .addUserOption(option =>
                option.setName('user')
                    .setDescription('User to configure')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('permission')
                    .setDescription('Permission to set')
                    .setRequired(true)
                    .addChoices(
                        { name: 'Create Events', value: 'create_event' },
                        { name: 'Manage All Events', value: 'manage_all_events' }
                    ))
            .addBooleanOption(option =>
                option.setName('allowed')
                    .setDescription('Allow or deny this permission')
                    .setRequired(true)))
    .addSubcommand(subcommand =>
        subcommand
            .setName('general')
            .setDescription('Configure general bot settings')
            .addBooleanOption(option =>
                option.setName('allow_event_creation')
                    .setDescription('Allow event creation by default'))
            .addBooleanOption(option =>
                option.setName('require_manage_server')
                    .setDescription('Require Manage Server permission for all actions'))
            .addIntegerOption(option =>
                option.setName('default_reminder_minutes')
                    .setDescription('Default reminder time in minutes')
                    .setMinValue(5)
                    .setMaxValue(1440)) // 24 hours
            .addStringOption(option =>
                option.setName('timezone')
                    .setDescription('Default timezone for the server')
                    .setMaxLength(50)));

export async function execute(interaction) {
    // Check if user has Manage Server permission
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        await interaction.reply({
            content: '❌ You need the **Manage Server** permission to use bot settings.',
            ephemeral: true
        });
        return;
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'view') {
        await handleViewSettings(interaction);
    } else if (subcommand === 'role') {
        await handleRolePermission(interaction);
    } else if (subcommand === 'user') {
        await handleUserPermission(interaction);
    } else if (subcommand === 'general') {
        await handleGeneralSettings(interaction);
    }
}

async function handleViewSettings(interaction) {
    try {
        await interaction.deferReply({ ephemeral: true });

        const guildConfig = await PermissionManager.getGuildConfig(interaction.guild.id);

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('⚙️ Bot Settings')
            .setDescription(`Settings for **${interaction.guild.name}**`)
            .addFields(
                {
                    name: '🔧 General Settings',
                    value: [
                        `**Allow Event Creation:** ${guildConfig.allow_event_creation ? '✅ Yes' : '❌ No'}`,
                        `**Require Manage Server:** ${guildConfig.require_manage_server_for_all ? '✅ Yes' : '❌ No'}`,
                        `**Default Reminder Time:** ${guildConfig.default_reminder_minutes} minutes`,
                        `**Timezone:** ${guildConfig.timezone}`
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '📋 How Permissions Work',
                    value: [
                        '• Users with **Manage Server** can always create and manage events',
                        '• Role/user specific permissions override general settings',
                        '• Use `/settings role` or `/settings user` to set specific permissions',
                        '• Use `/settings general` to change general settings'
                    ].join('\n'),
                    inline: false
                }
            )
            .setTimestamp()
            .setFooter({ text: 'Use /settings help for more information' });

        await interaction.editReply({
            embeds: [embed]
        });

    } catch (error) {
        console.error('Error viewing settings:', error);
        await interaction.editReply({
            content: '❌ Failed to retrieve settings. Please try again.',
        });
    }
}

async function handleRolePermission(interaction) {
    const role = interaction.options.getRole('role');
    const permission = interaction.options.getString('permission');
    const allowed = interaction.options.getBoolean('allowed');

    try {
        await interaction.deferReply({ ephemeral: true });

        await PermissionManager.setPermission(interaction.guild.id, permission, role.id, 'role', allowed);

        const actionText = allowed ? 'granted' : 'denied';
        const emoji = allowed ? '✅' : '❌';
        const permissionName = permission === 'create_event' ? 'Create Events' : 'Manage All Events';

        await interaction.editReply({
            content: `${emoji} **Permission Updated!**\n\n**Role:** ${role}\n**Permission:** ${permissionName}\n**Status:** ${actionText.toUpperCase()}`
        });

    } catch (error) {
        console.error('Error setting role permission:', error);
        await interaction.editReply({
            content: '❌ Failed to update role permission. Please try again.',
        });
    }
}

async function handleUserPermission(interaction) {
    const user = interaction.options.getUser('user');
    const permission = interaction.options.getString('permission');
    const allowed = interaction.options.getBoolean('allowed');

    try {
        await interaction.deferReply({ ephemeral: true });

        await PermissionManager.setPermission(interaction.guild.id, permission, user.id, 'user', allowed);

        const actionText = allowed ? 'granted' : 'denied';
        const emoji = allowed ? '✅' : '❌';
        const permissionName = permission === 'create_event' ? 'Create Events' : 'Manage All Events';

        await interaction.editReply({
            content: `${emoji} **Permission Updated!**\n\n**User:** ${user}\n**Permission:** ${permissionName}\n**Status:** ${actionText.toUpperCase()}`
        });

    } catch (error) {
        console.error('Error setting user permission:', error);
        await interaction.editReply({
            content: '❌ Failed to update user permission. Please try again.',
        });
    }
}

async function handleGeneralSettings(interaction) {
    const allowEventCreation = interaction.options.getBoolean('allow_event_creation');
    const requireManageServer = interaction.options.getBoolean('require_manage_server');
    const defaultReminderMinutes = interaction.options.getInteger('default_reminder_minutes');
    const timezone = interaction.options.getString('timezone');

    try {
        await interaction.deferReply({ ephemeral: true });

        // Get current config
        const currentConfig = await PermissionManager.getGuildConfig(interaction.guild.id);

        // Update only provided values
        const newConfig = {
            allow_event_creation: allowEventCreation !== null ? allowEventCreation : currentConfig.allow_event_creation,
            require_manage_server_for_all: requireManageServer !== null ? requireManageServer : currentConfig.require_manage_server_for_all,
            default_reminder_minutes: defaultReminderMinutes !== null ? defaultReminderMinutes : currentConfig.default_reminder_minutes,
            timezone: timezone !== null ? timezone : currentConfig.timezone
        };

        await PermissionManager.updateGuildConfig(interaction.guild.id, newConfig);

        const changes = [];
        if (allowEventCreation !== null) {
            changes.push(`**Allow Event Creation:** ${allowEventCreation ? '✅ Enabled' : '❌ Disabled'}`);
        }
        if (requireManageServer !== null) {
            changes.push(`**Require Manage Server:** ${requireManageServer ? '✅ Enabled' : '❌ Disabled'}`);
        }
        if (defaultReminderMinutes !== null) {
            changes.push(`**Default Reminder Time:** ${defaultReminderMinutes} minutes`);
        }
        if (timezone !== null) {
            changes.push(`**Timezone:** ${timezone}`);
        }

        await interaction.editReply({
            content: `✅ **Settings Updated!**\n\n${changes.join('\n')}`
        });

    } catch (error) {
        console.error('Error updating general settings:', error);
        await interaction.editReply({
            content: '❌ Failed to update settings. Please try again.',
        });
    }
}