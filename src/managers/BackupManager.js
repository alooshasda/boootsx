const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const cron = require('node-cron');

class BackupManager {
    constructor(bot) {
        this.bot = bot;
        this.client = bot.client;
        this.backupPath = path.join(process.cwd(), 'backups');
        this.maxBackups = 10;
        this.scheduledBackups = new Map();
    }

    async init() {
        try {
            await fs.ensureDir(this.backupPath);
            this.setupAutoBackup();
            console.log(chalk.green('✅ تم تهيئة مدير النسخ الاحتياطي بنجاح'));
        } catch (error) {
            console.error(chalk.red('❌ خطأ في تهيئة مدير النسخ الاحتياطي:'), error);
        }
    }

    setupAutoBackup() {
        const autoBackupEnabled = this.client.config.get('backup.autoBackup');
        if (autoBackupEnabled) {
            // تشغيل النسخ الاحتياطي التلقائي كل 24 ساعة
            cron.schedule('0 2 * * *', async () => {
                console.log(chalk.blue('🔄 بدء النسخ الاحتياطي التلقائي...'));
                await this.performAutoBackup();
            });
        }
    }

    async performAutoBackup() {
        try {
            const guilds = this.client.guilds.cache;
            for (const [guildId, guild] of guilds) {
                await this.createFullBackup(guild);
            }
            console.log(chalk.green('✅ تم إكمال النسخ الاحتياطي التلقائي'));
        } catch (error) {
            console.error(chalk.red('❌ خطأ في النسخ الاحتياطي التلقائي:'), error);
        }
    }

    async createFullBackup(guild) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupData = {
                guildInfo: {
                    id: guild.id,
                    name: guild.name,
                    description: guild.description,
                    icon: guild.iconURL(),
                    banner: guild.bannerURL(),
                    ownerId: guild.ownerId,
                    createdAt: guild.createdAt,
                    memberCount: guild.memberCount,
                    verificationLevel: guild.verificationLevel,
                    defaultMessageNotifications: guild.defaultMessageNotifications,
                    explicitContentFilter: guild.explicitContentFilter
                },
                roles: await this.backupRoles(guild),
                channels: await this.backupChannels(guild),
                members: await this.backupMembers(guild),
                emojis: await this.backupEmojis(guild),
                bans: await this.backupBans(guild),
                settings: await this.backupBotSettings(guild.id),
                timestamp: new Date().toISOString()
            };

            const fileName = `backup_${guild.id}_${timestamp}.json`;
            const filePath = path.join(this.backupPath, fileName);
            
            await fs.writeJson(filePath, backupData, { spaces: 2 });
            
            // تنظيف النسخ القديمة
            await this.cleanupOldBackups(guild.id);
            
            // حفظ معلومات النسخة الاحتياطية في قاعدة البيانات
            await this.saveBackupInfo(guild.id, fileName, backupData);
            
            await this.client.logger.success(`تم إنشاء نسخة احتياطية كاملة للسيرفر ${guild.name}`);
            
