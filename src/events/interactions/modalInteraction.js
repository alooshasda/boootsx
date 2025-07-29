const { Events, EmbedBuilder } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    
    async execute(interaction, client) {
        if (!interaction.isModalSubmit()) return;

        try {
            const customId = interaction.customId;
            const guild = interaction.guild;
            const member = interaction.member;

            // التحقق من الصلاحيات
            if (!member.permissions.has('Administrator')) {
                return await interaction.reply({
                    content: '❌ ليس لديك صلاحية لاستخدام هذه الميزة.',
                    ephemeral: true
                });
            }

            // معالجة نماذج القائمة البيضاء
            if (customId.startsWith('whitelist_')) {
                await this.handleWhitelistModals(interaction, client, customId);
            }
            // معالجة نماذج التكوين
            else if (customId.startsWith('limits_modal_')) {
                await this.handleLimitsModal(interaction, client, customId);
            }
            // معالجة نماذج الإعدادات المتقدمة
            else if (customId.startsWith('advanced_modal_')) {
                await this.handleAdvancedModal(interaction, client, customId);
            }

        } catch (error) {
            console.error('خطأ في معالجة تفاعل النموذج:', error);
            
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ حدث خطأ أثناء معالجة طلبك.',
                    ephemeral: true
                });
            }
        }
    },

    async handleWhitelistModals(interaction, client, customId) {
        const guildId = interaction.guild.id;

        if (customId === 'whitelist_user_modal') {
            const userInput = interaction.fields.getTextInputValue('user_id');
            
            // استخراج معرف المستخدم من النص
            let userId = userInput.trim();
            
            // إزالة المنشن إذا كان موجوداً
            if (userId.startsWith('<@') && userId.endsWith('>')) {
                userId = userId.slice(2, -1);
                if (userId.startsWith('!')) {
                    userId = userId.slice(1);
                }
            }

            // التحقق من صحة معرف المستخدم
            if (!/^\d{17,19}$/.test(userId)) {
                return await interaction.reply({
                    content: '❌ معرف المستخدم غير صحيح. يجب أن يكون رقماً مكوناً من 17-19 رقم.',
                    ephemeral: true
                });
            }

            try {
                // التحقق من وجود المستخدم
                const user = await client.users.fetch(userId);
                
                // إضافة المستخدم للقائمة البيضاء
                await client.database.addToWhitelist(guildId, 'users', userId);

                const embed = new EmbedBuilder()
                    .setTitle('✅ تم إضافة المستخدم للقائمة البيضاء')
                    .setDescription(`تم إضافة **${user.tag}** (\`${userId}\`) للقائمة البيضاء بنجاح.`)
                    .setColor('#00FF00')
                    .setTimestamp();

                await interaction.reply({ embeds: [embed], ephemeral: true });

                // تسجيل العملية
                await client.logger.info(`تم إضافة ${user.tag} للقائمة البيضاء بواسطة ${interaction.user.tag}`);

            } catch (error) {
                await interaction.reply({
                    content: '❌ لم يتم العثور على المستخدم أو حدث خطأ أثناء الإضافة.',
                    ephemeral: true
                });
            }

        } else if (customId === 'whitelist_role_modal') {
            const roleInput = interaction.fields.getTextInputValue('role_id');
            
            let roleId = roleInput.trim();
            
            // إزالة المنشن إذا كان موجوداً
            if (roleId.startsWith('<@&') && roleId.endsWith('>')) {
                roleId = roleId.slice(3, -1);
            }

            // التحقق من صحة معرف الرتبة
            if (!/^\d{17,19}$/.test(roleId)) {
                return await interaction.reply({
                    content: '❌ معرف الرتبة غير صحيح.',
                    ephemeral: true
                });
            }

            const role = interaction.guild.roles.cache.get(roleId);
            if (!role) {
                return await interaction.reply({
                    content: '❌ لم يتم العثور على الرتبة في هذا السيرفر.',
                    ephemeral: true
                });
            }

            // إضافة الرتبة للقائمة البيضاء
            await client.database.addToWhitelist(guildId, 'roles', roleId);

            const embed = new EmbedBuilder()
                .setTitle('✅ تم إضافة الرتبة للقائمة البيضاء')
                .setDescription(`تم إضافة رتبة **${role.name}** (\`${roleId}\`) للقائمة البيضاء بنجاح.`)
                .setColor('#00FF00')
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });

            // تسجيل العملية
            await client.logger.info(`تم إضافة رتبة ${role.name} للقائمة البيضاء بواسطة ${interaction.user.tag}`);

        } else if (customId === 'whitelist_bot_modal') {
            const botInput = interaction.fields.getTextInputValue('bot_id');
            
            let botId = botInput.trim();
            
            // إزالة المنشن إذا كان موجوداً
            if (botId.startsWith('<@') && botId.endsWith('>')) {
                botId = botId.slice(2, -1);
                if (botId.startsWith('!')) {
                    botId = botId.slice(1);
                }
            }

            // التحقق من صحة معرف البوت
            if (!/^\d{17,19}$/.test(botId)) {
                return await interaction.reply({
                    content: '❌ معرف البوت غير صحيح.',
                    ephemeral: true
                });
            }

            try {
                // التحقق من وجود البوت
                const bot = await client.users.fetch(botId);
                
                if (!bot.bot) {
                    return await interaction.reply({
                        content: '❌ المعرف المدخل ليس لبوت.',
                        ephemeral: true
                    });
                }

                // إضافة البوت للقائمة البيضاء
                await client.database.addToWhitelist(guildId, 'bots', botId);

                const embed = new EmbedBuilder()
                    .setTitle('✅ تم إضافة البوت للقائمة البيضاء')
                    .setDescription(`تم إضافة البوت **${bot.tag}** (\`${botId}\`) للقائمة البيضاء بنجاح.`)
                    .setColor('#00FF00')
                    .setTimestamp();

                await interaction.reply({ embeds: [embed], ephemeral: true });

                // تسجيل العملية
                await client.logger.info(`تم إضافة البوت ${bot.tag} للقائمة البيضاء بواسطة ${interaction.user.tag}`);

            } catch (error) {
                await interaction.reply({
                    content: '❌ لم يتم العثور على البوت أو حدث خطأ أثناء الإضافة.',
                    ephemeral: true
                });
            }
        }
    },

    async handleLimitsModal(interaction, client, customId) {
        const system = customId.replace('limits_modal_', '');
        
        const maxLimit = parseInt(interaction.fields.getTextInputValue('max_limit'));
        const timeWindow = parseInt(interaction.fields.getTextInputValue('time_window')) * 1000; // تحويل إلى ميلي ثانية

        // التحقق من صحة القيم
        if (isNaN(maxLimit) || maxLimit < 1 || maxLimit > 100) {
            return await interaction.reply({
                content: '❌ الحد الأقصى يجب أن يكون رقماً بين 1 و 100.',
                ephemeral: true
            });
        }

        if (isNaN(timeWindow) || timeWindow < 1000 || timeWindow > 3600000) {
            return await interaction.reply({
                content: '❌ النافذة الزمنية يجب أن تكون بين 1 ثانية و 3600 ثانية (ساعة واحدة).',
                ephemeral: true
            });
        }

        // حفظ الإعدادات
        const limitKey = system === 'antiRoles' ? 'maxRoles' : 
                        system === 'antiChannels' ? 'maxChannels' : 
                        system === 'antiBots' ? 'maxBots' : 'maxLimit';

        await client.config.set(`protection.${system}.${limitKey}`, maxLimit);
        await client.config.set(`protection.${system}.timeWindow`, timeWindow);

        const systemNames = {
            'antiRoles': 'حماية الرتب',
            'antiChannels': 'حماية القنوات',
            'antiBots': 'حماية البوتات',
            'antiLinks': 'حماية الروابط',
            'antiAlt': 'حماية الحسابات الوهمية',
            'antiWebhook': 'حماية الويب هوك',
            'antiPrune': 'حماية البرون',
            'antiSpam': 'حماية السبام'
        };

        const embed = new EmbedBuilder()
            .setTitle('✅ تم تحديث إعدادات الحدود')
            .setDescription(`تم تحديث إعدادات **${systemNames[system]}** بنجاح.`)
            .addFields(
                { name: 'الحد الأقصى', value: maxLimit.toString(), inline: true },
                { name: 'النافذة الزمنية', value: `${timeWindow / 1000} ثانية`, inline: true }
            )
            .setColor('#00FF00')
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });

        // تسجيل العملية
        await client.logger.info(`تم تحديث إعدادات ${systemNames[system]} بواسطة ${interaction.user.tag}`);
    },

    async handleAdvancedModal(interaction, client, customId) {
        const system = customId.replace('advanced_modal_', '');
        
        // معالجة الإعدادات المتقدمة حسب نوع النظام
        if (system === 'antiLinks') {
            await this.handleAntiLinksAdvanced(interaction, client);
        } else if (system === 'antiAlt') {
            await this.handleAntiAltAdvanced(interaction, client);
        } else if (system === 'antiBots') {
            await this.handleAntiBotsAdvanced(interaction, client);
        }
    },

    async handleAntiLinksAdvanced(interaction, client) {
        const allowedDomains = interaction.fields.getTextInputValue('allowed_domains');
        const blockedDomains = interaction.fields.getTextInputValue('blocked_domains');
        const allowDiscordInvites = interaction.fields.getTextInputValue('allow_discord_invites').toLowerCase() === 'true';

        // تحويل النطاقات إلى مصفوفات
        const allowedDomainsArray = allowedDomains ? allowedDomains.split(',').map(d => d.trim()).filter(d => d) : [];
        const blockedDomainsArray = blockedDomains ? blockedDomains.split(',').map(d => d.trim()).filter(d => d) : [];

        // حفظ الإعدادات
        await client.config.set('protection.antiLinks.allowedDomains', allowedDomainsArray);
        await client.config.set('protection.antiLinks.blockedDomains', blockedDomainsArray);
        await client.config.set('protection.antiLinks.allowDiscordInvites', allowDiscordInvites);

        const embed = new EmbedBuilder()
            .setTitle('✅ تم تحديث إعدادات حماية الروابط المتقدمة')
            .addFields(
                { name: 'النطاقات المسموحة', value: allowedDomainsArray.length > 0 ? allowedDomainsArray.join(', ') : 'لا يوجد', inline: false },
                { name: 'النطاقات المحظورة', value: blockedDomainsArray.length > 0 ? blockedDomainsArray.join(', ') : 'لا يوجد', inline: false },
                { name: 'السماح بدعوات Discord', value: allowDiscordInvites ? 'نعم' : 'لا', inline: true }
            )
            .setColor('#00FF00')
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },

    async handleAntiAltAdvanced(interaction, client) {
        const minAccountAge = parseInt(interaction.fields.getTextInputValue('min_account_age'));
        const assignRoleId = interaction.fields.getTextInputValue('assign_role');
        const sendDMMessage = interaction.fields.getTextInputValue('send_dm').toLowerCase() === 'true';

        // التحقق من صحة عمر الحساب
        if (isNaN(minAccountAge) || minAccountAge < 1 || minAccountAge > 365) {
            return await interaction.reply({
                content: '❌ عمر الحساب الأدنى يجب أن يكون بين 1 و 365 يوم.',
                ephemeral: true
            });
        }

        // تحويل الأيام إلى ميلي ثانية
        const minAccountAgeMs = minAccountAge * 24 * 60 * 60 * 1000;

        // التحقق من الرتبة إذا تم تحديدها
        let assignRole = null;
        if (assignRoleId && assignRoleId.trim()) {
            let roleId = assignRoleId.trim();
            
            // إزالة المنشن إذا كان موجوداً
            if (roleId.startsWith('<@&') && roleId.endsWith('>')) {
                roleId = roleId.slice(3, -1);
            }

            assignRole = interaction.guild.roles.cache.get(roleId);
            if (!assignRole) {
                return await interaction.reply({
                    content: '❌ لم يتم العثور على الرتبة المحددة.',
                    ephemeral: true
                });
            }
        }

        // حفظ الإعدادات
        await client.config.set('protection.antiAlt.minAccountAge', minAccountAgeMs);
        await client.config.set('protection.antiAlt.assignRole', assignRole ? assignRole.id : null);
        await client.config.set('protection.antiAlt.sendDMMessage', sendDMMessage);

        const embed = new EmbedBuilder()
            .setTitle('✅ تم تحديث إعدادات حماية الحسابات الوهمية المتقدمة')
            .addFields(
                { name: 'الحد الأدنى لعمر الحساب', value: `${minAccountAge} يوم`, inline: true },
                { name: 'الرتبة المخصصة للحسابات الجديدة', value: assignRole ? assignRole.name : 'لا يوجد', inline: true },
                { name: 'إرسال رسالة خاصة', value: sendDMMessage ? 'نعم' : 'لا', inline: true }
            )
            .setColor('#00FF00')
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },

    async handleAntiBotsAdvanced(interaction, client) {
        const maxBotsInGuild = parseInt(interaction.fields.getTextInputValue('max_bots_guild'));
        const autoKickUnknownBots = interaction.fields.getTextInputValue('auto_kick_unknown').toLowerCase() === 'true';

        // التحقق من صحة القيم
        if (isNaN(maxBotsInGuild) || maxBotsInGuild < 1 || maxBotsInGuild > 100) {
            return await interaction.reply({
                content: '❌ الحد الأقصى للبوتات في السيرفر يجب أن يكون بين 1 و 100.',
                ephemeral: true
            });
        }

        // حفظ الإعدادات
        await client.config.set('protection.antiBots.maxBotsInGuild', maxBotsInGuild);
        await client.config.set('protection.antiBots.autoKickUnknownBots', autoKickUnknownBots);

        const embed = new EmbedBuilder()
            .setTitle('✅ تم تحديث إعدادات حماية البوتات المتقدمة')
            .addFields(
                { name: 'الحد الأقصى للبوتات في السيرفر', value: maxBotsInGuild.toString(), inline: true },
                { name: 'طرد البوتات غير المعروفة تلقائياً', value: autoKickUnknownBots ? 'نعم' : 'لا', inline: true }
            )
            .setColor('#00FF00')
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};

