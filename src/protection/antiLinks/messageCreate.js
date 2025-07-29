const { Events } = require('discord.js');

module.exports = {
    name: Events.MessageCreate,
    
    init(client) {
        this.client = client;
        this.linkRegex = /(https?:\/\/[^\s]+)/gi;
        this.discordInviteRegex = /(discord\.gg\/|discord\.com\/invite\/|discordapp\.com\/invite\/)[a-zA-Z0-9]+/gi;
    },

    async execute(message) {
        try {
            // تجاهل رسائل البوتات والرسائل الخاصة
            if (message.author.bot || !message.guild) return;

            const guild = message.guild;
            const guildId = guild.id;

            // التحقق من تفعيل الحماية
            const isEnabled = await this.client.protection.isProtectionEnabled(guildId, 'antiLinks');
            if (!isEnabled) return;

            // التحقق من القائمة البيضاء
            const member = message.member;
            const userRoles = member ? member.roles.cache.map(r => r.id) : [];
            const isWhitelisted = await this.client.protection.checkWhitelist(guildId, message.author.id, userRoles);
            if (isWhitelisted) return;

            // الحصول على إعدادات الحماية
            const config = await this.client.protection.getProtectionConfig(guildId, 'antiLinks');
            const action = config.action || 'delete';
            const allowedDomains = config.allowedDomains || [];
            const blockedDomains = config.blockedDomains || [];

            // البحث عن الروابط في الرسالة
            const links = message.content.match(this.linkRegex);
            const discordInvites = message.content.match(this.discordInviteRegex);

            let shouldTakeAction = false;
            let violationType = '';
            let violationDetails = {};

            // التحقق من دعوات Discord
            if (discordInvites && discordInvites.length > 0) {
                // التحقق من السماح بدعوات Discord
                if (!config.allowDiscordInvites) {
                    shouldTakeAction = true;
                    violationType = 'discordInvite';
                    violationDetails = {
                        invites: discordInvites,
                        messageContent: message.content.substring(0, 100)
                    };
                }
            }

            // التحقق من الروابط العامة
            if (links && links.length > 0 && !shouldTakeAction) {
                for (const link of links) {
                    try {
                        const url = new URL(link);
                        const domain = url.hostname.toLowerCase();

                        // التحقق من النطاقات المحظورة
                        if (blockedDomains.some(blocked => domain.includes(blocked.toLowerCase()))) {
                            shouldTakeAction = true;
                            violationType = 'blockedDomain';
                            violationDetails = {
                                link,
                                domain,
                                messageContent: message.content.substring(0, 100)
                            };
                            break;
                        }

                        // التحقق من النطاقات المسموحة (إذا كانت القائمة غير فارغة)
                        if (allowedDomains.length > 0) {
                            const isAllowed = allowedDomains.some(allowed => 
                                domain.includes(allowed.toLowerCase())
                            );
                            
                            if (!isAllowed) {
                                shouldTakeAction = true;
                                violationType = 'notAllowedDomain';
                                violationDetails = {
                                    link,
                                    domain,
                                    messageContent: message.content.substring(0, 100)
                                };
                                break;
                            }
                        }

                        // التحقق من الروابط المختصرة المشبوهة
                        if (this.isSuspiciousShortLink(domain)) {
                            shouldTakeAction = true;
                            violationType = 'suspiciousLink';
                            violationDetails = {
                                link,
                                domain,
                                messageContent: message.content.substring(0, 100)
                            };
                            break;
                        }

                    } catch (urlError) {
                        // رابط غير صحيح، قد يكون مشبوه
                        shouldTakeAction = true;
                        violationType = 'malformedLink';
                        violationDetails = {
                            link,
                            messageContent: message.content.substring(0, 100)
                        };
                        break;
                    }
                }
            }

            if (shouldTakeAction) {
                // تسجيل المخالفة
                await this.client.protection.recordViolation(guildId, message.author.id, 'antiLinks', {
                    violationType,
                    channelId: message.channel.id,
                    messageId: message.id,
                    ...violationDetails,
                    timestamp: Date.now()
                });

                // حذف الرسالة
                try {
                    await message.delete();
                } catch (deleteError) {
                    console.error('خطأ في حذف الرسالة:', deleteError);
                }

                // تنفيذ الإجراء الإضافي إذا لزم الأمر
                if (action !== 'delete') {
                    const reason = this.getViolationReason(violationType, violationDetails);
                    await this.client.protection.executeAction(guild, member, action, reason);
                }

                // إرسال تنبيه
                await this.sendAlert(guild, message.author, violationType, violationDetails);

                // إرسال رسالة تحذيرية للمستخدم (اختياري)
                if (config.sendWarningMessage) {
                    await this.sendWarningMessage(message, violationType);
                }

                // تسجيل في السجل
                await this.client.logger.warn(`تم حذف رسالة تحتوي على رابط مخالف من ${message.author.tag} في ${guild.name}`);
            }

        } catch (error) {
            console.error('خطأ في حماية الروابط:', error);
        }
    },

    isSuspiciousShortLink(domain) {
        const suspiciousShorteners = [
            'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly',
            'short.link', 'tiny.cc', 'is.gd', 'buff.ly', 'adf.ly',
            'linkvertise.com', 'ouo.io', 'sh.st', 'bc.vc'
        ];
        
        return suspiciousShorteners.some(shortener => domain.includes(shortener));
    },

    getViolationReason(violationType, details) {
        switch (violationType) {
            case 'discordInvite':
                return 'إرسال دعوة Discord غير مسموحة';
            case 'blockedDomain':
                return `إرسال رابط من نطاق محظور: ${details.domain}`;
            case 'notAllowedDomain':
                return `إرسال رابط من نطاق غير مسموح: ${details.domain}`;
            case 'suspiciousLink':
                return `إرسال رابط مشبوه: ${details.domain}`;
            case 'malformedLink':
                return 'إرسال رابط غير صحيح أو مشبوه';
            default:
                return 'إرسال رابط مخالف';
        }
    },

    async sendAlert(guild, user, violationType, details) {
        try {
            const logChannelId = this.client.config.get('logging.channel');
            if (!logChannelId) return;

            const logChannel = guild.channels.cache.get(logChannelId);
            if (!logChannel) return;

            const reason = this.getViolationReason(violationType, details);
            const embed = this.client.logger.createProtectionEmbed(
                'حماية الروابط',
                user,
                reason,
                {
                    target: details.link || 'رابط محذوف',
                    executor: user
                }
            );

            await logChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error('خطأ في إرسال تنبيه حماية الروابط:', error);
        }
    },

    async sendWarningMessage(message, violationType) {
        try {
            const warningMessages = {
                'discordInvite': '⚠️ لا يُسمح بإرسال دعوات Discord في هذا السيرفر.',
                'blockedDomain': '⚠️ الرابط الذي أرسلته من نطاق محظور.',
                'notAllowedDomain': '⚠️ يُسمح فقط بالروابط من نطاقات محددة.',
                'suspiciousLink': '⚠️ الرابط الذي أرسلته يبدو مشبوهاً.',
                'malformedLink': '⚠️ الرابط الذي أرسلته غير صحيح.'
            };

            const warningText = warningMessages[violationType] || '⚠️ الرابط الذي أرسلته مخالف لقوانين السيرفر.';
            
            const warningMessage = await message.channel.send(`${message.author}, ${warningText}`);
            
            // حذف رسالة التحذير بعد 10 ثوان
            setTimeout(async () => {
                try {
                    await warningMessage.delete();
                } catch (deleteError) {
                    // تجاهل الخطأ إذا كانت الرسالة محذوفة بالفعل
                }
            }, 10000);

        } catch (error) {
            console.error('خطأ في إرسال رسالة التحذير:', error);
        }
    }
};

