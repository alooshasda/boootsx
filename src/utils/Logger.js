const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { EmbedBuilder } = require('discord.js');

class Logger {
    constructor() {
        this.logPath = path.join(process.cwd(), 'logs');
        this.init();
    }

    async init() {
        try {
            await fs.ensureDir(this.logPath);
            console.log(chalk.green('✅ تم تهيئة نظام التسجيل بنجاح'));
        } catch (error) {
            console.error(chalk.red('❌ خطأ في تهيئة نظام التسجيل:'), error);
        }
    }

    async log(level, message, data = null) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            data
        };

        // طباعة في وحدة التحكم
        const coloredMessage = this.getColoredMessage(level, message);
        console.log(`[${timestamp}] ${coloredMessage}`);

        // حفظ في ملف
        await this.writeToFile(level, logEntry);
    }

    async info(message, data = null) {
        await this.log('INFO', message, data);
    }

    async warn(message, data = null) {
        await this.log('WARN', message, data);
    }

    async error(message, data = null) {
        await this.log('ERROR', message, data);
    }

    async success(message, data = null) {
        await this.log('SUCCESS', message, data);
    }

    async debug(message, data = null) {
        if (process.env.NODE_ENV === 'development') {
            await this.log('DEBUG', message, data);
        }
    }

    getColoredMessage(level, message) {
        switch (level) {
            case 'INFO':
                return chalk.blue(`[INFO] ${message}`);
            case 'WARN':
                return chalk.yellow(`[WARN] ${message}`);
            case 'ERROR':
                return chalk.red(`[ERROR] ${message}`);
            case 'SUCCESS':
                return chalk.green(`[SUCCESS] ${message}`);
            case 'DEBUG':
                return chalk.gray(`[DEBUG] ${message}`);
            default:
                return `[${level}] ${message}`;
        }
    }

    async writeToFile(level, logEntry) {
        try {
            const today = new Date().toISOString().split('T')[0];
            const fileName = `${today}.log`;
            const filePath = path.join(this.logPath, fileName);
            
            const logLine = JSON.stringify(logEntry) + '\n';
            await fs.appendFile(filePath, logLine);

            // تنظيف الملفات القديمة (الاحتفاظ بآخر 30 يوم)
            await this.cleanupOldLogs();
        } catch (error) {
            console.error(chalk.red('❌ خطأ في كتابة السجل:'), error);
        }
    }

    async cleanupOldLogs() {
        try {
            const files = await fs.readdir(this.logPath);
            const now = Date.now();
            const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

            for (const file of files) {
                if (file.endsWith('.log')) {
                    const filePath = path.join(this.logPath, file);
                    const stats = await fs.stat(filePath);
                    
                    if (stats.mtime.getTime() < thirtyDaysAgo) {
                        await fs.remove(filePath);
                        console.log(chalk.gray(`تم حذف ملف السجل القديم: ${file}`));
                    }
                }
            }
        } catch (error) {
            console.error(chalk.red('❌ خطأ في تنظيف السجلات القديمة:'), error);
        }
    }

    createProtectionEmbed(protectionType, user, reason, details = {}) {
        const embed = new EmbedBuilder()
            .setTitle(`🛡️ ${protectionType}`)
            .setDescription(`**السبب:** ${reason}`)
            .addFields(
                { name: '👤 المستخدم', value: `${user.tag} (\`${user.id}\`)`, inline: true },
                { name: '⏰ الوقت', value: new Date().toLocaleString('ar-SA'), inline: true }
            )
            .setColor('#FF6B6B')
            .setThumbnail(user.displayAvatarURL())
            .setTimestamp();

        // إضافة تفاصيل إضافية
        if (details.target) {
            embed.addFields({ name: '🎯 الهدف', value: details.target, inline: true });
        }

        if (details.count) {
            embed.addFields({ name: '📊 العدد', value: details.count.toString(), inline: true });
        }

        if (details.executor && details.executor.id !== user.id) {
            embed.addFields({ name: '⚡ المنفذ', value: `${details.executor.tag} (\`${details.executor.id}\`)`, inline: true });
        }

        embed.setFooter({ 
            text: '© متجر الحماية - نظام الحماية المتقدم',
            iconURL: user.client?.user?.displayAvatarURL() 
        });

        return embed;
    }

    createBackupEmbed(action, success, details = {}) {
        const embed = new EmbedBuilder()
            .setTitle(`💾 ${action}`)
            .setColor(success ? '#00FF00' : '#FF0000')
            .setTimestamp();

        if (success) {
            embed.setDescription('✅ تم تنفيذ العملية بنجاح');
            
            if (details.itemCount) {
                embed.addFields({ name: '📊 عدد العناصر', value: details.itemCount.toString(), inline: true });
            }
            
            if (details.size) {
                embed.addFields({ name: '📁 الحجم', value: details.size, inline: true });
            }
        } else {
            embed.setDescription('❌ فشل في تنفيذ العملية');
            
            if (details.error) {
                embed.addFields({ name: '🚫 الخطأ', value: details.error, inline: false });
            }
        }

        embed.setFooter({ 
            text: '© متجر الحماية - نظام النسخ الاحتياطي',
        });

        return embed;
    }

    createSystemEmbed(title, description, color = '#0099FF', fields = []) {
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setColor(color)
            .setTimestamp();

        if (fields.length > 0) {
            embed.addFields(fields);
        }

        embed.setFooter({ 
            text: '© متجر الحماية - نظام إدارة متقدم',
        });

        return embed;
    }

    async logToChannel(client, guildId, embed) {
        try {
            const logChannelId = client.config.get('logging.channel');
            if (!logChannelId) return;

            const guild = client.guilds.cache.get(guildId);
            if (!guild) return;

            const logChannel = guild.channels.cache.get(logChannelId);
            if (!logChannel) return;

            await logChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error(chalk.red('❌ خطأ في إرسال السجل للقناة:'), error);
        }
    }

    async getLogStats() {
        try {
            const files = await fs.readdir(this.logPath);
            const logFiles = files.filter(file => file.endsWith('.log'));
            
            let totalEntries = 0;
            let totalSize = 0;

            for (const file of logFiles) {
                const filePath = path.join(this.logPath, file);
                const stats = await fs.stat(filePath);
                totalSize += stats.size;

                const content = await fs.readFile(filePath, 'utf8');
                const lines = content.split('\n').filter(line => line.trim());
                totalEntries += lines.length;
            }

            return {
                files: logFiles.length,
                entries: totalEntries,
                size: this.formatFileSize(totalSize)
            };
        } catch (error) {
            console.error(chalk.red('❌ خطأ في جلب إحصائيات السجلات:'), error);
            return { files: 0, entries: 0, size: '0 B' };
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async exportLogs(startDate, endDate) {
        try {
            const logs = [];
            const files = await fs.readdir(this.logPath);
            
            for (const file of files) {
                if (!file.endsWith('.log')) continue;
                
                const fileDate = new Date(file.replace('.log', ''));
                if (fileDate >= startDate && fileDate <= endDate) {
                    const filePath = path.join(this.logPath, file);
                    const content = await fs.readFile(filePath, 'utf8');
                    const lines = content.split('\n').filter(line => line.trim());
                    
                    for (const line of lines) {
                        try {
                            const logEntry = JSON.parse(line);
                            logs.push(logEntry);
                        } catch (parseError) {
                            // تجاهل الأسطر التي لا يمكن تحليلها
                        }
                    }
                }
            }

            return logs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        } catch (error) {
            console.error(chalk.red('❌ خطأ في تصدير السجلات:'), error);
            return [];
        }
    }
}

module.exports = Logger;

