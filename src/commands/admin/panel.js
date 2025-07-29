const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('panel')
        .setDescription('عرض لوحة التحكم الرئيسية للبوت')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction, client) {
        try {
            const guild = interaction.guild;
            const guildId = guild.id;

            // جمع معلومات حالة البوت
            const botInfo = await this.getBotInfo(client, guild);
            const protectionStatus = await this.getProtectionStatus(client, guildId);
            const stats = await this.getQuickStats(client, guildId);

            const embed = new EmbedBuilder()
                .setTitle('🛡️ لوحة التحكم الرئيسية')
                .setDescription(`مرحباً بك في لوحة التحكم الخاصة ببوت الحماية **${client.user.username}**`)
                .addFields(
                    { name: '📊 معلومات البوت', value: botInfo, inline: true },
                    { name: '🛡️ حالة الحماية', value: protectionStatus, inline: true },
                    { name: '📈 إحصائيات سريعة', value: stats, inline: true }
                )
                .setColor('#0099FF')
                .setThumbnail(client.user.displayAvatarURL())
                .setFooter({ 
                    text: `© ${new Date().getFullYear()} متجر الحماية - جميع الحقوق محفوظة`,
                    iconURL: guild.iconURL() 
                })
                .setTimestamp();

            // الصف الأول - الحماية والإعدادات
            const row1 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('panel_protection')
                        .setLabel('🛡️ أنظمة الحماية')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('panel_whitelist')
                        .setLabel('📋 القائمة البيضاء')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('panel_backup')
                        .setLabel('💾 النسخ الاحتياطي')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('panel_settings')
                        .setLabel('⚙️ الإعدادات')
                        .setStyle(ButtonStyle.Secondary)
                );

            // الصف الثاني - الإحصائيات والأدوات
            const row2 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('panel_stats')
                        .setLabel('📊 الإحصائيات')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('panel_logs')
                        .setLabel('📝 السجلات')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('panel_tools')
                        .setLabel('🔧 الأدوات')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('panel_help')
                        .setLabel('❓ المساعدة')
                        .setStyle(ButtonStyle.Secondary)
                );

            // الصف الثالث - إدارة سريعة
            const row3 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('quick_lockdown')
                        .setLabel('🔒 إغلاق طارئ')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId('quick_unlock')
                        .setLabel('🔓 إلغاء الإغلاق')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('panel_refresh')
                        .setLabel('🔄 تحديث')
                        .setStyle(ButtonStyle.Primary)
                );

            await interaction.reply({
                embeds: [embed],
                components: [row1, row2, row3],
                ephemeral: true
            });

            // تسجيل الوصول للوحة التحكم
            await client.logger.info(`تم الوصول للوحة التحكم الرئيسية بواسطة ${interaction.user.tag} في ${guild.name}`);

        } catch (error) {
            console.error('خطأ في عرض لوحة التحكم:', error);
            await interaction.reply({
                content: '❌ حدث خطأ أثناء عرض لوحة التحكم.',
                ephemeral: true
            });
        }
    },

    async getBotInfo(client, guild) {
        try {
            const uptime = this.formatUptime(client.uptime);
            const ping = Math.round(client.ws.ping);
            const memberCount = guild.memberCount;
            const botCount = guild.members.cache.filter(m => m.user.bot).size;

            return `**الاتصال:** ${ping}ms\n**وقت التشغيل:** ${uptime}\n**الأعضاء:** ${memberCount}\n**البوتات:** ${botCount}`;
        } catch (error) {
            return 'غير متاح';
        }
    },

    async getProtectionStatus(client, guildId) {
        try {
            const protectionSystems = [
                'antiRoles', 'antiChannels', 'antiBots', 'antiLinks',
                'antiAlt', 'antiWebhook', 'antiPrune', 'antiSpam'
            ];

            let enabledCount = 0;
            for (const system of protectionSystems) {
                const isEnabled = client.config.get(`protection.${system}.enabled`);
                if (isEnabled) enabledCount++;
            }

            const percentage = Math.round((enabledCount / protectionSystems.length) * 100);
            const status = percentage >= 75 ? '🟢 ممتاز' : 
                          percentage >= 50 ? '🟡 جيد' : 
                          percentage >= 25 ? '🟠 متوسط' : '🔴 ضعيف';

            return `**الحالة:** ${status}\n**مفعل:** ${enabledCount}/${protectionSystems.length}\n**النسبة:** ${percentage}%`;
        } catch (error) {
            return 'غير متاح';
        }
    },

    async getQuickStats(client, guildId) {
        try {
            const today = new Date().toDateString();
            const blockedToday = await client.database.getStat(guildId, `blocked_${today}`) || 0;
            const totalBlocked = await client.database.getStat(guildId, 'total_blocked') || 0;
            
            const userWhitelist = await client.database.getWhitelist(guildId, 'users');
            const whitelistCount = userWhitelist.length;

            return `**محجوب اليوم:** ${blockedToday}\n**إجمالي محجوب:** ${totalBlocked}\n**القائمة البيضاء:** ${whitelistCount}`;
        } catch (error) {
            return 'غير متاح';
        }
    },

    formatUptime(uptime) {
        const totalSeconds = Math.floor(uptime / 1000);
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);

        if (days > 0) {
            return `${days}د ${hours}س ${minutes}ق`;
        } else if (hours > 0) {
            return `${hours}س ${minutes}ق`;
        } else {
            return `${minutes}ق`;
        }
    }
};

