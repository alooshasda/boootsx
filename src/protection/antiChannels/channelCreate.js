const { Events, AuditLogEvent } = require('discord.js');

module.exports = {
    name: Events.ChannelCreate,
    
    init(client) {
        this.client = client;
    },

    async execute(channel) {
        try {
            const guild = channel.guild;
            const guildId = guild.id;

            // التحقق من تفعيل الحماية
            const isEnabled = await this.client.protection.isProtectionEnabled(guildId, 'antiChannels');
            if (!isEnabled) return;

            // الحصول على إعدادات الحماية
            const config = await this.client.protection.getProtectionConfig(guildId, 'antiChannels');
            const maxChannels = config.maxChannels || 5;
            const timeWindow = config.timeWindow || 60000;
            const action = config.action || 'ban';

            // الحصول على معلومات المنفذ من سجل التدقيق
            const auditLogs = await guild.fetchAuditLogs({
                type: AuditLogEvent.ChannelCreate,
                limit: 1
            });

            const auditEntry = auditLogs.entries.first();
            if (!auditEntry || !auditEntry.executor) return;

            const executor = auditEntry.executor;
            const executorMember = guild.members.cache.get(executor.id);

            // التحقق من القائمة البيضاء
            const userRoles = executorMember ? executorMember.roles.cache.map(r => r.id) : [];
            const isWhitelisted = await this.client.protection.checkWhitelist(guildId, executor.id, userRoles);
            if (isWhitelisted) return;

            // التحقق من البوتات المسموحة
            if (executor.bot) {
                const isBotWhitelisted = await this.client.protection.checkBotWhitelist(guildId, executor.id);
                if (isBotWhitelisted) return;
            }

            // التحقق من معدل الإنشاء
            const isRateLimited = await this.client.protection.isRateLimited(
                guildId, 
                executor.id, 
                'channelCreate', 
                maxChannels, 
                timeWindow
            );

            if (isRateLimited) {
                // تسجيل المخالفة
                await this.client.protection.recordViolation(guildId, executor.id, 'antiChannels', {
                    channelId: channel.id,
                    channelName: channel.name,
                    channelType: channel.type,
                    action: 'create',
                    timestamp: Date.now()
                });

                // حذف القناة المنشأة
                try {
                    await channel.delete('حماية ضد إنشاء القنوات المفرط');
                } catch (deleteError) {
                    console.error('خطأ في حذف القناة:', deleteError);
                }

                // تنفيذ الإجراء على المنفذ
                if (executorMember) {
                    const reason = `إنشاء قنوات مفرط - تم إنشاء أكثر من ${maxChannels} قنوات في ${timeWindow / 1000} ثانية`;
                    await this.client.protection.executeAction(guild, executorMember, action, reason);
                }

                // إرسال تنبيه
                await this.sendAlert(guild, executor, channel, maxChannels, timeWindow);

                // تسجيل في السجل
                await this.client.logger.warn(`تم اكتشاف إنشاء قنوات مفرط من ${executor.tag} في ${guild.name}`);
            }

        } catch (error) {
            console.error('خطأ في حماية القنوات:', error);
        }
    },

    async sendAlert(guild, executor, channel, maxChannels, timeWindow) {
        try {
            const logChannelId = this.client.config.get('logging.channel');
            if (!logChannelId) return;

            const logChannel = guild.channels.cache.get(logChannelId);
            if (!logChannel) return;

            const channelTypeNames = {
                0: 'نصية',
                2: 'صوتية',
                4: 'فئة',
                5: 'إعلانات',
                13: 'مرحلة',
                15: 'منتدى'
            };

            const embed = this.client.logger.createProtectionEmbed(
                'حماية القنوات',
                executor,
                `إنشاء قنوات مفرط - تم إنشاء أكثر من ${maxChannels} قنوات في ${timeWindow / 1000} ثانية`,
                {
                    target: `القناة: ${channel.name} (${channelTypeNames[channel.type] || 'غير معروف'})`,
                    count: maxChannels
                }
            );

            await logChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error('خطأ في إرسال تنبيه حماية القنوات:', error);
        }
    }
};

