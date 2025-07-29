const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('backup')
        .setDescription('إدارة النسخ الاحتياطية للسيرفر')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('إنشاء نسخة احتياطية كاملة للسيرفر'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('عرض قائمة النسخ الاحتياطية المتاحة'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('restore')
                .setDescription('استعادة نسخة احتياطية')
                .addStringOption(option =>
                    option.setName('backup')
                        .setDescription('اسم ملف النسخة الاحتياطية')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('حذف نسخة احتياطية')
                .addStringOption(option =>
                    option.setName('backup')
                        .setDescription('اسم ملف النسخة الاحتياطية')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('auto')
                .setDescription('تفعيل أو تعطيل النسخ الاحتياطي التلقائي')
                .addBooleanOption(option =>
                    option.setName('enabled')
                        .setDescription('تفعيل النسخ الاحتياطي التلقائي')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('عرض معلومات نسخة احتياطية')
                .addStringOption(option =>
                    option.setName('backup')
                        .setDescription('اسم ملف النسخة الاحتياطية')
                        .setRequired(true))),

    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();
        const guild = interaction.guild;

        try {
            switch (subcommand) {
                case 'create':
                    await this.createBackup(interaction, client, guild);
                    break;
                case 'list':
                    await this.listBackups(interaction, client, guild);
                    break;
                case 'restore':
                    await this.restoreBackup(interaction, client, guild);
                    break;
                case 'delete':
                    await this.deleteBackup(interaction, client, guild);
                    break;
                case 'auto':
                    await this.toggleAutoBackup(interaction, client);
                    break;
                case 'info':
                    await this.showBackupInfo(interaction, client, guild);
                    break;
            }
        } catch (error) {
            console.error('خطأ في أمر النسخ الاحتياطي:', error);
            await interaction.reply({
                content: '❌ حدث خطأ أثناء تنفيذ الأمر.',
                ephemeral: true
            });
        }
    },

    async createBackup(interaction, client, guild) {
        await interaction.deferReply();

        try {
            const embed = new EmbedBuilder()
                .setTitle('🔄 جاري إنشاء النسخة الاحتياطية...')
                .setDescription('يرجى الانتظار، قد تستغرق هذه العملية بضع دقائق.')
                .setColor('#FFA500')
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

            const result = await client.backup.createFullBackup(guild);

            if (result.success) {
                const successEmbed = new EmbedBuilder()
                    .setTitle('✅ تم إنشاء النسخة الاحتياطية بنجاح')
                    .setDescription(`تم حفظ النسخة الاحتياطية في الملف: \`${result.fileName}\``)
                    .addFields(
                        { name: '📁 حجم الملف', value: result.size, inline: true },
                        { name: '📊 عدد العناصر', value: this.formatItemCount(result.itemCount), inline: true },
                        { name: '⏰ وقت الإنشاء', value: new Date().toLocaleString('ar-SA'), inline: true }
                    )
                    .setColor('#00FF00')
                    .setTimestamp();

                await interaction.editReply({ embeds: [successEmbed] });

                // إرسال تسجيل
                const logEmbed = client.logger.createBackupEmbed('إنشاء نسخة احتياطية', true, {
                    itemCount: Object.values(result.itemCount).reduce((a, b) => a + b, 0),
                    size: result.size
                });
                await client.logger.logToChannel(client, guild.id, logEmbed);

            } else {
                const errorEmbed = new EmbedBuilder()
                    .setTitle('❌ فشل في إنشاء النسخة الاحتياطية')
                    .setDescription(`خطأ: ${result.error}`)
                    .setColor('#FF0000')
                    .setTimestamp();

                await interaction.editReply({ embeds: [errorEmbed] });
            }

        } catch (error) {
            console.error('خطأ في إنشاء النسخة الاحتياطية:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ خطأ في إنشاء النسخة الاحتياطية')
                .setDescription('حدث خطأ غير متوقع أثناء إنشاء النسخة الاحتياطية.')
                .setColor('#FF0000')
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },

    async listBackups(interaction, client, guild) {
        try {
            const backups = await client.backup.getBackupList(guild.id);

            if (backups.length === 0) {
                const embed = new EmbedBuilder()
                    .setTitle('📝 قائمة النسخ الاحتياطية')
                    .setDescription('لا توجد نسخ احتياطية متاحة لهذا السيرفر.')
                    .setColor('#FFA500')
                    .setTimestamp();

                return await interaction.reply({ embeds: [embed] });
            }

            const embed = new EmbedBuilder()
                .setTitle('📝 قائمة النسخ الاحتياطية')
                .setColor('#0099FF')
                .setTimestamp();

            let description = '';
            for (let i = 0; i < Math.min(backups.length, 10); i++) {
                const backup = backups[i];
                const createdAt = new Date(backup.createdAt).toLocaleString('ar-SA');
                const itemCount = Object.values(backup.itemCount).reduce((a, b) => a + b, 0);
                
                description += `**${i + 1}.** \`${backup.fileName}\`\n`;
                description += `📅 تاريخ الإنشاء: ${createdAt}\n`;
                description += `📊 العناصر: ${itemCount} | 📁 الحجم: ${backup.size}\n\n`;
            }

            if (backups.length > 10) {
                description += `... و ${backups.length - 10} نسخة أخرى`;
            }

            embed.setDescription(description);
            embed.setFooter({ text: `إجمالي النسخ: ${backups.length}` });

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('backup_refresh')
                        .setLabel('تحديث القائمة')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('backup_cleanup')
                        .setLabel('تنظيف النسخ القديمة')
                        .setStyle(ButtonStyle.Danger)
                );

            await interaction.reply({ embeds: [embed], components: [row] });

        } catch (error) {
            console.error('خطأ في عرض قائمة النسخ الاحتياطية:', error);
            await interaction.reply({
                content: '❌ حدث خطأ أثناء جلب قائمة النسخ الاحتياطية.',
                ephemeral: true
            });
        }
    },

    async restoreBackup(interaction, client, guild) {
        const backupFileName = interaction.options.getString('backup');

        // التحقق من صحة اسم الملف
        if (!backupFileName.startsWith(`backup_${guild.id}_`) || !backupFileName.endsWith('.json')) {
            return await interaction.reply({
                content: '❌ اسم ملف النسخة الاحتياطية غير صحيح.',
                ephemeral: true
            });
        }

        // طلب تأكيد من المستخدم
        const confirmEmbed = new EmbedBuilder()
            .setTitle('⚠️ تأكيد استعادة النسخة الاحتياطية')
            .setDescription(`هل أنت متأكد من استعادة النسخة الاحتياطية \`${backupFileName}\`؟\n\n**تحذير:** هذه العملية ستقوم بـ:\n• إنشاء أو تعديل الرتب والقنوات\n• استعادة رتب الأعضاء\n• استعادة إعدادات البوت\n\nقد تستغرق هذه العملية عدة دقائق.`)
            .setColor('#FF9900')
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`restore_confirm_${backupFileName}`)
                    .setLabel('تأكيد الاستعادة')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('restore_cancel')
                    .setLabel('إلغاء')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.reply({ embeds: [confirmEmbed], components: [row], ephemeral: true });
    },

    async deleteBackup(interaction, client, guild) {
        const backupFileName = interaction.options.getString('backup');

        // التحقق من صحة اسم الملف
        if (!backupFileName.startsWith(`backup_${guild.id}_`) || !backupFileName.endsWith('.json')) {
            return await interaction.reply({
                content: '❌ اسم ملف النسخة الاحتياطية غير صحيح.',
                ephemeral: true
            });
        }

        const success = await client.backup.deleteBackup(backupFileName);

        if (success) {
            const embed = new EmbedBuilder()
                .setTitle('🗑️ تم حذف النسخة الاحتياطية')
                .setDescription(`تم حذف النسخة الاحتياطية \`${backupFileName}\` بنجاح.`)
                .setColor('#FF0000')
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

            // تسجيل العملية
            await client.logger.warn(`تم حذف النسخة الاحتياطية ${backupFileName} بواسطة ${interaction.user.tag}`);

        } else {
            await interaction.reply({
                content: '❌ فشل في حذف النسخة الاحتياطية. تأكد من صحة اسم الملف.',
                ephemeral: true
            });
        }
    },

    async toggleAutoBackup(interaction, client) {
        const enabled = interaction.options.getBoolean('enabled');
        
        await client.config.set('backup.autoBackup', enabled);

        const status = enabled ? 'مفعل' : 'معطل';
        const emoji = enabled ? '✅' : '❌';

        const embed = new EmbedBuilder()
            .setTitle(`${emoji} النسخ الاحتياطي التلقائي`)
            .setDescription(`تم ${status} النسخ الاحتياطي التلقائي.`)
            .setColor(enabled ? '#00FF00' : '#FF0000')
            .setTimestamp();

        if (enabled) {
            embed.addFields({ 
                name: 'ℹ️ معلومات', 
                value: 'سيتم إنشاء نسخة احتياطية تلقائياً كل 24 ساعة في الساعة 2:00 صباحاً.', 
                inline: false 
            });
        }

        await interaction.reply({ embeds: [embed] });

        // تسجيل العملية
        await client.logger.info(`تم ${status} النسخ الاحتياطي التلقائي بواسطة ${interaction.user.tag}`);
    },

    async showBackupInfo(interaction, client, guild) {
        const backupFileName = interaction.options.getString('backup');

        try {
            const backups = await client.backup.getBackupList(guild.id);
            const backup = backups.find(b => b.fileName === backupFileName);

            if (!backup) {
                return await interaction.reply({
                    content: '❌ النسخة الاحتياطية المحددة غير موجودة.',
                    ephemeral: true
                });
            }

            const embed = new EmbedBuilder()
                .setTitle('📋 معلومات النسخة الاحتياطية')
                .setDescription(`**اسم الملف:** \`${backup.fileName}\``)
                .addFields(
                    { name: '📅 تاريخ الإنشاء', value: new Date(backup.createdAt).toLocaleString('ar-SA'), inline: true },
                    { name: '📁 حجم الملف', value: backup.size, inline: true },
                    { name: '🏷️ الرتب', value: backup.itemCount.roles.toString(), inline: true },
                    { name: '📺 القنوات', value: backup.itemCount.channels.toString(), inline: true },
                    { name: '👥 الأعضاء', value: backup.itemCount.members.toString(), inline: true },
                    { name: '😀 الإيموجيات', value: backup.itemCount.emojis.toString(), inline: true },
                    { name: '🚫 المحظورين', value: backup.itemCount.bans.toString(), inline: true },
                    { name: '📊 إجمالي العناصر', value: Object.values(backup.itemCount).reduce((a, b) => a + b, 0).toString(), inline: true }
                )
                .setColor('#0099FF')
                .setTimestamp();

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`restore_${backupFileName}`)
                        .setLabel('استعادة هذه النسخة')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId(`delete_${backupFileName}`)
                        .setLabel('حذف هذه النسخة')
                        .setStyle(ButtonStyle.Danger)
                );

            await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });

        } catch (error) {
            console.error('خطأ في عرض معلومات النسخة الاحتياطية:', error);
            await interaction.reply({
                content: '❌ حدث خطأ أثناء جلب معلومات النسخة الاحتياطية.',
                ephemeral: true
            });
        }
    },

    formatItemCount(itemCount) {
        return `الرتب: ${itemCount.roles} | القنوات: ${itemCount.channels} | الأعضاء: ${itemCount.members}`;
    }
};

