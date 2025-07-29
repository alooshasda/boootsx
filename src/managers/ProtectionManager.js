const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class ProtectionManager {
    constructor(bot) {
        this.bot = bot;
        this.client = bot.client;
        this.protectionModules = new Map();
        this.rateLimits = new Map();
        this.violations = new Map();
    }

    init() {
        this.loadProtectionModules();
        this.startCleanupInterval();
        console.log(chalk.green('✅ تم تهيئة مدير الحماية بنجاح'));
    }

    loadProtectionModules() {
        const protectionPath = path.join(__dirname, '..', 'protection');
        const protectionFolders = fs.readdirSync(protectionPath);

        for (const folder of protectionFolders) {
            const folderPath = path.join(protectionPath, folder);
            if (fs.statSync(folderPath).isDirectory()) {
                const moduleFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
                
                for (const file of moduleFiles) {
                    const filePath = path.join(folderPath, file);
                    try {
                        const module = require(filePath);
                        if (module && typeof module.init === 'function') {
                            module.init(this.client);
                            this.protectionModules.set(`${folder}_${file.replace('.js', '')}`, module);
                            console.log(chalk.blue(`📦 تم تحميل وحدة الحماية: ${folder}/${file}`));
                        }
                    } catch (error) {
                        console.error(chalk.red(`❌ خطأ في تحميل وحدة الحماية ${folder}/${file}:`), error);
                    }
                }
            }
        }
    }

    async checkWhitelist(guildId, userId, userRoles = []) {
        try {
            // التحقق من المطورين
            const developers = this.client.config.get('permissions.developers') || [];
            if (developers.includes(userId)) {
                return true;
            }

            // التحقق من القائمة البيضاء للمستخدمين
            const userWhitelist = await this.client.database.getWhitelist(guildId, 'users');
            if (userWhitelist.includes(userId)) {
                return true;
            }

            // التحقق من القائمة البيضاء للرتب
            const roleWhitelist = await this.client.database.getWhitelist(guildId, 'roles');
            for (const roleId of userRoles) {
                if (roleWhitelist.includes(roleId)) {
                    return true;
                }
            }

            return false;
        } catch (error) {
            console.error(chalk.red('❌ خطأ في التحقق من القائمة البيضاء:'), error);
            return false;
        }
    }

    async checkBotWhitelist(guildId, botId) {
        try {
            const botWhitelist = await this.client.database.getWhitelist(guildId, 'bots');
            return botWhitelist.includes(botId);
        } catch (error) {
            console.error(chalk.red('❌ خطأ في التحقق من قائمة البوتات البيضاء:'), error);
            return false;
        }
    }

    async isRateLimited(guildId, userId, action, limit = 5, timeWindow = 60000) {
        const key = `${guildId}_${userId}_${action}`;
        const now = Date.now();
        
        if (!this.rateLimits.has(key)) {
            this.rateLimits.set(key, []);
        }
        
        const timestamps = this.rateLimits.get(key);
        
        // إزالة الطوابع الزمنية القديمة
        const validTimestamps = timestamps.filter(timestamp => now - timestamp < timeWindow);
        this.rateLimits.set(key, validTimestamps);
        
        // إضافة الطابع الزمني الحالي
        validTimestamps.push(now);
        
        return validTimestamps.length > limit;
    }

    async recordViolation(guildId, userId, violationType, details = {}) {
        try {
            const key = `${guildId}_${userId}`;
            const now = Date.now();
            
            if (!this.violations.has(key)) {
                this.violations.set(key, []);
            }
            
            const userViolations = this.violations.get(key);
            userViolations.push({
                type: violationType,
                timestamp: now,
                details
            });
            
            // الاحتفاظ بآخر 50 مخالفة فقط
            if (userViolations.length > 50) {
                userViolations.splice(0, userViolations.length - 50);
            }
            
            // حفظ في قاعدة البيانات
            await this.client.database.set(`violations_${key}`, userViolations);
            
            // تحديث الإحصائيات
            await this.updateStats(guildId, violationType);
            
        } catch (error) {
            console.error(chalk.red('❌ خطأ في تسجيل المخالفة:'), error);
        }
    }

    async updateStats(guildId, violationType) {
        try {
            const today = new Date().toDateString();
            await this.client.database.incrementStat(guildId, `blocked_${today}`);
            await this.client.database.incrementStat(guildId, 'total_blocked');
            await this.client.database.incrementStat(guildId, `${violationType}_blocked`);
        } catch (error) {
            console.error(chalk.red('❌ خطأ في تحديث الإحصائيات:'), error);
        }
    }

    async executeAction(guild, target, action, reason, executor = null) {
        try {
            switch (action) {
                case 'ban':
                    if (target.bannable) {
                        await target.ban({ reason });
                        await this.client.logger.info(`تم حظر ${target.user.tag} من ${guild.name} - السبب: ${reason}`);
                    }
                    break;
                    
                case 'kick':
                    if (target.kickable) {
                        await target.kick(reason);
                        await this.client.logger.info(`تم طرد ${target.user.tag} من ${guild.name} - السبب: ${reason}`);
                    }
                    break;
                    
                case 'removePermissions':
                    if (target.manageable) {
                        const roles = target.roles.cache.filter(role => 
                            role.permissions.has('Administrator') || 
                            role.permissions.has('ManageGuild') ||
                            role.permissions.has('ManageRoles') ||
                            role.permissions.has('ManageChannels')
                        );
                        
                        for (const role of roles.values()) {
                            await target.roles.remove(role, reason);
                        }
                        
                        await this.client.logger.info(`تم إزالة الصلاحيات من ${target.user.tag} في ${guild.name} - السبب: ${reason}`);
                    }
                    break;
                    
                case 'removeRoles':
                    if (target.manageable) {
                        const rolesToRemove = target.roles.cache.filter(role => role.id !== guild.id);
                        await target.roles.set([], reason);
                        await this.client.logger.info(`تم سحب جميع الرتب من ${target.user.tag} في ${guild.name} - السبب: ${reason}`);
                    }
                    break;
                    
                case 'mute':
                    const muteRole = await this.getMuteRole(guild);
                    if (muteRole && target.manageable) {
                        await target.roles.add(muteRole, reason);
                        await this.client.logger.info(`تم كتم ${target.user.tag} في ${guild.name} - السبب: ${reason}`);
                    }
                    break;
                    
                case 'warn':
                    await this.addWarning(guild.id, target.user.id, reason, executor);
                    await this.client.logger.info(`تم تحذير ${target.user.tag} في ${guild.name} - السبب: ${reason}`);
                    break;
                    
                default:
                    console.log(chalk.yellow(`⚠️ إجراء غير معروف: ${action}`));
            }
            
            // إرسال تسجيل للقناة المخصصة
            await this.logAction(guild, target, action, reason, executor);
            
        } catch (error) {
            console.error(chalk.red(`❌ خطأ في تنفيذ الإجراء ${action}:`), error);
        }
    }

    async getMuteRole(guild) {
        try {
            const muteRoleId = this.client.config.get('moderation.muteRole');
            if (muteRoleId) {
                return guild.roles.cache.get(muteRoleId);
            }
            
            // البحث عن رتبة كتم موجودة
            let muteRole = guild.roles.cache.find(role => 
                role.name.toLowerCase().includes('mute') || 
                role.name.toLowerCase().includes('كتم')
            );
            
            if (!muteRole) {
                // إنشاء رتبة كتم جديدة
                muteRole = await guild.roles.create({
                    name: 'Muted',
                    color: '#818386',
                    permissions: [],
                    reason: 'رتبة كتم تلقائية'
                });
                
                // تطبيق الكتم على جميع القنوات
                for (const channel of guild.channels.cache.values()) {
                    if (channel.isTextBased() || channel.isVoiceBased()) {
                        await channel.permissionOverwrites.create(muteRole, {
                            SendMessages: false,
                            Speak: false,
                            AddReactions: false
                        });
                    }
                }
                
                // حفظ معرف الرتبة
                await this.client.config.set('moderation.muteRole', muteRole.id);
            }
            
            return muteRole;
        } catch (error) {
            console.error(chalk.red('❌ خطأ في الحصول على رتبة الكتم:'), error);
            return null;
        }
    }

    async addWarning(guildId, userId, reason, executor = null) {
        try {
            const key = `warnings_${guildId}_${userId}`;
            const warnings = await this.client.database.get(key) || [];
            
            warnings.push({
                reason,
                executor: executor ? executor.id : null,
                timestamp: Date.now()
            });
            
            await this.client.database.set(key, warnings);
            return warnings.length;
        } catch (error) {
            console.error(chalk.red('❌ خطأ في إضافة التحذير:'), error);
            return 0;
        }
    }

    async logAction(guild, target, action, reason, executor = null) {
        try {
            const logChannelId = this.client.config.get('logging.channel');
            if (!logChannelId) return;
            
            const logChannel = guild.channels.cache.get(logChannelId);
            if (!logChannel) return;
            
            const embed = this.client.logger.createProtectionEmbed(
                action,
                target.user,
                reason,
                { executor }
            );
            
            await logChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error(chalk.red('❌ خطأ في تسجيل الإجراء:'), error);
        }
    }

    startCleanupInterval() {
        // تنظيف البيانات المؤقتة كل 10 دقائق
        setInterval(() => {
            this.cleanupRateLimits();
            this.cleanupViolations();
        }, 600000);
    }

    cleanupRateLimits() {
        const now = Date.now();
        const timeWindow = 300000; // 5 دقائق
        
        for (const [key, timestamps] of this.rateLimits.entries()) {
            const validTimestamps = timestamps.filter(timestamp => now - timestamp < timeWindow);
            if (validTimestamps.length === 0) {
                this.rateLimits.delete(key);
            } else {
                this.rateLimits.set(key, validTimestamps);
            }
        }
    }

    cleanupViolations() {
        const now = Date.now();
        const timeWindow = 86400000; // 24 ساعة
        
        for (const [key, violations] of this.violations.entries()) {
            const validViolations = violations.filter(violation => now - violation.timestamp < timeWindow);
            if (validViolations.length === 0) {
                this.violations.delete(key);
            } else {
                this.violations.set(key, validViolations);
            }
        }
    }

    // دوال مساعدة للوحدات الفرعية
    async isProtectionEnabled(guildId, protectionType) {
        return this.client.config.get(`protection.${protectionType}.enabled`) || false;
    }

    async getProtectionAction(guildId, protectionType) {
        return this.client.config.get(`protection.${protectionType}.action`) || 'warn';
    }

    async getProtectionConfig(guildId, protectionType) {
        return this.client.config.get(`protection.${protectionType}`) || {};
    }
}

module.exports = ProtectionManager;

