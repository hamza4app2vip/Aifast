# مساعد ذكي متعدد الوسائط | AI Assistant

تطبيق ويب متقدم يستخدم أحدث تقنيات الذكاء الاصطناعي من OpenAI لتوفير خدمات متعددة في مكان واحد.

## المميزات

- محادثة ذكية مع GPT-4
- إنشاء صور من النصوص
- تحليل الصور
- تحويل الكلام إلى نص
- تحويل النص إلى كلام
- تحليل المشاعر

## التثبيت والتشغيل

### المتطلبات

- Node.js (إصدار 14 أو أحدث)
- مفتاح OpenAI API صالح

### خطوات التشغيل

1. **استنساخ المستودع**
   ```bash
   git clone https://github.com/username/ai-assistant.git
   cd ai-assistant
   ```

2. **إعداد مفتاح API**
   - انسخ ملف `.env.example` إلى `.env`
   - أضف مفتاح OpenAI API الخاص بك في ملف `.env`:
     ```
     OPENAI_API_KEY=sk-your-openai-api-key-here
     ```

3. **تشغيل المشروع**
   ```bash
   # باستخدام npm
   npm start
   
   # أو مباشرة باستخدام Node.js
   node serve.mjs
   
   # لاختيار منفذ مختلف
   npm run start:port 3000
   ```

4. **الوصول إلى التطبيق**
   - افتح المتصفح على العنوان: http://localhost:8080/ai-assistant.html
   - أو: http://localhost:8080/test-env.html

### النشر على GitHub Pages (آمن بدون كشف المفتاح)

لا تقم بوضع مفتاح OpenAI في أي ملف داخل المستودع العام. استخدم وكيل (Proxy) آمن بدلًا من ذلك:

1) أنشئ وكيلاً Serverless (مثال Cloudflare Workers)
- انسخ الملف: `serverless/openai-proxy-worker.js` إلى Worker جديد.
- عيّن متغير البيئة السري `OPENAI_API_KEY` داخل إعدادات Worker.
- انشر العامل واحصل على عنوان URL مثل: `https://your-worker.workers.dev/v1`.

2) وجّه الواجهة الأمامية إلى الوكيل
- يمكنك ضبط متغير عالمي في الصفحة قبل تحميل سكربتات التطبيق:
  ```html
  <script>
    window.OPENAI_PROXY_URL = 'https://your-worker.workers.dev/v1';
  </script>
  ```
  سيجعل هذا كل الطلبات تذهب عبر الوكيل بدلًا من `https://api.openai.com/v1`.

3) محليًا فقط: استخدم `.env`
- احتفظ بمفتاحك في ملف `.env.local` غير مُتتبَّع، أو `.env` محليًا فقط، ولا تقم برفعه.
- تمت إضافة `.gitignore` لمنع تتبع ملفات البيئة.

4) تدوير المفتاح وتنظيف السجل
- إذا تم كشف المفتاح سابقًا، قم بتدويره من لوحة OpenAI.
- نظِّف تاريخ Git لإزالة الأثر من الـ commits (BFG أو git filter-repo)، ثم ادفع القوة إذا لزم.

## هيكل المشروع

```
ai-assistant/
├── .env.example          # مثال على ملف متغيرات البيئة
├── .env                  # ملف متغيرات البيئة (لا يتم تضمينه في المستودع)
├── ai-assistant.html      # الصفحة الرئيسية
├── ai-assistant.js        # ملف JavaScript الرئيسي
├── ai-assistant.css       # ملف التنسيق
├── github-env-config.js   # إعداد متغيرات البيئة لـ GitHub Pages
├── serve.mjs             # خادم التطوير
└── ...                  # ملفات أخرى
```

## الأمان

- **مفتاح API**: يتم تخزين مفتاح API في التخزين المحلي للمتصفح فقط
- **عدم التضمين**: لا يتم تضمين مفتاح API في الكود المصدري للمشروع
- **GitHub Pages**: عند النشر، يتم طلب مفتاح API من المستخدم مباشرة

## الدعم

لأي استفسارات أو مشاكل، يرجى:
1. فتح issue في مستودع GitHub
2. التواصل عبر البريد الإلكتروني: zinab@gmail.com

## الترخيص

جميع الحقوق محفوظة © 2025