            return {
                success: true,
                fileName,
                size: await this.getFileSize(filePath),
                itemCount: this.countBackupItems(backupData)
            };
            
        } catch (error) {
            console.error(chalk.red(`❌ خطأ في إنشاء النسخة الاحتياطية للسيرفر ${guild.name}:`), error);
            return { success: false, error: error.message };
        }
    }

    async backupRoles(guild) {
        try {
            const roles = [];
            for (const [roleId, role] of guild.roles.cache) {
                if (role.id === guild.id) continue; // تجاهل رتبة @everyone
                
                roles.push({
                    id: role.id,
                    name: role.name,
                    color: role.color,
                    hoist: role.hoist,
                    position: role.position,
                    permissions: role.permissions.bitfield.toString(),
                    mentionable: role.mentionable,
                    managed: role.managed,
                    createdAt: role.createdAt,
                    members: role.members.map(member => ({
                        id: member.id,
                        tag: member.user.tag,
                        joinedAt: member.joinedAt
                    }))
                });
            }
            return roles;
        } catch (error) {
            console.error(chalk.red('❌ خطأ في نسخ الرتب:'), error);
            return [];
        }
    }

    async backupChannels(guild) {
        try {
            const channels = [];
            for (const [channelId, channel] of guild.channels.cache) {
                const channelData = {
                    id: channel.id,
                    name: channel.name,
                    type: channel.type,
                    position: channel.position,
                    parentId: channel.parentId,
                    createdAt: channel.createdAt,
                    permissionOverwrites: []
                };

                // نسخ صلاحيات القناة
                for (const [overwriteId, overwrite] of channel.permissionOverwrites.cache) {
                    channelData.permissionOverwrites.push({
                        id: overwrite.id,
                        type: overwrite.type,
                        allow: overwrite.allow.bitfield.toString(),
                        deny: overwrite.deny.bitfield.toString()
                    });
                }

                // إضافة خصائص خاصة بنوع القناة
                if (channel.isTextBased()) {
                    channelData.topic = channel.topic;
                    channelData.nsfw = channel.nsfw;
                    channelData.rateLimitPerUser = channel.rateLimitPerUser;
                }

                if (channel.isVoiceBased()) {
                    channelData.bitrate = channel.bitrate;
                    channelData.userLimit = channel.userLimit;
                    channelData.rtcRegion = channel.rtcRegion;
                }

                channels.push(channelData);
            }
            return channels;
        } catch (error) {
            console.error(chalk.red('❌ خطأ في نسخ القنوات:'), error);
            return [];
        }
    }

    async backupMembers(guild) {
        try {
            const members = [];
            for (const [memberId, member] of guild.members.cache) {
                if (member.user.bot) continue; // تجاهل البوتات
                
                members.push({
                    id: member.id,
                    tag: member.user.tag,
                    displayName: member.displayName,
                    nickname: member.nickname,
                    joinedAt: member.joinedAt,
                    roles: member.roles.cache.map(role => ({
                        id: role.id,
                        name: role.name
                    })).filter(role => role.id !== guild.id),
                    permissions: member.permissions.bitfield.toString(),
                    avatar: member.user.displayAvatarURL(),
                    createdAt: member.user.createdAt
                });
            }
            return members;
        } catch (error) {
            console.error(chalk.red('❌ خطأ في نسخ الأعضاء:'), error);
            return [];
        }
    }

    async backupEmojis(guild) {
        try {
            const emojis = [];
            for (const [emojiId, emoji] of guild.emojis.cache) {
                emojis.push({
                    id: emoji.id,
                    name: emoji.name,
                    animated: emoji.animated,
                    url: emoji.url,
                    managed: emoji.managed,
                    available: emoji.available,
                    createdAt: emoji.createdAt
                });
            }
            return emojis;
        } catch (error) {
            console.error(chalk.red('❌ خطأ في نسخ الإيموجيات:'), error);
            return [];
        }
    }

    async backupBans(guild) {
        try {
            const bans = [];
            const guildBans = await guild.bans.fetch();
            
            for (const [userId, ban] of guildBans) {
                bans.push({
                    userId: ban.user.id,
                    userTag: ban.user.tag,
                    reason: ban.reason,
                    createdAt: ban.user.createdAt
                });
            }
            return bans;
        } catch (error) {
            console.error(chalk.red('❌ خطأ في نسخ قائمة المحظورين:'), error);
            return [];
        }
    }

    async backupBotSettings(guildId) {
        try {
            const settings = {
                protection: this.client.config.get('protection'),
                logging: this.client.config.get('logging'),
                moderation: this.client.config.get('moderation'),
                features: this.client.config.get('features'),
                whitelist: {
                    users: await this.client.database.getWhitelist(guildId, 'users'),
                    roles: await this.client.database.getWhitelist(guildId, 'roles'),
                    bots: await this.client.database.getWhitelist(guildId, 'bots')
                }
            };
            return settings;
        } catch (error) {
            console.error(chalk.red('❌ خطأ في نسخ إعدادات البوت:'), error);
            return {};
        }
    }

    async restoreBackup(guild, backupFileName) {
        try {
            const backupPath = path.join(this.backupPath, backupFileName);
            if (!await fs.pathExists(backupPath)) {
                throw new Error('ملف النسخة الاحتياطية غير موجود');
            }

            const backupData = await fs.readJson(backupPath);
            const results = {
                roles: { success: 0, failed: 0 },
                channels: { success: 0, failed: 0 },
                members: { success: 0, failed: 0 },
                settings: { success: false }
            };

            // استعادة الرتب
            await this.restoreRoles(guild, backupData.roles, results.roles);
            
            // استعادة القنوات
            await this.restoreChannels(guild, backupData.channels, results.channels);
            
            // استعادة الأعضاء (الرتب فقط)
            await this.restoreMembers(guild, backupData.members, results.members);
            
            // استعادة إعدادات البوت
            results.settings.success = await this.restoreBotSettings(guild.id, backupData.settings);

            await this.client.logger.success(`تم استعادة النسخة الاحتياطية للسيرفر ${guild.name}`);
            
            return { success: true, results };
            
        } catch (error) {
            console.error(chalk.red('❌ خطأ في استعادة النسخة الاحتياطية:'), error);
            return { success: false, error: error.message };
        }
    }

    async restoreRoles(guild, rolesData, results) {
        for (const roleData of rolesData) {
            try {
                // التحقق من وجود الرتبة
                let existingRole = guild.roles.cache.get(roleData.id);
                
                if (!existingRole) {
                    // إنشاء رتبة جديدة
                    existingRole = await guild.roles.create({
                        name: roleData.name,
                        color: roleData.color,
                        hoist: roleData.hoist,
                        permissions: roleData.permissions,
                        mentionable: roleData.mentionable,
                        reason: 'استعادة من النسخة الاحتياطية'
                    });
                } else {
                    // تحديث الرتبة الموجودة
                    await existingRole.edit({
                        name: roleData.name,
                        color: roleData.color,
                        hoist: roleData.hoist,
                        permissions: roleData.permissions,
                        mentionable: roleData.mentionable
                    });
                }
                
                results.success++;
            } catch (error) {
                console.error(chalk.red(`❌ خطأ في استعادة الرتبة ${roleData.name}:`), error);
                results.failed++;
            }
        }
    }

    async restoreChannels(guild, channelsData, results) {
        // ترتيب القنوات حسب النوع والموضع
        const sortedChannels = channelsData.sort((a, b) => {
            if (a.type !== b.type) {
                return a.type - b.type;
            }
            return a.position - b.position;
        });

        for (const channelData of sortedChannels) {
            try {
                let existingChannel = guild.channels.cache.get(channelData.id);
                
                if (!existingChannel) {
                    // إنشاء قناة جديدة
                    const createOptions = {
                        name: channelData.name,
                        type: channelData.type,
                        position: channelData.position,
                        parent: channelData.parentId,
                        reason: 'استعادة من النسخة الاحتياطية'
                    };

                    if (channelData.topic) createOptions.topic = channelData.topic;
                    if (channelData.nsfw !== undefined) createOptions.nsfw = channelData.nsfw;
                    if (channelData.rateLimitPerUser) createOptions.rateLimitPerUser = channelData.rateLimitPerUser;
                    if (channelData.bitrate) createOptions.bitrate = channelData.bitrate;
                    if (channelData.userLimit) createOptions.userLimit = channelData.userLimit;

                    existingChannel = await guild.channels.create(createOptions);
                }

                // استعادة صلاحيات القناة
                for (const overwrite of channelData.permissionOverwrites) {
                    try {
                        await existingChannel.permissionOverwrites.create(overwrite.id, {
                            allow: overwrite.allow,
                            deny: overwrite.deny
                        });
                    } catch (permError) {
                        console.error(chalk.yellow(`⚠️ خطأ في استعادة صلاحيات القناة ${channelData.name}:`), permError);
                    }
                }
                
                results.success++;
            } catch (error) {
                console.error(chalk.red(`❌ خطأ في استعادة القناة ${channelData.name}:`), error);
                results.failed++;
            }
        }
    }

    async restoreMembers(guild, membersData, results) {
        for (const memberData of membersData) {
            try {
                const member = guild.members.cache.get(memberData.id);
                if (!member) continue; // العضو غير موجود في السيرفر
                
                // استعادة الرتب
                for (const roleData of memberData.roles) {
                    const role = guild.roles.cache.get(roleData.id);
                    if (role && !member.roles.cache.has(role.id)) {
                        await member.roles.add(role, 'استعادة من النسخة الاحتياطية');
                    }
                }
                
                // استعادة اللقب
                if (memberData.nickname && member.nickname !== memberData.nickname) {
                    await member.setNickname(memberData.nickname, 'استعادة من النسخة الاحتياطية');
                }
                
                results.success++;
            } catch (error) {
                console.error(chalk.red(`❌ خطأ في استعادة العضو ${memberData.tag}:`), error);
                results.failed++;
            }
        }
    }

    async restoreBotSettings(guildId, settingsData) {
        try {
            if (settingsData.protection) {
                await this.client.config.set('protection', settingsData.protection);
            }
            
            if (settingsData.logging) {
                await this.client.config.set('logging', settingsData.logging);
            }
            
            if (settingsData.moderation) {
                await this.client.config.set('moderation', settingsData.moderation);
            }
            
            if (settingsData.features) {
                await this.client.config.set('features', settingsData.features);
            }
            
            if (settingsData.whitelist) {
                await this.client.database.set(`whitelist_${guildId}_users`, settingsData.whitelist.users || []);
                await this.client.database.set(`whitelist_${guildId}_roles`, settingsData.whitelist.roles || []);
                await this.client.database.set(`whitelist_${guildId}_bots`, settingsData.whitelist.bots || []);
            }
            
            return true;
        } catch (error) {
            console.error(chalk.red('❌ خطأ في استعادة إعدادات البوت:'), error);
            return false;
        }
    }

    async getBackupList(guildId) {
        try {
            const files = await fs.readdir(this.backupPath);
            const backups = [];
            
            for (const file of files) {
                if (file.startsWith(`backup_${guildId}_`) && file.endsWith('.json')) {
                    const filePath = path.join(this.backupPath, file);
                    const stats = await fs.stat(filePath);
                    const backupData = await fs.readJson(filePath);
                    
                    backups.push({
                        fileName: file,
                        createdAt: backupData.timestamp,
                        size: stats.size,
                        itemCount: this.countBackupItems(backupData)
                    });
                }
            }
            
            return backups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } catch (error) {
            console.error(chalk.red('❌ خطأ في جلب قائمة النسخ الاحتياطية:'), error);
            return [];
        }
    }

    async deleteBackup(fileName) {
        try {
            const filePath = path.join(this.backupPath, fileName);
            await fs.remove(filePath);
            return true;
        } catch (error) {
            console.error(chalk.red('❌ خطأ في حذف النسخة الاحتياطية:'), error);
            return false;
        }
    }

    async cleanupOldBackups(guildId) {
        try {
            const backups = await this.getBackupList(guildId);
            if (backups.length > this.maxBackups) {
                const oldBackups = backups.slice(this.maxBackups);
                for (const backup of oldBackups) {
                    await this.deleteBackup(backup.fileName);
                }
            }
        } catch (error) {
            console.error(chalk.red('❌ خطأ في تنظيف النسخ القديمة:'), error);
        }
    }

    async saveBackupInfo(guildId, fileName, backupData) {
        try {
            const backupInfo = {
                fileName,
                guildId,
                guildName: backupData.guildInfo.name,
                createdAt: backupData.timestamp,
                itemCount: this.countBackupItems(backupData)
            };
            
            await this.client.database.set(`backup_info_${guildId}_${fileName}`, backupInfo);
        } catch (error) {
            console.error(chalk.red('❌ خطأ في حفظ معلومات النسخة الاحتياطية:'), error);
        }
    }

    countBackupItems(backupData) {
        return {
            roles: backupData.roles?.length || 0,
            channels: backupData.channels?.length || 0,
            members: backupData.members?.length || 0,
            emojis: backupData.emojis?.length || 0,
            bans: backupData.bans?.length || 0
        };
    }

    async getFileSize(filePath) {
        try {
            const stats = await fs.stat(filePath);
            return this.formatFileSize(stats.size);
        } catch (error) {
            return 'غير معروف';
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

module.exports = BackupManager;

