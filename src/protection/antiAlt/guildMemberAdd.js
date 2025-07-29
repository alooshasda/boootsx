const { Events } = require('discord.js');

module.exports = {
    name: Events.GuildMemberAdd,
    
    init(client) {
        this.client = client;
    },

    async execute(member) {
        try {
            const guild = member.guild;
            const guildId = guild.id;

            // تجاهل البوتات
            if (member.user.bot) return;

            // التحقق من تفعيل الحماية
            const isEnabled = await this.client.protection.isProtectionEnabled(guildId, 'antiAlt');
            if (!isEnabled) return;

            // الحصول على إعدادات الحماية
            const config = await this.client.protection.getProtectionConfig(guildId, 'antiAlt');
            const minAccountAge = config.minAccountAge || 604800000; // أسبوع واحد افتراضياً
            const action = config.action || 'kick';
            const assignRole = config.assignRole;

            // حساب عمر الحساب
            const accountAge = Date.now() - member.user.createdTimestamp;
            const isNewAccount = accountAge < minAccountAge;

            if (isNewAccount) {
                // تسجيل المخالفة
                await this.client.protection.recordViolation(guildId, member.user.id, 'antiAlt', {
                    accountAge: accountAge,
                    minRequiredAge: minAccountAge,
                    accountCreatedAt: member.user.createdAt,
                    joinedAt: member.joinedAt,
                    timestamp: Date.now()
                });

                // التحقق من الإجراء المطلوب
                if (action === 'assignRole' && assignRole) {
                    // إعطاء رتبة للحسابات الجديدة
                    try {
                        const role = guild.roles.cache.get(assignRole);
                        if (role) {
                            await member.roles.add(role, 'حساب جديد - حماية ضد الحسابات الوهمية');
                            
                            // إرسال تنبيه
                            await this.sendRoleAssignAlert(guild, member, role, accountAge, minAccountAge);
                            
                            // تسجيل في السجل
                            await this.client.logger.info(`تم إعطاء رتبة ${role.name} للحساب الجديد ${member.user.tag} في ${guild.name}`);
                        }
                    } catch (roleError) {
                        console.error('خطأ في إعطاء الرتبة للحساب الجديد:', roleError);
                    }
                } else {
                    // تنفيذ الإجراء (طرد أو حظر)
                    const reason = `حساب جديد - عمر الحساب: ${this.formatAge(accountAge)}, الحد الأدنى المطلوب: ${this.formatAge(minAccountAge)}`;
                    await this.client.protection.executeAction(guild, member, action, reason);

                    // إرسال تنبيه
                    await this.sendAlert(guild, member, accountAge, minAccountAge, action);

                    // تسجيل في السجل
                    await this.client.logger.warn(`تم ${action === 'ban' ? 'حظر' : 'طرد'} الحساب الجديد ${member.user.tag} من ${guild.name}`);
                }

                // إرسال رسالة خاصة للمستخدم (اختياري)
                if (config.sendDMMessage && action !== 'assignRole') {
                    await this.sendDMMessage(member, guild, minAccountAge);
                }

            } else {
                // الحساب قديم بما فيه الكفاية، التحقق من أنماط مشبوهة أخرى
                await this.checkSuspiciousPatterns(member, guild, config);
            }

        } catch (error) {
            console.error('خطأ في حماية الحسابات الوهمية:', error);
        }
    },

    async checkSuspiciousPatterns(member, guild, config) {
        try {
            let suspiciousScore = 0;
            const suspiciousReasons = [];

            // التحقق من اسم المستخدم المشبوه
            if (this.isSuspiciousUsername(member.user.username)) {
                suspiciousScore += 2;
                suspiciousReasons.push('اسم مستخدم مشبوه');
            }

            // التحقق من عدم وجود صورة شخصية
            if (!member.user.avatar) {
                suspiciousScore += 1;
                suspiciousReasons.push('لا يوجد صورة شخصية');
            }

            // التحقق من النشاط السابق (إذا كان متاحاً)
            const previousActivity = await this.checkPreviousActivity(member.user.id);
            if (previousActivity.isFirstTimeJoining && previousActivity.hasNoMutualGuilds) {
                suspiciousScore += 1;
                suspiciousReasons.push('لا يوجد نشاط سابق');
            }

            // إذا كان المجموع مشبوهاً
            if (suspiciousScore >= 3) {
                // تسجيل المخالفة
                await this.client.protection.recordViolation(guild.id, member.user.id, 'antiAlt', {
                    suspiciousScore,
                    suspiciousReasons,
                    accountAge: Date.now() - member.user.createdTimestamp,
                    timestamp: Date.now()
                });

                // إرسال تنبيه للمراقبة
                await this.sendSuspiciousAlert(guild, member, suspiciousScore, suspiciousReasons);

                // تسجيل في السجل
                await this.client.logger.warn(`تم اكتشاف حساب مشبوه ${member.user.tag} في ${guild.name} - النقاط: ${suspiciousScore}`);
            }

        } catch (error) {
            console.error('خطأ في فحص الأنماط المشبوهة:', error);
        }
    },

    isSuspiciousUsername(username) {
        // أنماط أسماء المستخدمين المشبوهة
        const suspiciousPatterns = [
            /^[a-z]+\d{4,}$/i, // حروف متبوعة بأرقام كثيرة
            /^user\d+$/i, // user متبوع بأرقام
            /^[a-z]{1,3}\d{8,}$/i, // حروف قليلة متبوعة بأرقام كثيرة
            /^discord/i, // يحتوي على discord
            /^admin/i, // يحتوي على admin
            /^mod/i, // يحتوي على mod
            /^bot/i, // يحتوي على bot
        ];

        return suspiciousPatterns.some(pattern => pattern.test(username));
    },

    async checkPreviousActivity(userId) {
        try {
            // فحص بسيط للنشاط السابق
            const mutualGuilds = this.client.guilds.cache.filter(guild => 
                guild.members.cache.has(userId)
            ).size;

            return {
                isFirstTimeJoining: mutualGuilds <= 1,
                hasNoMutualGuilds: mutualGuilds === 0
            };
        } catch (error) {
            return {
                isFirstTimeJoining: true,
                hasNoMutualGuilds: true
            };
        }
    },

    formatAge(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) {
            return `${days} يوم`;
        } else if (hours > 0) {
            return `${hours} ساعة`;
        } else if (minutes > 0) {
            return `${minutes} دقيقة`;
        } else {
            return `${seconds} ثانية`;
        }
    },

    async sendAlert(guild, member, accountAge, minAccountAge, action) {
        try {
            const logChannelId = this.client.config.get('logging.channel');
            if (!logChannelId) return;

            const logChannel = guild.channels.cache.get(logChannelId);
            if (!logChannel) return;

            const actionText = action === 'ban' ? 'حظر' : 'طرد';
            const embed = this.client.logger.createProtectionEmbed(
                'حماية الحسابات الوهمية',
                member.user,
                `تم ${actionText} حساب جديد`,
                {
                    target: `عمر الحساب: ${this.formatAge(accountAge)}`,
                    count: `الحد الأدنى: ${this.formatAge(minAccountAge)}`
                }
            );

            await logChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error('خطأ في إرسال تنبيه حماية الحسابات الوهمية:', error);
        }
    },

    async sendRoleAssignAlert(guild, member, role, accountAge, minAccountAge) {
        try {
            const logChannelId = this.client.config.get('logging.channel');
            if (!logChannelId) return;

            const logChannel = guild.channels.cache.get(logChannelId);
            if (!logChannel) return;

            const embed = this.client.logger.createProtectionEmbed(
                'حماية الحسابات الوهمية - إعطاء رتبة',
                member.user,
                `تم إعطاء رتبة للحساب الجديد`,
                {
                    target: `الرتبة: ${role.name}`,
                    count: `عمر الحساب: ${this.formatAge(accountAge)}`
                }
            );

            await logChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error('خطأ في إرسال تنبيه إعطاء الرتبة:', error);
        }
    },

    async sendSuspiciousAlert(guild, member, score, reasons) {
        try {
            const logChannelId = this.client.config.get('logging.channel');
            if (!logChannelId) return;

            const logChannel = guild.channels.cache.get(logChannelId);
            if (!logChannel) return;

            const embed = this.client.logger.createProtectionEmbed(
                'حماية الحسابات الوهمية - حساب مشبوه',
                member.user,
                `تم اكتشاف حساب مشبوه`,
                {
                    target: `الأسباب: ${reasons.join(', ')}`,
                    count: `نقاط الشك: ${score}`
                }
            );

            await logChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error('خطأ في إرسال تنبيه الحساب المشبوه:', error);
        }
    },

    async sendDMMessage(member, guild, minAccountAge) {
        try {
            const dmChannel = await member.createDM();
            const message = `مرحباً ${member.user.username}،

لقد تم ${action === 'ban' ? 'حظرك' : 'طردك'} من سيرفر **${guild.name}** بسبب أن حسابك جديد جداً.

الحد الأدنى لعمر الحساب المطلوب: ${this.formatAge(minAccountAge)}

يمكنك المحاولة مرة أخرى بعد أن يصبح حسابك أقدم.

شكراً لتفهمك.`;

            await dmChannel.send(message);
        } catch (error) {
            // تجاهل الخطأ إذا لم يكن بإمكان إرسال رسالة خاصة
            console.log(`لا يمكن إرسال رسالة خاصة للمستخدم ${member.user.tag}`);
        }
    }
};

