const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

class BotTester {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.passed = [];
    }

    async runTests() {
        console.log(chalk.blue('🧪 بدء اختبار بنية البوت...\n'));

        await this.testFileStructure();
        await this.testConfigFiles();
        await this.testSourceFiles();
        await this.testDependencies();

        this.printResults();
    }

    async testFileStructure() {
        console.log(chalk.yellow('📁 اختبار بنية الملفات...'));

        const requiredFiles = [
            'package.json',
            'index.js',
            'config.json',
            '.env.example',
            'src/managers/ConfigManager.js',
            'src/managers/DatabaseManager.js',
            'src/managers/ProtectionManager.js',
            'src/managers/BackupManager.js',
            'src/utils/Logger.js',
            'src/commands/admin/whitelist.js',
            'src/commands/protection/protection.js',
            'src/commands/backup/backup.js',
            'src/commands/admin/panel.js',
            'src/events/interactions/buttonInteraction.js',
            'src/events/interactions/modalInteraction.js'
        ];

        const requiredDirs = [
            'src',
            'src/managers',
            'src/utils',
            'src/commands',
            'src/commands/admin',
            'src/commands/protection',
            'src/commands/backup',
            'src/events',
            'src/events/interactions',
            'src/protection',
            'src/protection/antiRoles',
            'src/protection/antiChannels',
            'src/protection/antiBots',
            'src/protection/antiLinks',
            'src/protection/antiAlt',
            'logs',
            'backups',
            'data'
        ];

        for (const dir of requiredDirs) {
            if (await fs.pathExists(dir)) {
                this.passed.push(`✅ المجلد موجود: ${dir}`);
            } else {
                this.errors.push(`❌ المجلد مفقود: ${dir}`);
            }
        }

        for (const file of requiredFiles) {
            if (await fs.pathExists(file)) {
                this.passed.push(`✅ الملف موجود: ${file}`);
            } else {
                this.errors.push(`❌ الملف مفقود: ${file}`);
            }
        }
    }

    async testConfigFiles() {
        console.log(chalk.yellow('⚙️ اختبار ملفات التكوين...'));

        try {
            // اختبار package.json
            const packageJson = await fs.readJson('package.json');
            if (packageJson.name && packageJson.version && packageJson.dependencies) {
                this.passed.push('✅ package.json صحيح');
            } else {
                this.errors.push('❌ package.json غير مكتمل');
            }

            // اختبار config.json
            const config = await fs.readJson('config.json');
            if (config.bot && config.protection && config.logging) {
                this.passed.push('✅ config.json صحيح');
            } else {
                this.errors.push('❌ config.json غير مكتمل');
            }

        } catch (error) {
            this.errors.push(`❌ خطأ في قراءة ملفات التكوين: ${error.message}`);
        }
    }

    async testSourceFiles() {
        console.log(chalk.yellow('📝 اختبار ملفات الكود المصدري...'));

        const sourceFiles = [
            'index.js',
            'src/managers/ConfigManager.js',
            'src/managers/DatabaseManager.js',
            'src/managers/ProtectionManager.js',
            'src/managers/BackupManager.js',
            'src/utils/Logger.js'
        ];

        for (const file of sourceFiles) {
            try {
                const content = await fs.readFile(file, 'utf8');
                if (content.length > 100) { // تحقق بسيط من وجود محتوى
                    this.passed.push(`✅ ملف الكود صحيح: ${file}`);
                } else {
                    this.warnings.push(`⚠️ ملف الكود قصير جداً: ${file}`);
                }
            } catch (error) {
                this.errors.push(`❌ خطأ في قراءة ملف الكود: ${file}`);
            }
        }
    }

    async testDependencies() {
        console.log(chalk.yellow('📦 اختبار التبعيات...'));

        try {
            const packageJson = await fs.readJson('package.json');
            const requiredDeps = [
                'discord.js',
                'fs-extra',
                'chalk',
                'node-cron'
            ];

            for (const dep of requiredDeps) {
                if (packageJson.dependencies && packageJson.dependencies[dep]) {
                    this.passed.push(`✅ التبعية موجودة: ${dep}`);
                } else {
                    this.errors.push(`❌ التبعية مفقودة: ${dep}`);
                }
            }

            // التحقق من وجود node_modules
            if (await fs.pathExists('node_modules')) {
                this.passed.push('✅ node_modules موجود');
            } else {
                this.warnings.push('⚠️ node_modules غير موجود - قم بتشغيل npm install');
            }

        } catch (error) {
            this.errors.push(`❌ خطأ في فحص التبعيات: ${error.message}`);
        }
    }

    printResults() {
        console.log('\n' + chalk.blue('📊 نتائج الاختبار:'));
        console.log('='.repeat(50));

        if (this.passed.length > 0) {
            console.log(chalk.green('\n✅ الاختبارات الناجحة:'));
            this.passed.forEach(msg => console.log(`  ${msg}`));
        }

        if (this.warnings.length > 0) {
            console.log(chalk.yellow('\n⚠️ التحذيرات:'));
            this.warnings.forEach(msg => console.log(`  ${msg}`));
        }

        if (this.errors.length > 0) {
            console.log(chalk.red('\n❌ الأخطاء:'));
            this.errors.forEach(msg => console.log(`  ${msg}`));
        }

        console.log('\n' + '='.repeat(50));
        console.log(chalk.blue(`📈 الملخص: ${this.passed.length} نجح | ${this.warnings.length} تحذير | ${this.errors.length} خطأ`));

        if (this.errors.length === 0) {
            console.log(chalk.green('\n🎉 جميع الاختبارات نجحت! البوت جاهز للاستخدام.'));
        } else {
            console.log(chalk.red('\n🚨 يوجد أخطاء تحتاج إلى إصلاح قبل تشغيل البوت.'));
        }
    }
}

// تشغيل الاختبارات
const tester = new BotTester();
tester.runTests().catch(console.error);

