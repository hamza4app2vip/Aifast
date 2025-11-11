// مدير متغيرات البيئة
// يدير متغيرات البيئة بشكل آمن

// متغير لتخزين متغيرات البيئة
let envVars = {};

// دالة لتحميل متغيرات البيئة
async function loadEnv() {
    try {
        // محاولة قراءة ملف .env
        const response = await fetch('.env', { cache: "no-store" });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const envText = await response.text();

        // تقسيم النص إلى أسطر
        const lines = envText.split('\n');

        // معالجة كل سطر
        lines.forEach(line => {
            // تجاهل الأسطر الفارغة والتعليقات
            if (line.trim() && !line.trim().startsWith('#')) {
                // تقسيم السطر إلى مفتاح وقيمة
                const [key, ...valueParts] = line.split('=');
                if (key && valueParts.length > 0) {
                    // إزالة علامات الاقتباس إذا كانت موجودة
                    const value = valueParts.join('=').replace(/^["']|["']$/g, '');
                    envVars[key.trim()] = value;
                }
            }
        });

        console.log('Environment variables loaded successfully');

        // التحقق من وجود مفتاح API
        if (envVars['OPENAI_API_KEY']) {
            console.log('API key found in .env file');

            // تعيين مفتاح API في التخزين المحلي
            localStorage.setItem('openai_api_key', envVars['OPENAI_API_KEY']);

            // تعيين مفتاح API في المتغيرات العامة
            window.OPENAI_API_KEY = envVars['OPENAI_API_KEY'];
            window.emotionAnalysisAPI_KEY = envVars['OPENAI_API_KEY'];
            window.faceEmotionAPI_KEY = envVars['OPENAI_API_KEY'];
            window.audioEmotionAPI_KEY = envVars['OPENAI_API_KEY'];

            // إرسال حدث للإشارة إلى تعيين مفتاح API
            const event = new CustomEvent('apiKeySet', { detail: { apiKey: envVars['OPENAI_API_KEY'] } });
            document.dispatchEvent(event);
        } else {
            console.log('API key not found in .env file');
            
            // محاولة الحصول على مفتاح API من التخزين المحلي
            const localApiKey = localStorage.getItem('openai_api_key');
            if (localApiKey) {
                console.log('API key found in localStorage');
                
                // تعيين مفتاح API في المتغيرات العامة
                window.OPENAI_API_KEY = localApiKey;
                window.emotionAnalysisAPI_KEY = localApiKey;
                window.faceEmotionAPI_KEY = localApiKey;
                window.audioEmotionAPI_KEY = localApiKey;
                
                // إرسال حدث للإشارة إلى تعيين مفتاح API
                const event = new CustomEvent('apiKeySet', { detail: { apiKey: localApiKey } });
                document.dispatchEvent(event);
            } else {
                // لا يوجد مفتاح API
                window.OPENAI_API_KEY = null;
                window.emotionAnalysisAPI_KEY = null;
                window.faceEmotionAPI_KEY = null;
                window.audioEmotionAPI_KEY = null;
                
                console.log('API key not set');
            }
        }

        return envVars;
    } catch (error) {
        console.error('Error loading environment variables:', error);

        // محاولة الحصول على مفتاح API من التخزين المحلي
        const localApiKey = localStorage.getItem('openai_api_key');
        if (localApiKey) {
            console.log('API key found in localStorage despite error');
            
            // تعيين مفتاح API في المتغيرات العامة
            window.OPENAI_API_KEY = localApiKey;
            window.emotionAnalysisAPI_KEY = localApiKey;
            window.faceEmotionAPI_KEY = localApiKey;
            window.audioEmotionAPI_KEY = localApiKey;
            
            // إرسال حدث للإشارة إلى تعيين مفتاح API
            const event = new CustomEvent('apiKeySet', { detail: { apiKey: localApiKey } });
            document.dispatchEvent(event);
        } else {
            // لا يوجد مفتاح API
            window.OPENAI_API_KEY = null;
            window.emotionAnalysisAPI_KEY = null;
            window.faceEmotionAPI_KEY = null;
            window.audioEmotionAPI_KEY = null;
            
            console.log('API key not set due to error');
        }

        return {};
    }
}

// دالة للحصول على قيمة متغير بيئة
function getEnvVar(key) {
    return envVars[key] || '';
}

// تصدير الدوال للاستخدام في الملفات الأخرى
window.loadEnv = loadEnv;
window.getEnvVar = getEnvVar;

// تحميل متغيرات البيئة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', async function() {
    await loadEnv();
});