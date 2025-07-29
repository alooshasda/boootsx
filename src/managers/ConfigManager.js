const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

class ConfigManager {
    constructor() {
        this.configPath = path.join(process.cwd(), 'config.json');
        this.config = null;
        this.defaultConfig = this.getDefaultConfig();
    }

    async load() {
        try {
            if (await fs.pathExists(this.configPath)) {
                const configData = await fs.readJson(this.configPath);
                this.config = this.mergeWithDefaults(configData);
            } else {
                console.log(chalk.yellow('⚠️ ملف التكوين غير موجود، سيتم إنشاء ملف افتراضي'));
                this.config = this.defaultConfig;
                await this.save();
            }
            return this.config;
        } catch (error) {
            console.error(chalk.red('❌ خطأ في تحميل ملف التكوين:'), error);
            throw error;
        }
    }

    async save() {
        try {
            await fs.writeJson(this.configPath, this.config, { spaces: 2 });
            console.log(chalk.green('✅ تم حفظ ملف التكوين بنجاح'));
        } catch (error) {
            console.error(chalk.red('❌ خطأ في حفظ ملف التكوين:'), error);
            throw error;
        }
    }

    get(key) {
        const keys = key.split('.');
        let value = this.config;
        
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return undefined;
            }
        }
        
        return value;
    }

    async set(key, value) {
        const keys = key.split('.');
        let current = this.config;
        
        for (let i = 0; i < keys.length - 1; i++) {
            const k = keys[i];
            if (!(k in current) || typeof current[k] !== 'object') {
                current[k] = {};
            }
            current = current[k];
        }
        
        current[keys[keys.length - 1]] = value;
        await this.save();
    }

    mergeWithDefaults(config) {
        return this.deepMerge(this.defaultConfig, config);
    }

    deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(target[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        
        return result;
    }

    getDefaultConfig() {
        return {
            bot: {
                prefix: "-",
                language: "ar",
                token: "",
                clientId: "",
                guildId: ""
            },
            database: {
                type: "sqlite",
                path: "database.sqlite"
            },
            permissions: {
                developers: [],
                botWhitelist: [],
                userWhitelist: [],
                roleWhitelist: []
            },
            protection: {
                antiRoles: {
                    enabled: false,
                    action: "ban",
                    maxRoles: 5,
                    timeWindow: 60000
                },
                antiChannels: {
                    enabled: false,
                    action: "ban",
                    maxChannels: 5,
                    timeWindow: 60000
                },
                antiBots: {
                    enabled: false,
                    action: "kick",
                    maxBots: 3,
                    timeWindow: 60000
                },
                antiLinks: {
                    enabled: false,
                    action: "delete",
                    allowedDomains: [],
                    blockedDomains: []
                },
                antiAlt: {
                    enabled: false,
                    action: "kick",
                    minAccountAge: 604800000,
                    assignRole: null
                },
                antiWebhook: {
                    enabled: false,
                    action: "ban"
                },
                antiPrune: {
                    enabled: false,
                    action: "ban"
                },
                antiSpam: {
                    enabled: false,
                    action: "mute",
                    maxMessages: 5,
                    timeWindow: 5000
                }
            },
            logging: {
                enabled: true,
                channel: null,
                events: [
                    "roleCreate",
                    "roleDelete",
                    "channelCreate",
                    "channelDelete",
                    "guildMemberAdd",
                    "guildMemberRemove",
                    "messageDelete",
                    "messageUpdate",
                    "guildBanAdd",
                    "guildBanRemove"
                ]
            },
            backup: {
                autoBackup: false,
                backupInterval: 86400000,
                maxBackups: 10,
                backupPath: "./backups/"
            },
            messages: {
                welcome: {
                    enabled: false,
                    channel: null,
                    message: "مرحباً بك في السيرفر!"
                },
                leave: {
                    enabled: false,
                    channel: null,
                    message: "وداعاً!"
                }
            },
            moderation: {
                muteRole: null,
                autoModeration: {
                    enabled: false,
                    badWords: [],
                    action: "warn"
                }
            },
            features: {
                autoRole: {
                    enabled: false,
                    roles: []
                },
                reactionRoles: {
                    enabled: false,
                    roles: []
                }
            }
        };
    }
}

module.exports = ConfigManager;

