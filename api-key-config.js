// إعدادات مفتاح API
// سيتم جلب مفتاح API من ملف .env
let API_KEY = '';

// الحصول على مفتاح API من متغيرات البيئة عند تحميل الصفحة
function getApiKeyFromEnv() {
    if (window.getEnvVar) {
        API_KEY = window.getEnvVar('OPENAI_API_KEY');
    }
}

// تعيين مفتاح API في التخزين المحلي
function setApiKeyToStorage() {
    // الحصول على مفتاح API من متغيرات البيئة إذا لم يكن موجوداً
    if (!API_KEY && window.getEnvVar) {
        API_KEY = window.getEnvVar('OPENAI_API_KEY');
    }
    
    localStorage.setItem('openai_api_key', API_KEY);
    window.API_KEY = API_KEY;
    window.emotionAnalysisAPI_KEY = API_KEY;
    window.faceEmotionAPI_KEY = API_KEY;
    window.audioEmotionAPI_KEY = API_KEY;
    
    // إرسال حدث مخصص للإشارة إلى أن مفتاح API قد تم تعيينه
    const event = new CustomEvent('apiKeySet', { detail: { apiKey: API_KEY } });
    document.dispatchEvent(event);
    
    console.log('API key has been set successfully');
}

// تنفيذ عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    getApiKeyFromEnv();
    setApiKeyToStorage();
});
