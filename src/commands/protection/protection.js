const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('protection')
        .setDescription('إدارة أنظمة الحماية')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('عرض حالة جميع أنظمة الحماية'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('toggle')
                .setDescription('تفعيل أو تعطيل نظام حماية')
                .addStringOption(option =>
                    option.setName('system')
                        .setDescription('نظام الحماية')
                        .setRequired(true)
                        .addChoices(
                            { name: 'حماية الرتب', value: 'antiRoles' },
                            { name: 'حماية القنوات', value: 'antiChannels' },
                            { name: 'حماية البوتات', value: 'antiBots' },
                            { name: 'حماية الروابط', value: 'antiLinks' },
                            { name: 'حماية الحسابات الوهمية', value: 'antiAlt' },
                            { name: 'حماية الويب هوك', value: 'antiWebhook' },
                            { name: 'حماية البرون', value: 'antiPrune' },
                            { name: 'حماية السبام', value: 'antiSpam' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('config')
                .setDescription('تكوين نظام حماية')
                .addStringOption(option =>
                    option.setName('system')
                        .setDescription('نظام الحماية')
                        .setRequired(true)
                        .addChoices(
                            { name: 'حماية الرتب', value: 'antiRoles' },
                            { name: 'حماية القنوات', value: 'antiChannels' },
                            { name: 'حماية البوتات', value: 'antiBots' },
                            { name: 'حماية الروابط', value: 'antiLinks' },
                            { name: 'حماية الحسابات الوهمية', value: 'antiAlt' },
                            { name: 'حماية الويب هوك', value: 'antiWebhook' },
                            { name: 'حماية البرون', value: 'antiPrune' },
                            { name: 'حماية السبام', value: 'antiSpam' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('action')
                .setDescription('تحديد إجراء نظام الحماية')
                .addStringOption(option =>
                    option.setName('system')
                        .setDescription('نظام الحماية')
                        .setRequired(true)
                        .addChoices(
                            { name: 'حماية الرتب', value: 'antiRoles' },
                            { name: 'حماية القنوات', value: 'antiChannels' },
                            { name: 'حماية البوتات', value: 'antiBots' },
                            { name: 'حماية الروابط', value: 'antiLinks' },
                            { name: 'حماية الحسابات الوهمية', value: 'antiAlt' },
                            { name: 'حماية الويب هوك', value: 'antiWebhook' },
                            { name: 'حماية البرون', value: 'antiPrune' },
                            { name: 'حماية السبام', value: 'antiSpam' }
                        ))
                .addStringOption(option =>
                    option.setName('action')
                        .setDescription('الإجراء المطلوب')
                        .setRequired(true)
                        .addChoices(
                            { name: 'حظر', value: 'ban' },
                            { name: 'طرد', value: 'kick' },
                            { name: 'إزالة الصلاحيات', value: 'removePermissions' },
                            { name: 'سحب الرتب', value: 'removeRoles' },
                            { name: 'كتم', value: 'mute' },
                            { name: 'حذف', value: 'delete' },
                            { name: 'تحذير', value: 'warn' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('panel')
                .setDescription('عرض لوحة التحكم التفاعلية')),

    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        try {
            switch (subcommand) {
                case 'status':
                    await this.showStatus(interaction, client, guildId);
                    break;
                case 'toggle':
                    await this.toggleProtection(interaction, client, guildId);
                    break;
                case 'config':
                    await this.configProtection(interaction, client, guildId);
                    break;
                case 'action':
                    await this.setAction(interaction, client, guildId);
                    break;
                case 'panel':
                    await this.showPanel(interaction, client, guildId);
                    break;
            }
        } catch (error) {
            console.error('خطأ في أمر الحماية:', error);
            await interaction.reply({
                content: '❌ حدث خطأ أثناء تنفيذ الأمر.',
                ephemeral: true
            });
        }
    },

    async showStatus(interaction, client, guildId) {
        const protectionSystems = [
            'antiRoles', 'antiChannels', 'antiBots', 'antiLinks',
            'antiAlt', 'antiWebhook', 'antiPrune', 'antiSpam'
        ];

        const embed = new EmbedBuilder()
            .setTitle('🛡️ حالة أنظمة الحماية')
            .setColor('#0099FF')
            .setTimestamp();

        let description = '';
        
        for (const system of protectionSystems) {
            const config = client.config.get(`protection.${system}`);
            const status = config?.enabled ? '🟢 مفعل' : '🔴 معطل';
            const action = config?.action || 'غير محدد';
            const displayName = this.getSystemDisplayName(system);
            
            description += `**${displayName}**\n`;
            description += `الحالة: ${status}\n`;
            description += `الإجراء: ${action}\n\n`;
        }

        embed.setDescription(description);
        
        // إضافة إحصائيات
        const stats = await this.getProtectionStats(client, guildId);
        if (stats) {
            embed.addFields({ 
                name: '📊 الإحصائيات', 
                value: `التهديدات المحجوبة اليوم: ${stats.blockedToday}\nإجمالي التهديدات المحجوبة: ${stats.totalBlocked}`,
                inline: false 
            });
        }

        await interaction.reply({ embeds: [embed] });
    },

    async toggleProtection(interaction, client, guildId) {
        const system = interaction.options.getString('system');
        const currentStatus = client.config.get(`protection.${system}.enabled`);
        const newStatus = !currentStatus;
        
        await client.config.set(`protection.${system}.enabled`, newStatus);
        
        const statusText = newStatus ? 'مفعل' : 'معطل';
        const statusEmoji = newStatus ? '🟢' : '🔴';
        const displayName = this.getSystemDisplayName(system);
        
        const embed = new EmbedBuilder()
            .setTitle(`${statusEmoji} تم تحديث نظام الحماية`)
            .setDescription(`تم ${statusText} نظام **${displayName}** بنجاح`)
            .setColor(newStatus ? '#00FF00' : '#FF0000')
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        
        // تسجيل العملية
        await client.logger.info(`تم ${statusText} نظام ${displayName} بواسطة ${interaction.user.tag}`);
    },

    async setAction(interaction, client, guildId) {
        const system = interaction.options.getString('system');
        const action = interaction.options.getString('action');
        
        await client.config.set(`protection.${system}.action`, action);
        
        const displayName = this.getSystemDisplayName(system);
        const actionName = this.getActionDisplayName(action);
        
        const embed = new EmbedBuilder()
            .setTitle('⚙️ تم تحديث الإجراء')
            .setDescription(`تم تعيين إجراء **${actionName}** لنظام **${displayName}**`)
            .setColor('#FFA500')
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        
        // تسجيل العملية
        await client.logger.info(`تم تعيين إجراء ${actionName} لنظام ${displayName} بواسطة ${interaction.user.tag}`);
    },

    async configProtection(interaction, client, guildId) {
        const system = interaction.options.getString('system');
        const displayName = this.getSystemDisplayName(system);
        
        const embed = new EmbedBuilder()
            .setTitle(`⚙️ تكوين ${displayName}`)
            .setDescription('اختر الإعداد الذي تريد تعديله:')
            .setColor('#0099FF')
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`config_${system}_limits`)
                    .setLabel('الحدود والقيود')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`config_${system}_timing`)
                    .setLabel('التوقيت')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`config_${system}_advanced`)
                    .setLabel('الإعدادات المتقدمة')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    },

    async showPanel(interaction, client, guildId) {
        const embed = new EmbedBuilder()
            .setTitle('🛡️ لوحة التحكم في الحماية')
            .setDescription('اختر نظام الحماية الذي تريد إدارته:')
            .setColor('#0099FF')
            .setTimestamp();

        const row1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('panel_antiRoles')
                    .setLabel('حماية الرتب')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('panel_antiChannels')
                    .setLabel('حماية القنوات')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('panel_antiBots')
                    .setLabel('حماية البوتات')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('panel_antiLinks')
                    .setLabel('حماية الروابط')
                    .setStyle(ButtonStyle.Primary)
            );

        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('panel_antiAlt')
                    .setLabel('حماية الحسابات الوهمية')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('panel_antiWebhook')
                    .setLabel('حماية الويب هوك')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('panel_antiPrune')
                    .setLabel('حماية البرون')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('panel_antiSpam')
                    .setLabel('حماية السبام')
                    .setStyle(ButtonStyle.Secondary)
            );

        const row3 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('panel_whitelist')
                    .setLabel('القائمة البيضاء')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('panel_settings')
                    .setLabel('الإعدادات العامة')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('panel_stats')
                    .setLabel('الإحصائيات')
                    .setStyle(ButtonStyle.Success)
            );

        await interaction.reply({ 
            embeds: [embed], 
            components: [row1, row2, row3], 
            ephemeral: true 
        });
    },

    async getProtectionStats(client, guildId) {
        try {
            const today = new Date().toDateString();
            const blockedToday = await client.database.getStat(guildId, `blocked_${today}`) || 0;
            const totalBlocked = await client.database.getStat(guildId, 'total_blocked') || 0;
            
            return { blockedToday, totalBlocked };
        } catch (error) {
            console.error('خطأ في جلب الإحصائيات:', error);
            return null;
        }
    },

    getSystemDisplayName(system) {
        const names = {
            'antiRoles': 'حماية الرتب',
            'antiChannels': 'حماية القنوات',
            'antiBots': 'حماية البوتات',
            'antiLinks': 'حماية الروابط',
            'antiAlt': 'حماية الحسابات الوهمية',
            'antiWebhook': 'حماية الويب هوك',
            'antiPrune': 'حماية البرون',
            'antiSpam': 'حماية السبام'
        };
        return names[system] || system;
    },

    getActionDisplayName(action) {
        const names = {
            'ban': 'حظر',
            'kick': 'طرد',
            'removePermissions': 'إزالة الصلاحيات',
            'removeRoles': 'سحب الرتب',
            'mute': 'كتم',
            'delete': 'حذف',
            'warn': 'تحذير'
        };
        return names[action] || action;
    }
};

