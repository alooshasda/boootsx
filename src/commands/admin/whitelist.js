const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('whitelist')
        .setDescription('إدارة القائمة البيضاء للحماية')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('add-user')
                .setDescription('إضافة مستخدم للقائمة البيضاء')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('المستخدم المراد إضافته')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove-user')
                .setDescription('إزالة مستخدم من القائمة البيضاء')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('المستخدم المراد إزالته')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('add-role')
                .setDescription('إضافة رتبة للقائمة البيضاء')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('الرتبة المراد إضافتها')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove-role')
                .setDescription('إزالة رتبة من القائمة البيضاء')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('الرتبة المراد إزالتها')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('add-bot')
                .setDescription('إضافة بوت للقائمة البيضاء')
                .addUserOption(option =>
                    option.setName('bot')
                        .setDescription('البوت المراد إضافته')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove-bot')
                .setDescription('إزالة بوت من القائمة البيضاء')
                .addUserOption(option =>
                    option.setName('bot')
                        .setDescription('البوت المراد إزالته')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('عرض القائمة البيضاء')
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('نوع القائمة البيضاء')
                        .setRequired(true)
                        .addChoices(
                            { name: 'المستخدمين', value: 'users' },
                            { name: 'الرتب', value: 'roles' },
                            { name: 'البوتات', value: 'bots' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('clear')
                .setDescription('مسح القائمة البيضاء')
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('نوع القائمة البيضاء')
                        .setRequired(true)
                        .addChoices(
                            { name: 'المستخدمين', value: 'users' },
                            { name: 'الرتب', value: 'roles' },
                            { name: 'البوتات', value: 'bots' },
                            { name: 'الكل', value: 'all' }
                        ))),

    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        try {
            switch (subcommand) {
                case 'add-user':
                    await this.addUser(interaction, client, guildId);
                    break;
                case 'remove-user':
                    await this.removeUser(interaction, client, guildId);
                    break;
                case 'add-role':
                    await this.addRole(interaction, client, guildId);
                    break;
                case 'remove-role':
                    await this.removeRole(interaction, client, guildId);
                    break;
                case 'add-bot':
                    await this.addBot(interaction, client, guildId);
                    break;
                case 'remove-bot':
                    await this.removeBot(interaction, client, guildId);
                    break;
                case 'list':
                    await this.listWhitelist(interaction, client, guildId);
                    break;
                case 'clear':
                    await this.clearWhitelist(interaction, client, guildId);
                    break;
            }
        } catch (error) {
            console.error('خطأ في أمر القائمة البيضاء:', error);
            await interaction.reply({
                content: '❌ حدث خطأ أثناء تنفيذ الأمر.',
                ephemeral: true
            });
        }
    },

    async addUser(interaction, client, guildId) {
        const user = interaction.options.getUser('user');
        
        if (user.bot) {
            return await interaction.reply({
                content: '❌ لا يمكن إضافة البوتات كمستخدمين. استخدم أمر add-bot بدلاً من ذلك.',
                ephemeral: true
            });
        }

        const success = await client.database.addToWhitelist(guildId, 'users', user.id);
        
        if (success) {
            const embed = new EmbedBuilder()
                .setTitle('✅ تمت الإضافة بنجاح')
                .setDescription(`تم إضافة ${user} إلى القائمة البيضاء للمستخدمين`)
                .setColor('#00FF00')
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
            
            // تسجيل العملية
            await client.logger.info(`تم إضافة المستخدم ${user.tag} (${user.id}) إلى القائمة البيضاء بواسطة ${interaction.user.tag}`);
        } else {
            await interaction.reply({
                content: '❌ فشل في إضافة المستخدم إلى القائمة البيضاء.',
                ephemeral: true
            });
        }
    },

    async removeUser(interaction, client, guildId) {
        const user = interaction.options.getUser('user');
        
        const success = await client.database.removeFromWhitelist(guildId, 'users', user.id);
        
        if (success) {
            const embed = new EmbedBuilder()
                .setTitle('✅ تمت الإزالة بنجاح')
                .setDescription(`تم إزالة ${user} من القائمة البيضاء للمستخدمين`)
                .setColor('#FF9900')
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
            
            // تسجيل العملية
            await client.logger.info(`تم إزالة المستخدم ${user.tag} (${user.id}) من القائمة البيضاء بواسطة ${interaction.user.tag}`);
        } else {
            await interaction.reply({
                content: '❌ فشل في إزالة المستخدم من القائمة البيضاء.',
                ephemeral: true
            });
        }
    },

    async addRole(interaction, client, guildId) {
        const role = interaction.options.getRole('role');
        
        const success = await client.database.addToWhitelist(guildId, 'roles', role.id);
        
        if (success) {
            const embed = new EmbedBuilder()
                .setTitle('✅ تمت الإضافة بنجاح')
                .setDescription(`تم إضافة ${role} إلى القائمة البيضاء للرتب`)
                .setColor('#00FF00')
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
            
            // تسجيل العملية
            await client.logger.info(`تم إضافة الرتبة ${role.name} (${role.id}) إلى القائمة البيضاء بواسطة ${interaction.user.tag}`);
        } else {
            await interaction.reply({
                content: '❌ فشل في إضافة الرتبة إلى القائمة البيضاء.',
                ephemeral: true
            });
        }
    },

    async removeRole(interaction, client, guildId) {
        const role = interaction.options.getRole('role');
        
        const success = await client.database.removeFromWhitelist(guildId, 'roles', role.id);
        
        if (success) {
            const embed = new EmbedBuilder()
                .setTitle('✅ تمت الإزالة بنجاح')
                .setDescription(`تم إزالة ${role} من القائمة البيضاء للرتب`)
                .setColor('#FF9900')
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
            
            // تسجيل العملية
            await client.logger.info(`تم إزالة الرتبة ${role.name} (${role.id}) من القائمة البيضاء بواسطة ${interaction.user.tag}`);
        } else {
            await interaction.reply({
                content: '❌ فشل في إزالة الرتبة من القائمة البيضاء.',
                ephemeral: true
            });
        }
    },

    async addBot(interaction, client, guildId) {
        const bot = interaction.options.getUser('bot');
        
        if (!bot.bot) {
            return await interaction.reply({
                content: '❌ المستخدم المحدد ليس بوت. استخدم أمر add-user للمستخدمين العاديين.',
                ephemeral: true
            });
        }

        const success = await client.database.addToWhitelist(guildId, 'bots', bot.id);
        
        if (success) {
            const embed = new EmbedBuilder()
                .setTitle('✅ تمت الإضافة بنجاح')
                .setDescription(`تم إضافة البوت ${bot} إلى القائمة البيضاء للبوتات`)
                .setColor('#00FF00')
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
            
            // تسجيل العملية
            await client.logger.info(`تم إضافة البوت ${bot.tag} (${bot.id}) إلى القائمة البيضاء بواسطة ${interaction.user.tag}`);
        } else {
            await interaction.reply({
                content: '❌ فشل في إضافة البوت إلى القائمة البيضاء.',
                ephemeral: true
            });
        }
    },

    async removeBot(interaction, client, guildId) {
        const bot = interaction.options.getUser('bot');
        
        const success = await client.database.removeFromWhitelist(guildId, 'bots', bot.id);
        
        if (success) {
            const embed = new EmbedBuilder()
                .setTitle('✅ تمت الإزالة بنجاح')
                .setDescription(`تم إزالة البوت ${bot} من القائمة البيضاء للبوتات`)
                .setColor('#FF9900')
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
            
            // تسجيل العملية
            await client.logger.info(`تم إزالة البوت ${bot.tag} (${bot.id}) من القائمة البيضاء بواسطة ${interaction.user.tag}`);
        } else {
            await interaction.reply({
                content: '❌ فشل في إزالة البوت من القائمة البيضاء.',
                ephemeral: true
            });
        }
    },

    async listWhitelist(interaction, client, guildId) {
        const type = interaction.options.getString('type');
        const whitelist = await client.database.getWhitelist(guildId, type);
        
        if (whitelist.length === 0) {
            return await interaction.reply({
                content: `📝 القائمة البيضاء لـ ${this.getTypeDisplayName(type)} فارغة.`,
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setTitle(`📝 القائمة البيضاء - ${this.getTypeDisplayName(type)}`)
            .setColor('#0099FF')
            .setTimestamp();

        let description = '';
        for (let i = 0; i < Math.min(whitelist.length, 20); i++) {
            const id = whitelist[i];
            let displayName = id;
            
            try {
                if (type === 'users' || type === 'bots') {
                    const user = await client.users.fetch(id);
                    displayName = `${user.tag} (${id})`;
                } else if (type === 'roles') {
                    const role = interaction.guild.roles.cache.get(id);
                    displayName = role ? `${role.name} (${id})` : `رتبة محذوفة (${id})`;
                }
            } catch (error) {
                displayName = `غير معروف (${id})`;
            }
            
            description += `${i + 1}. ${displayName}\n`;
        }

        if (whitelist.length > 20) {
            description += `\n... و ${whitelist.length - 20} عنصر آخر`;
        }

        embed.setDescription(description);
        embed.setFooter({ text: `إجمالي العناصر: ${whitelist.length}` });

        await interaction.reply({ embeds: [embed] });
    },

    async clearWhitelist(interaction, client, guildId) {
        const type = interaction.options.getString('type');
        
        if (type === 'all') {
            await client.database.set(`whitelist_${guildId}_users`, []);
            await client.database.set(`whitelist_${guildId}_roles`, []);
            await client.database.set(`whitelist_${guildId}_bots`, []);
            
            const embed = new EmbedBuilder()
                .setTitle('🗑️ تم المسح بنجاح')
                .setDescription('تم مسح جميع القوائم البيضاء')
                .setColor('#FF0000')
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
            
            // تسجيل العملية
            await client.logger.warn(`تم مسح جميع القوائم البيضاء بواسطة ${interaction.user.tag}`);
        } else {
            await client.database.set(`whitelist_${guildId}_${type}`, []);
            
            const embed = new EmbedBuilder()
                .setTitle('🗑️ تم المسح بنجاح')
                .setDescription(`تم مسح القائمة البيضاء لـ ${this.getTypeDisplayName(type)}`)
                .setColor('#FF0000')
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
            
            // تسجيل العملية
            await client.logger.warn(`تم مسح القائمة البيضاء لـ ${this.getTypeDisplayName(type)} بواسطة ${interaction.user.tag}`);
        }
    },

    getTypeDisplayName(type) {
        const names = {
            'users': 'المستخدمين',
            'roles': 'الرتب',
            'bots': 'البوتات'
        };
        return names[type] || type;
    }
};

