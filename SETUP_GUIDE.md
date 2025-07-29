# 🚀 دليل الإعداد المفصل

هذا الدليل سيساعدك في إعداد بوت الحماية المتقدم خطوة بخطوة.

## 📋 المتطلبات الأساسية

### 🖥️ متطلبات النظام
- **نظام التشغيل**: Windows 10/11, macOS 10.15+, أو Linux (Ubuntu 18.04+)
- **Node.js**: الإصدار 16.9.0 أو أحدث
- **npm**: يأتي مع Node.js
- **ذاكرة RAM**: 512 MB كحد أدنى (1 GB مُوصى به)
- **مساحة التخزين**: 100 MB كحد أدنى

### 🤖 متطلبات Discord
- **حساب Discord**: حساب مطور Discord
- **تطبيق Discord**: تطبيق مُنشأ في Discord Developer Portal
- **بوت Discord**: بوت مُضاف للتطبيق
- **صلاحيات**: صلاحيات إدارية في السيرفر المراد حمايته

## 🔧 إعداد بوت Discord

### الخطوة 1: إنشاء التطبيق
1. اذهب إلى [Discord Developer Portal](https://discord.com/developers/applications)
2. انقر على "New Application"
3. أدخل اسم التطبيق (مثل: "Protection Bot")
4. انقر على "Create"

### الخطوة 2: إنشاء البوت
1. في صفحة التطبيق، انقر على تبويب "Bot"
2. انقر على "Add Bot"
3. أكد بالنقر على "Yes, do it!"
4. اختر اسم مناسب للبوت
5. احفظ **Token** البوت (ستحتاجه لاحقاً)

### الخطوة 3: تكوين صلاحيات البوت
في تبويب "Bot"، فعّل الصلاحيات التالية:
- ✅ **Presence Intent**
- ✅ **Server Members Intent**
- ✅ **Message Content Intent**

### الخطوة 4: إنشاء رابط الدعوة
1. اذهب إلى تبويب "OAuth2" > "URL Generator"
2. في "Scopes"، اختر:
   - ✅ **bot**
   - ✅ **applications.commands**
3. في "Bot Permissions"، اختر:
   - ✅ **Administrator** (أو الصلاحيات المطلوبة أدناه)

#### الصلاحيات المطلوبة (إذا لم تختر Administrator):
- **General Permissions**:
  - View Channels
  - Manage Channels
  - Manage Roles
  - Manage Server
  - View Audit Log
  - Read Messages
  - Moderate Members

- **Text Permissions**:
  - Send Messages
  - Manage Messages
  - Embed Links
  - Read Message History
  - Use Slash Commands

- **Voice Permissions**:
  - Connect
  - Speak
  - Mute Members
  - Deafen Members
  - Move Members

4. انسخ الرابط المُنشأ واستخدمه لدعوة البوت لسيرفرك

## 💻 تثبيت البوت

### الخطوة 1: تحميل الملفات
```bash
# استنساخ المشروع (إذا كان متاحاً على Git)
git clone <repository-url>
cd protection_bot_v2

# أو تحميل الملفات وفك الضغط
# ثم الانتقال لمجلد المشروع
```

### الخطوة 2: تثبيت Node.js
#### Windows:
1. اذهب إلى [nodejs.org](https://nodejs.org)
2. حمّل النسخة LTS
3. شغّل الملف المُحمّل واتبع التعليمات

#### macOS:
```bash
# باستخدام Homebrew
brew install node

# أو تحميل من الموقع الرسمي
```

#### Linux (Ubuntu/Debian):
```bash
# تحديث قائمة الحزم
sudo apt update

# تثبيت Node.js و npm
sudo apt install nodejs npm

# التحقق من الإصدار
node --version
npm --version
```

### الخطوة 3: تثبيت التبعيات
```bash
# الانتقال لمجلد المشروع
cd protection_bot_v2

# تثبيت التبعيات
npm install
```

## ⚙️ تكوين البوت

### الخطوة 1: إعداد ملف البيئة
```bash
# نسخ ملف البيئة النموذجي
cp .env.example .env
```

### الخطوة 2: تعديل ملف .env
افتح ملف `.env` في محرر النصوص وأدخل المعلومات التالية:

```env
# Discord Bot Configuration
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_client_id_here

# Database Configuration (اختياري)
# DATABASE_URL=mongodb://localhost:27017/protection_bot

# Environment
NODE_ENV=production

# Logging
LOG_LEVEL=info

# Bot Configuration
PREFIX=!
DEVELOPERS=your_user_id_here,another_user_id

# Features
ENABLE_AUTO_BACKUP=true
BACKUP_INTERVAL=24

# Security
MAX_WARNINGS=3
DEFAULT_MUTE_DURATION=600000
```

#### شرح المتغيرات:
- **DISCORD_TOKEN**: توكن البوت من Discord Developer Portal
- **CLIENT_ID**: معرف التطبيق من Discord Developer Portal
- **DEVELOPERS**: معرفات المطورين (مفصولة بفواصل)
- **NODE_ENV**: بيئة التشغيل (development/production)
- **LOG_LEVEL**: مستوى التسجيل (debug/info/warn/error)

### الخطوة 3: تكوين ملف config.json
يمكنك تعديل الإعدادات الافتراضية في `config.json`:

```json
{
  "bot": {
    "name": "Protection Bot",
    "version": "2.0.0",
    "description": "بوت حماية متقدم للسيرفرات"
  },
  "protection": {
    "antiRoles": {
      "enabled": true,
      "action": "ban",
      "maxRoles": 5,
      "timeWindow": 60000
    },
    "antiChannels": {
      "enabled": true,
      "action": "ban",
      "maxChannels": 5,
      "timeWindow": 60000
    }
    // ... باقي الإعدادات
  }
}
```

## 🚀 تشغيل البوت

### الخطوة 1: اختبار البنية
```bash
# تشغيل اختبار البنية
node test.js
```

يجب أن ترى رسالة: "🎉 جميع الاختبارات نجحت! البوت جاهز للاستخدام."

### الخطوة 2: تشغيل البوت
```bash
# تشغيل البوت
npm start

# أو للتطوير مع إعادة التشغيل التلقائي
npm run dev
```

### الخطوة 3: التحقق من التشغيل
إذا تم التشغيل بنجاح، ستظهر رسائل مشابهة لهذه:
```
✅ تم تهيئة مدير التكوين بنجاح
✅ تم تهيئة مدير قاعدة البيانات بنجاح
✅ تم تهيئة نظام التسجيل بنجاح
✅ تم تهيئة مدير الحماية بنجاح
✅ تم تهيئة مدير النسخ الاحتياطي بنجاح
🤖 تم تسجيل دخول البوت: BotName#1234
🚀 البوت جاهز ويعمل في 1 سيرفر
```

## 🎛️ الإعداد الأولي

### الخطوة 1: تشغيل لوحة التحكم
في سيرفر Discord، استخدم الأمر:
```
/panel
```

### الخطوة 2: تكوين قناة السجلات
1. أنشئ قناة للسجلات (مثل: #protection-logs)
2. استخدم الأمر:
```
/settings logging channel #protection-logs
```

### الخطوة 3: تفعيل أنظمة الحماية
استخدم لوحة التحكم أو الأوامر لتفعيل الحماية:
```
/protection toggle antiRoles
/protection toggle antiChannels
/protection toggle antiBots
```

### الخطوة 4: إعداد القائمة البيضاء
أضف المستخدمين والرتب الموثوقة:
```
/whitelist add user @username
/whitelist add role @role
```

### الخطوة 5: إنشاء نسخة احتياطية أولية
```
/backup create
```

## 🔧 الإعدادات المتقدمة

### تكوين قاعدة البيانات (MongoDB)
إذا كنت تريد استخدام MongoDB بدلاً من JSON:

1. **تثبيت MongoDB**:
```bash
# Ubuntu/Debian
sudo apt install mongodb

# macOS
brew install mongodb-community

# Windows: حمّل من mongodb.com
```

2. **تشغيل MongoDB**:
```bash
# Linux/macOS
sudo systemctl start mongod

# أو
mongod
```

3. **تحديث ملف .env**:
```env
DATABASE_URL=mongodb://localhost:27017/protection_bot
```

### تكوين النسخ الاحتياطي التلقائي
```bash
# تفعيل النسخ الاحتياطي التلقائي
/backup auto true
```

### تكوين التنبيهات
يمكنك إعداد تنبيهات مخصصة لأحداث معينة من خلال تعديل إعدادات كل نظام حماية.

## 🛠️ استكشاف الأخطاء وإصلاحها

### مشاكل شائعة وحلولها

#### البوت لا يستجيب للأوامر
**الأسباب المحتملة**:
- توكن البوت غير صحيح
- البوت لا يملك الصلاحيات المطلوبة
- الأوامر غير مُسجلة

**الحلول**:
1. تحقق من صحة التوكن في ملف `.env`
2. تأكد من صلاحيات البوت في السيرفر
3. أعد تشغيل البوت لتسجيل الأوامر

#### خطأ في الاتصال بقاعدة البيانات
**الحل**:
```bash
# تحقق من تشغيل MongoDB (إذا كنت تستخدمه)
sudo systemctl status mongod

# أو استخدم JSON files (الافتراضي)
# احذف DATABASE_URL من ملف .env
```

#### البوت يتوقف عن العمل
**الحل**:
```bash
# تحقق من السجلات
tail -f logs/$(date +%Y-%m-%d).log

# أعد تشغيل البوت
npm start
```

#### مشاكل الصلاحيات
**الحل**:
1. تأكد من أن رتبة البوت أعلى من الرتب التي يحاول إدارتها
2. تحقق من صلاحيات البوت في إعدادات السيرفر
3. أعد دعوة البوت بصلاحيات Administrator

### سجلات التشخيص
```bash
# عرض السجلات المباشرة
tail -f logs/$(date +%Y-%m-%d).log

# البحث في السجلات
grep "ERROR" logs/*.log

# عرض إحصائيات السجلات
/logs stats
```

## 📊 المراقبة والصيانة

### مراقبة الأداء
- استخدم `/panel` لمراقبة حالة البوت
- تحقق من الإحصائيات بانتظام
- راقب استخدام الذاكرة والمعالج

### الصيانة الدورية
- **يومياً**: تحقق من السجلات والإحصائيات
- **أسبوعياً**: إنشاء نسخة احتياطية يدوية
- **شهرياً**: تحديث التبعيات وتنظيف السجلات القديمة

### التحديثات
```bash
# تحديث التبعيات
npm update

# تحديث البوت (عند توفر إصدار جديد)
git pull origin main
npm install
```

## 🔒 أفضل الممارسات الأمنية

### حماية التوكن
- لا تشارك توكن البوت مع أحد
- استخدم متغيرات البيئة لحفظ التوكن
- أعد إنشاء التوكن إذا تم تسريبه

### إعدادات الصلاحيات
- امنح البوت أقل الصلاحيات المطلوبة
- راجع صلاحيات البوت بانتظام
- استخدم القوائم البيضاء بحكمة

### النسخ الاحتياطية
- أنشئ نسخ احتياطية منتظمة
- احفظ النسخ في مكان آمن
- اختبر استعادة النسخ الاحتياطية

## 📞 الحصول على المساعدة

### الموارد المتاحة
- **README.md**: دليل الاستخدام الأساسي
- **CHANGELOG.md**: سجل التغييرات والتحديثات
- **GitHub Issues**: للإبلاغ عن المشاكل
- **Discord Server**: للدعم المباشر

### معلومات الدعم
- **الإصدار**: 2.0.0
- **Node.js**: 16.9.0+
- **Discord.js**: 14.x
- **المنصات المدعومة**: Windows, macOS, Linux

---

**🎉 تهانينا! بوت الحماية المتقدم جاهز للعمل**

إذا واجهت أي مشاكل، لا تتردد في طلب المساعدة من فريق الدعم.

**© 2024 متجر الحماية - جميع الحقوق محفوظة**

