const { Events, AuditLogEvent } = require('discord.js');

module.exports = {
    name: Events.GuildRoleDelete,
    
    init(client) {
        this.client = client;
    },

    async execute(role) {
        try {
            const guild = role.guild;
            const guildId = guild.id;

            // التحقق من تفعيل الحماية
            const isEnabled = await this.client.protection.isProtectionEnabled(guildId, 'antiRoles');
            if (!isEnabled) return;

            // الحصول على إعدادات الحماية
            const config = await this.client.protection.getProtectionConfig(guildId, 'antiRoles');
            const maxRoles = config.maxRoles || 5;
            const timeWindow = config.timeWindow || 60000;
            const action = config.action || 'ban';

            // الحصول على معلومات المنفذ من سجل التدقيق
            const auditLogs = await guild.fetchAuditLogs({
                type: AuditLogEvent.RoleDelete,
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

            // التحقق من معدل الحذف
            const isRateLimited = await this.client.protection.isRateLimited(
                guildId, 
                executor.id, 
                'roleDelete', 
                maxRoles, 
                timeWindow
            );

            if (isRateLimited) {
                // تسجيل المخالفة
                await this.client.protection.recordViolation(guildId, executor.id, 'antiRoles', {
                    roleId: role.id,
                    roleName: role.name,
                    action: 'delete',
                    timestamp: Date.now()
                });

                // تنفيذ الإجراء على المنفذ
                if (executorMember) {
                    const reason = `حذف رتب مفرط - تم حذف أكثر من ${maxRoles} رتب في ${timeWindow / 1000} ثانية`;
                    await this.client.protection.executeAction(guild, executorMember, action, reason);
                }

                // إرسال تنبيه
                await this.sendAlert(guild, executor, role, maxRoles, timeWindow);

                // تسجيل في السجل
                await this.client.logger.warn(`تم اكتشاف حذف رتب مفرط من ${executor.tag} في ${guild.name}`);
            }

        } catch (error) {
            console.error('خطأ في حماية حذف الرتب:', error);
        }
    },

    async sendAlert(guild, executor, role, maxRoles, timeWindow) {
        try {
            const logChannelId = this.client.config.get('logging.channel');
            if (!logChannelId) return;

            const logChannel = guild.channels.cache.get(logChannelId);
            if (!logChannel) return;

            const embed = this.client.logger.createProtectionEmbed(
                'حماية الرتب - حذف مفرط',
                executor,
                `حذف رتب مفرط - تم حذف أكثر من ${maxRoles} رتب في ${timeWindow / 1000} ثانية`,
                {
                    target: `الرتبة المحذوفة: ${role.name} (${role.id})`,
                    count: maxRoles
                }
            );

            await logChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error('خطأ في إرسال تنبيه حماية حذف الرتب:', error);
        }
    }
};

