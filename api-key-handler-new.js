// معالج مفتاح API
// يتعامل مع مفتاح API للتأكد من وجوده

// التحقق من وجود مفتاح API
function checkApiKey() {
    let apiKey = localStorage.getItem('openai_api_key');

    // إذا لم يكن هناك مفتاح، قم بتعيين المفتاح من متغيرات البيئة
    if (!apiKey) {
        let envApiKey = '';
        if (window.getEnvVar) {
            envApiKey = window.getEnvVar('OPENAI_API_KEY');
        }
        
        if (envApiKey) {
            localStorage.setItem('openai_api_key', envApiKey);
            apiKey = envApiKey;

            // إرسال حدث للإشارة إلى تعيين مفتاح API
            const event = new CustomEvent('apiKeySet', { detail: { apiKey: envApiKey } });
            document.dispatchEvent(event);

            console.log('API key from .env has been set automatically in api-key-handler');
        }
    }

    // التحقق من صيغة مفتاح API
    if (!apiKey.startsWith('sk-') || apiKey.length < 20) {
        console.log('Invalid API key format detected, setting the correct one from .env');
        let correctApiKey = '';
        if (window.getEnvVar) {
            correctApiKey = window.getEnvVar('OPENAI_API_KEY');
        }
        
        if (correctApiKey) {
            localStorage.setItem('openai_api_key', correctApiKey);
            window.API_KEY = correctApiKey;

            // إرسال حدث للإشارة إلى تعيين مفتاح API
            const event = new CustomEvent('apiKeySet', { detail: { apiKey: correctApiKey } });
            document.dispatchEvent(event);

            return true;
        }
    }

    return true;
}

// تعريف متغير API_KEY للاستخدام في الملفات الأخرى
window.API_KEY = localStorage.getItem('openai_api_key');

// تهيئة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // التحقق من وجود مفتاح API في التخزين المحلي
    const apiKey = localStorage.getItem('openai_api_key');

    if (apiKey) {
        console.log('API key found in localStorage');
    } else {
        console.warn('API key not found in localStorage');
    }
});