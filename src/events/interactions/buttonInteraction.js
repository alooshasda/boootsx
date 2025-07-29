const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    
    async execute(interaction, client) {
        if (!interaction.isButton()) return;

        try {
            const customId = interaction.customId;
            const guild = interaction.guild;
            const member = interaction.member;

            // التحقق من الصلاحيات
            if (!member.permissions.has('Administrator')) {
                return await interaction.reply({
                    content: '❌ ليس لديك صلاحية لاستخدام هذه الميزة.',
                    ephemeral: true
                });
            }

            // معالجة أزرار لوحة الحماية
            if (customId.startsWith('panel_')) {
                await this.handleProtectionPanel(interaction, client, customId);
            }
            // معالجة أزرار النسخ الاحتياطي
            else if (customId.startsWith('backup_') || customId.startsWith('restore_') || customId.startsWith('delete_')) {
                await this.handleBackupButtons(interaction, client, customId);
            }
            // معالجة أزرار القائمة البيضاء
            else if (customId.startsWith('whitelist_')) {
                await this.handleWhitelistButtons(interaction, client, customId);
            }
            // معالجة أزرار التكوين
            else if (customId.startsWith('config_')) {
                await this.handleConfigButtons(interaction, client, customId);
            }

        } catch (error) {
            console.error('خطأ في معالجة تفاعل الزر:', error);
            
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ حدث خطأ أثناء معالجة طلبك.',
                    ephemeral: true
                });
            }
        }
    },

    async handleProtectionPanel(interaction, client, customId) {
        const system = customId.replace('panel_', '');
        
        if (system === 'whitelist') {
            await this.showWhitelistPanel(interaction, client);
        } else if (system === 'settings') {
            await this.showSettingsPanel(interaction, client);
        } else if (system === 'stats') {
            await this.showStatsPanel(interaction, client);
        } else {
            await this.showSystemPanel(interaction, client, system);
        }
    },

    async showSystemPanel(interaction, client, system) {
        const systemNames = {
            'antiRoles': 'حماية الرتب',
            'antiChannels': 'حماية القنوات',
            'antiBots': 'حماية البوتات',
            'antiLinks': 'حماية الروابط',
            'antiAlt': 'حماية الحسابات الوهمية',
            'antiWebhook': 'حماية الويب هوك',
            'antiPrune': 'حماية البرون',
            'antiSpam': 'حماية السبام'
        };

        const systemName = systemNames[system] || system;
        const config = client.config.get(`protection.${system}`) || {};
        const isEnabled = config.enabled || false;
        const action = config.action || 'warn';

        const embed = new EmbedBuilder()
            .setTitle(`⚙️ إعدادات ${systemName}`)
            .setDescription(`الحالة الحالية: ${isEnabled ? '🟢 مفعل' : '🔴 معطل'}\nالإجراء: ${action}`)
            .setColor(isEnabled ? '#00FF00' : '#FF0000')
            .setTimestamp();

        const row1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`toggle_${system}`)
                    .setLabel(isEnabled ? 'تعطيل' : 'تفعيل')
                    .setStyle(isEnabled ? ButtonStyle.Danger : ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`action_${system}`)
                    .setLabel('تغيير الإجراء')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`config_${system}`)
                    .setLabel('الإعدادات المتقدمة')
                    .setStyle(ButtonStyle.Secondary)
            );

        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`test_${system}`)
                    .setLabel('اختبار النظام')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('panel_back')
                    .setLabel('العودة للقائمة الرئيسية')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.reply({
            embeds: [embed],
            components: [row1, row2],
            ephemeral: true
        });
    },

    async showWhitelistPanel(interaction, client) {
        const guildId = interaction.guild.id;
        
        const userWhitelist = await client.database.getWhitelist(guildId, 'users');
        const roleWhitelist = await client.database.getWhitelist(guildId, 'roles');
        const botWhitelist = await client.database.getWhitelist(guildId, 'bots');

        const embed = new EmbedBuilder()
            .setTitle('📋 إدارة القائمة البيضاء')
            .addFields(
                { name: '👥 المستخدمين', value: userWhitelist.length.toString(), inline: true },
                { name: '🏷️ الرتب', value: roleWhitelist.length.toString(), inline: true },
                { name: '🤖 البوتات', value: botWhitelist.length.toString(), inline: true }
            )
            .setColor('#0099FF')
            .setTimestamp();

        const row1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('whitelist_add_user')
                    .setLabel('إضافة مستخدم')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('whitelist_add_role')
                    .setLabel('إضافة رتبة')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('whitelist_add_bot')
                    .setLabel('إضافة بوت')
                    .setStyle(ButtonStyle.Success)
            );

        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('whitelist_view_users')
                    .setLabel('عرض المستخدمين')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('whitelist_view_roles')
                    .setLabel('عرض الرتب')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('whitelist_view_bots')
                    .setLabel('عرض البوتات')
                    .setStyle(ButtonStyle.Primary)
            );

        await interaction.reply({
            embeds: [embed],
            components: [row1, row2],
            ephemeral: true
        });
    },

    async showStatsPanel(interaction, client) {
        const guildId = interaction.guild.id;
        
        try {
            const today = new Date().toDateString();
            const blockedToday = await client.database.getStat(guildId, `blocked_${today}`) || 0;
            const totalBlocked = await client.database.getStat(guildId, 'total_blocked') || 0;
            
            // إحصائيات مفصلة لكل نوع حماية
            const protectionStats = {};
            const protectionTypes = ['antiRoles', 'antiChannels', 'antiBots', 'antiLinks', 'antiAlt', 'antiWebhook', 'antiPrune', 'antiSpam'];
            
            for (const type of protectionTypes) {
                protectionStats[type] = await client.database.getStat(guildId, `${type}_blocked`) || 0;
            }

            const embed = new EmbedBuilder()
                .setTitle('📊 إحصائيات الحماية')
                .addFields(
                    { name: '🛡️ التهديدات المحجوبة اليوم', value: blockedToday.toString(), inline: true },
                    { name: '📈 إجمالي التهديدات المحجوبة', value: totalBlocked.toString(), inline: true },
                    { name: '⏰ آخر تحديث', value: new Date().toLocaleString('ar-SA'), inline: true }
                )
                .setColor('#0099FF')
                .setTimestamp();

            // إضافة إحصائيات مفصلة
            let detailedStats = '';
            const systemNames = {
                'antiRoles': 'حماية الرتب',
                'antiChannels': 'حماية القنوات',
                'antiBots': 'حماية البوتات',
                'antiLinks': 'حماية الروابط',
                'antiAlt': 'حماية الحسابات الوهمية',
                'antiWebhook': 'حماية الويب هوك',
                'antiPrune': 'حماية البرون',
                'antiSpam': 'حماية السبام'
            };

            for (const [type, count] of Object.entries(protectionStats)) {
                if (count > 0) {
                    detailedStats += `${systemNames[type]}: ${count}\n`;
                }
            }

            if (detailedStats) {
                embed.addFields({ name: '📋 إحصائيات مفصلة', value: detailedStats, inline: false });
            }

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('stats_refresh')
                        .setLabel('تحديث الإحصائيات')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('stats_reset')
                        .setLabel('إعادة تعيين الإحصائيات')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId('stats_export')
                        .setLabel('تصدير التقرير')
                        .setStyle(ButtonStyle.Secondary)
                );

            await interaction.reply({
                embeds: [embed],
                components: [row],
                ephemeral: true
            });

        } catch (error) {
            console.error('خطأ في عرض إحصائيات الحماية:', error);
            await interaction.reply({
                content: '❌ حدث خطأ أثناء جلب الإحصائيات.',
                ephemeral: true
            });
        }
    },

    async handleBackupButtons(interaction, client, customId) {
        if (customId === 'backup_refresh') {
            // تحديث قائمة النسخ الاحتياطية
            const backups = await client.backup.getBackupList(interaction.guild.id);
            
            const embed = new EmbedBuilder()
                .setTitle('📝 قائمة النسخ الاحتياطية (محدثة)')
                .setColor('#0099FF')
                .setTimestamp();

            if (backups.length === 0) {
                embed.setDescription('لا توجد نسخ احتياطية متاحة لهذا السيرفر.');
            } else {
                let description = '';
                for (let i = 0; i < Math.min(backups.length, 10); i++) {
                    const backup = backups[i];
                    const createdAt = new Date(backup.createdAt).toLocaleString('ar-SA');
                    const itemCount = Object.values(backup.itemCount).reduce((a, b) => a + b, 0);
                    
                    description += `**${i + 1}.** \`${backup.fileName}\`\n`;
                    description += `📅 ${createdAt} | 📊 ${itemCount} عنصر | 📁 ${backup.size}\n\n`;
                }
                embed.setDescription(description);
            }

            await interaction.update({ embeds: [embed] });

        } else if (customId.startsWith('restore_confirm_')) {
            const backupFileName = customId.replace('restore_confirm_', '');
            await interaction.deferReply();

            const result = await client.backup.restoreBackup(interaction.guild, backupFileName);
            
            if (result.success) {
                const embed = new EmbedBuilder()
                    .setTitle('✅ تم استعادة النسخة الاحتياطية بنجاح')
                    .addFields(
                        { name: '🏷️ الرتب', value: `نجح: ${result.results.roles.success} | فشل: ${result.results.roles.failed}`, inline: true },
                        { name: '📺 القنوات', value: `نجح: ${result.results.channels.success} | فشل: ${result.results.channels.failed}`, inline: true },
                        { name: '👥 الأعضاء', value: `نجح: ${result.results.members.success} | فشل: ${result.results.members.failed}`, inline: true },
                        { name: '⚙️ الإعدادات', value: result.results.settings.success ? 'تم الاستعادة' : 'فشل', inline: true }
                    )
                    .setColor('#00FF00')
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
            } else {
                const embed = new EmbedBuilder()
                    .setTitle('❌ فشل في استعادة النسخة الاحتياطية')
                    .setDescription(`خطأ: ${result.error}`)
                    .setColor('#FF0000')
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
            }
        }
    },

    async handleWhitelistButtons(interaction, client, customId) {
        const guildId = interaction.guild.id;

        if (customId === 'whitelist_add_user') {
            const modal = new ModalBuilder()
                .setCustomId('whitelist_user_modal')
                .setTitle('إضافة مستخدم للقائمة البيضاء');

            const userInput = new TextInputBuilder()
                .setCustomId('user_id')
                .setLabel('معرف المستخدم أو المنشن')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('123456789012345678 أو @username')
                .setRequired(true);

            const firstActionRow = new ActionRowBuilder().addComponents(userInput);
            modal.addComponents(firstActionRow);

            await interaction.showModal(modal);

        } else if (customId === 'whitelist_view_users') {
            const userWhitelist = await client.database.getWhitelist(guildId, 'users');
            
            const embed = new EmbedBuilder()
                .setTitle('👥 المستخدمين في القائمة البيضاء')
                .setColor('#0099FF')
                .setTimestamp();

            if (userWhitelist.length === 0) {
                embed.setDescription('لا يوجد مستخدمين في القائمة البيضاء.');
            } else {
                let description = '';
                for (let i = 0; i < Math.min(userWhitelist.length, 20); i++) {
                    const userId = userWhitelist[i];
                    const user = await client.users.fetch(userId).catch(() => null);
                    const userTag = user ? user.tag : `معرف: ${userId}`;
                    description += `${i + 1}. ${userTag} (\`${userId}\`)\n`;
                }
                
                if (userWhitelist.length > 20) {
                    description += `... و ${userWhitelist.length - 20} مستخدم آخر`;
                }
                
                embed.setDescription(description);
            }

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },

    async handleConfigButtons(interaction, client, customId) {
        const parts = customId.split('_');
        const system = parts[1];
        const configType = parts[2];

        if (configType === 'limits') {
            await this.showLimitsConfig(interaction, client, system);
        } else if (configType === 'timing') {
            await this.showTimingConfig(interaction, client, system);
        } else if (configType === 'advanced') {
            await this.showAdvancedConfig(interaction, client, system);
        }
    },

    async showLimitsConfig(interaction, client, system) {
        const modal = new ModalBuilder()
            .setCustomId(`limits_modal_${system}`)
            .setTitle(`تكوين حدود ${system}`);

        const config = client.config.get(`protection.${system}`) || {};

        const limitInput = new TextInputBuilder()
            .setCustomId('max_limit')
            .setLabel('الحد الأقصى للعمليات')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('5')
            .setValue((config.maxRoles || config.maxChannels || config.maxBots || 5).toString())
            .setRequired(true);

        const timeInput = new TextInputBuilder()
            .setCustomId('time_window')
            .setLabel('النافذة الزمنية (بالثواني)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('60')
            .setValue(((config.timeWindow || 60000) / 1000).toString())
            .setRequired(true);

        const firstRow = new ActionRowBuilder().addComponents(limitInput);
        const secondRow = new ActionRowBuilder().addComponents(timeInput);
        
        modal.addComponents(firstRow, secondRow);

        await interaction.showModal(modal);
    }
};

