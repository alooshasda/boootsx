const { Events, AuditLogEvent } = require('discord.js');

module.exports = {
    name: Events.GuildMemberAdd,
    
    init(client) {
        this.client = client;
    },

    async execute(member) {
        try {
            const guild = member.guild;
            const guildId = guild.id;

            // التحقق من أن العضو الجديد هو بوت
            if (!member.user.bot) return;

            // التحقق من تفعيل الحماية
            const isEnabled = await this.client.protection.isProtectionEnabled(guildId, 'antiBots');
            if (!isEnabled) return;

            // التحقق من القائمة البيضاء للبوتات
            const isBotWhitelisted = await this.client.protection.checkBotWhitelist(guildId, member.user.id);
            if (isBotWhitelisted) return;

            // الحصول على إعدادات الحماية
            const config = await this.client.protection.getProtectionConfig(guildId, 'antiBots');
            const maxBots = config.maxBots || 3;
            const timeWindow = config.timeWindow || 60000;
            const action = config.action || 'kick';

            // الحصول على معلومات المنفذ من سجل التدقيق
            const auditLogs = await guild.fetchAuditLogs({
                type: AuditLogEvent.BotAdd,
                limit: 1
            });

            const auditEntry = auditLogs.entries.first();
            let executor = null;
            let executorMember = null;

            if (auditEntry && auditEntry.executor) {
                executor = auditEntry.executor;
                executorMember = guild.members.cache.get(executor.id);

                // التحقق من القائمة البيضاء للمنفذ
                const userRoles = executorMember ? executorMember.roles.cache.map(r => r.id) : [];
                const isWhitelisted = await this.client.protection.checkWhitelist(guildId, executor.id, userRoles);
                if (isWhitelisted) return;

                // التحقق من معدل إضافة البوتات
                const isRateLimited = await this.client.protection.isRateLimited(
                    guildId, 
                    executor.id, 
                    'botAdd', 
                    maxBots, 
                    timeWindow
                );

                if (isRateLimited) {
                    // تسجيل المخالفة
                    await this.client.protection.recordViolation(guildId, executor.id, 'antiBots', {
                        botId: member.user.id,
                        botTag: member.user.tag,
                        action: 'add',
                        timestamp: Date.now()
                    });

                    // طرد البوت
                    try {
                        await member.kick('حماية ضد إضافة البوتات المفرطة');
                    } catch (kickError) {
                        console.error('خطأ في طرد البوت:', kickError);
                    }

                    // تنفيذ الإجراء على المنفذ
                    if (executorMember) {
                        const reason = `إضافة بوتات مفرطة - تم إضافة أكثر من ${maxBots} بوتات في ${timeWindow / 1000} ثانية`;
                        await this.client.protection.executeAction(guild, executorMember, action, reason, executor);
                    }

                    // إرسال تنبيه
                    await this.sendAlert(guild, executor, member, maxBots, timeWindow);

                    // تسجيل في السجل
                    await this.client.logger.warn(`تم اكتشاف إضافة بوتات مفرطة من ${executor.tag} في ${guild.name}`);
                }
            } else {
                // في حالة عدم وجود سجل تدقيق، قد يكون البوت انضم عبر رابط دعوة
                // التحقق من الحد الأقصى للبوتات في السيرفر
                const botCount = guild.members.cache.filter(m => m.user.bot).size;
                const maxBotsInGuild = config.maxBotsInGuild || 20;

                if (botCount > maxBotsInGuild) {
                    // طرد البوت
                    try {
                        await member.kick('تجاوز الحد الأقصى للبوتات في السيرفر');
                        
                        // إرسال تنبيه
                        await this.sendBotLimitAlert(guild, member, botCount, maxBotsInGuild);
                        
                        // تسجيل في السجل
                        await this.client.logger.warn(`تم طرد البوت ${member.user.tag} لتجاوز الحد الأقصى للبوتات في ${guild.name}`);
                    } catch (kickError) {
                        console.error('خطأ في طرد البوت:', kickError);
                    }
                }
            }

        } catch (error) {
            console.error('خطأ في حماية البوتات:', error);
        }
    },

    async sendAlert(guild, executor, botMember, maxBots, timeWindow) {
        try {
            const logChannelId = this.client.config.get('logging.channel');
            if (!logChannelId) return;

            const logChannel = guild.channels.cache.get(logChannelId);
            if (!logChannel) return;

            const embed = this.client.logger.createProtectionEmbed(
                'حماية البوتات',
                executor,
                `إضافة بوتات مفرطة - تم إضافة أكثر من ${maxBots} بوتات في ${timeWindow / 1000} ثانية`,
                {
                    target: `البوت المطرود: ${botMember.user.tag} (${botMember.user.id})`,
                    count: maxBots
                }
            );

            await logChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error('خطأ في إرسال تنبيه حماية البوتات:', error);
        }
    },

    async sendBotLimitAlert(guild, botMember, currentCount, maxCount) {
        try {
            const logChannelId = this.client.config.get('logging.channel');
            if (!logChannelId) return;

            const logChannel = guild.channels.cache.get(logChannelId);
            if (!logChannel) return;

            const embed = this.client.logger.createProtectionEmbed(
                'حماية البوتات - تجاوز الحد الأقصى',
                botMember.user,
                `تجاوز الحد الأقصى للبوتات في السيرفر`,
                {
                    target: `البوت المطرود: ${botMember.user.tag}`,
                    count: `${currentCount}/${maxCount}`
                }
            );

            await logChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error('خطأ في إرسال تنبيه حد البوتات:', error);
        }
    }
};

