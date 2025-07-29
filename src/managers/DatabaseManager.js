const Keyv = require('keyv');
const KeyvSqlite = require('@keyv/sqlite');
const chalk = require('chalk');

class DatabaseManager {
    constructor() {
        this.db = null;
        this.cache = new Map();
    }

    async init() {
        try {
            const dbPath = process.env.DATABASE_URL || 'sqlite://database.sqlite';
            this.db = new Keyv(new KeyvSqlite(dbPath));
            
            this.db.on('error', err => {
                console.error(chalk.red('❌ خطأ في قاعدة البيانات:'), err);
            });

            console.log(chalk.green('✅ تم الاتصال بقاعدة البيانات بنجاح'));
        } catch (error) {
            console.error(chalk.red('❌ فشل في الاتصال بقاعدة البيانات:'), error);
            throw error;
        }
    }

    async get(key) {
        try {
            // التحقق من الكاش أولاً
            if (this.cache.has(key)) {
                return this.cache.get(key);
            }

            const value = await this.db.get(key);
            
            // حفظ في الكاش
            if (value !== undefined) {
                this.cache.set(key, value);
            }
            
            return value;
        } catch (error) {
            console.error(chalk.red(`❌ خطأ في قراءة البيانات للمفتاح ${key}:`), error);
            return null;
        }
    }

    async set(key, value) {
        try {
            await this.db.set(key, value);
            
            // تحديث الكاش
            this.cache.set(key, value);
            
            return true;
        } catch (error) {
            console.error(chalk.red(`❌ خطأ في كتابة البيانات للمفتاح ${key}:`), error);
            return false;
        }
    }

    async delete(key) {
        try {
            await this.db.delete(key);
            
            // حذف من الكاش
            this.cache.delete(key);
            
            return true;
        } catch (error) {
            console.error(chalk.red(`❌ خطأ في حذف البيانات للمفتاح ${key}:`), error);
            return false;
        }
    }

    async has(key) {
        try {
            // التحقق من الكاش أولاً
            if (this.cache.has(key)) {
                return true;
            }

            const value = await this.db.get(key);
            return value !== undefined;
        } catch (error) {
            console.error(chalk.red(`❌ خطأ في التحقق من وجود المفتاح ${key}:`), error);
            return false;
        }
    }

    async clear() {
        try {
            await this.db.clear();
            this.cache.clear();
            return true;
        } catch (error) {
            console.error(chalk.red('❌ خطأ في مسح قاعدة البيانات:'), error);
            return false;
        }
    }

    // دوال مخصصة للحماية
    async getProtectionData(guildId, type) {
        const key = `protection_${guildId}_${type}`;
        return await this.get(key);
    }

    async setProtectionData(guildId, type, data) {
        const key = `protection_${guildId}_${type}`;
        return await this.set(key, data);
    }

    // دوال مخصصة للقائمة البيضاء
    async getWhitelist(guildId, type) {
        const key = `whitelist_${guildId}_${type}`;
        const data = await this.get(key);
        return data || [];
    }

    async addToWhitelist(guildId, type, id) {
        const whitelist = await this.getWhitelist(guildId, type);
        if (!whitelist.includes(id)) {
            whitelist.push(id);
            const key = `whitelist_${guildId}_${type}`;
            return await this.set(key, whitelist);
        }
        return true;
    }

    async removeFromWhitelist(guildId, type, id) {
        const whitelist = await this.getWhitelist(guildId, type);
        const index = whitelist.indexOf(id);
        if (index > -1) {
            whitelist.splice(index, 1);
            const key = `whitelist_${guildId}_${type}`;
            return await this.set(key, whitelist);
        }
        return true;
    }

    async isWhitelisted(guildId, type, id) {
        const whitelist = await this.getWhitelist(guildId, type);
        return whitelist.includes(id);
    }

    // دوال مخصصة للإحصائيات
    async incrementStat(guildId, stat) {
        const key = `stats_${guildId}_${stat}`;
        const current = await this.get(key) || 0;
        return await this.set(key, current + 1);
    }

    async getStat(guildId, stat) {
        const key = `stats_${guildId}_${stat}`;
        return await this.get(key) || 0;
    }

    // دوال مخصصة للنسخ الاحتياطي
    async getBackupData(guildId) {
        const key = `backup_${guildId}`;
        return await this.get(key);
    }

    async setBackupData(guildId, data) {
        const key = `backup_${guildId}`;
        return await this.set(key, data);
    }

    // تنظيف الكاش دورياً
    startCacheCleanup() {
        setInterval(() => {
            if (this.cache.size > 1000) {
                console.log(chalk.yellow('🧹 تنظيف الكاش...'));
                this.cache.clear();
            }
        }, 300000); // كل 5 دقائق
    }
}

module.exports = DatabaseManager;

