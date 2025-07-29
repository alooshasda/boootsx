const { Client, GatewayIntentBits, Collection, Events } = require('discord.js');
const { readdirSync } = require('fs');
const path = require('path');
const chalk = require('chalk');
const Keyv = require('keyv');
const KeyvSqlite = require('@keyv/sqlite');
require('dotenv').config();

// استيراد الوحدات المخصصة
const ConfigManager = require('./src/managers/ConfigManager');
const DatabaseManager = require('./src/managers/DatabaseManager');
const ProtectionManager = require('./src/managers/ProtectionManager');
const BackupManager = require('./src/managers/BackupManager');
const Logger = require('./src/utils/Logger');

class ProtectionBot {
    constructor() {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildModeration,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildBans,
                GatewayIntentBits.GuildWebhooks,
                GatewayIntentBits.GuildInvites
            ]
        });

        this.commands = new Collection();
        this.cooldowns = new Collection();
        
        // إعداد المدراء
        this.configManager = new ConfigManager();
        this.databaseManager = new DatabaseManager();
        this.protectionManager = new ProtectionManager(this);
        this.backupManager = new BackupManager(this);
        this.logger = new Logger();

        // ربط المدراء بالعميل
        this.client.config = this.configManager;
        this.client.database = this.databaseManager;
        this.client.protection = this.protectionManager;
        this.client.backup = this.backupManager;
        this.client.logger = this.logger;

        this.init();
    }

    async init() {
        try {
            console.log(chalk.blue('🚀 بدء تشغيل بوت الحماية المتقدم...'));
            
            // تحميل التكوين
            await this.configManager.load();
            console.log(chalk.green('✅ تم تحميل التكوين بنجاح'));

            // تهيئة قاعدة البيانات
            await this.databaseManager.init();
            console.log(chalk.green('✅ تم تهيئة قاعدة البيانات بنجاح'));

            // تحميل الأحداث
            this.loadEvents();
            console.log(chalk.green('✅ تم تحميل الأحداث بنجاح'));

            // تحميل الأوامر
            this.loadCommands();
            console.log(chalk.green('✅ تم تحميل الأوامر بنجاح'));

            // تحميل أنظمة الحماية
            this.protectionManager.init();
            console.log(chalk.green('✅ تم تهيئة أنظمة الحماية بنجاح'));

            // تسجيل الدخول
            await this.client.login(process.env.DISCORD_TOKEN);
            
        } catch (error) {
            console.error(chalk.red('❌ خطأ في تشغيل البوت:'), error);
            process.exit(1);
        }
    }

    loadEvents() {
        const eventsPath = path.join(__dirname, 'src', 'events');
        const eventFolders = readdirSync(eventsPath);

        for (const folder of eventFolders) {
            const folderPath = path.join(eventsPath, folder);
            const eventFiles = readdirSync(folderPath).filter(file => file.endsWith('.js'));

            for (const file of eventFiles) {
                const filePath = path.join(folderPath, file);
                const event = require(filePath);

                if (event.once) {
                    this.client.once(event.name, (...args) => event.execute(...args, this.client));
                } else {
                    this.client.on(event.name, (...args) => event.execute(...args, this.client));
                }
            }
        }
    }

    loadCommands() {
        const commandsPath = path.join(__dirname, 'src', 'commands');
        const commandFolders = readdirSync(commandsPath);

        for (const folder of commandFolders) {
            const folderPath = path.join(commandsPath, folder);
            const commandFiles = readdirSync(folderPath).filter(file => file.endsWith('.js'));

            for (const file of commandFiles) {
                const filePath = path.join(folderPath, file);
                const command = require(filePath);

                if ('data' in command && 'execute' in command) {
                    this.commands.set(command.data.name, command);
                    this.client.commands = this.commands;
                } else {
                    console.log(chalk.yellow(`⚠️ الأمر في ${filePath} مفقود خاصية "data" أو "execute"`));
                }
            }
        }
    }
}

// إنشاء وتشغيل البوت
const bot = new ProtectionBot();

// معالجة الأخطاء غير المتوقعة
process.on('unhandledRejection', error => {
    console.error(chalk.red('Unhandled promise rejection:'), error);
});

process.on('uncaughtException', error => {
    console.error(chalk.red('Uncaught exception:'), error);
    process.exit(1);
});

module.exports = ProtectionBot;

