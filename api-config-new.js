// إعدادات مفتاح API
// يتم قراءة مفتاح API من ملف .env

// دالة للحصول على مفتاح API
function getApiKey() {
    // التحقق من وجود مفتاح API في التخزين المحلي
    let apiKey = localStorage.getItem('openai_api_key');

    // إذا لم يكن هناك مفتاح في التخزين المحلي، حاول الحصول عليه من متغيرات البيئة
    if (!apiKey && window.getEnvVar) {
        apiKey = window.getEnvVar('OPENAI_API_KEY');
        if (apiKey) {
            localStorage.setItem('openai_api_key', apiKey);
        }
    }

    return apiKey;
}

// تعيين مفتاح API في المتغيرات العامة
function setApiKeyVariables() {
    const apiKey = getApiKey();

    // تعيين المفتاح في المتغيرات العامة
    window.API_KEY = apiKey;
    window.emotionAnalysisAPI_KEY = apiKey;
    window.faceEmotionAPI_KEY = apiKey;
    window.audioEmotionAPI_KEY = apiKey;

    // إرسال حدث للإشارة إلى تعيين مفتاح API
    const event = new CustomEvent('apiKeySet', { detail: { apiKey: apiKey } });
    document.dispatchEvent(event);

    console.log('API key set successfully');

    return apiKey;
}

// التحقق من مفتاح API عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    setApiKeyVariables();
});

// تصدير الدوال للاستخدام في الملفات الأخرى
window.getApiKey = getApiKey;
window.setApiKeyVariables = setApiKeyVariables;