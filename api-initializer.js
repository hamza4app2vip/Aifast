// مُهيئ مفتاح API
// يضمن تهيئة مفتاح API بشكل صحيح عند تحميل الصفحة

// التحقق من وجود مفتاح API في التخزين المحلي
function initializeApiKey() {
    let apiKey = localStorage.getItem('openai_api_key');

    // إذا لم يكن هناك مفتاح، قم بتعيين المفتاح من متغيرات البيئة
    if (!apiKey) {
        if (window.getEnvVar) {
            apiKey = window.getEnvVar('OPENAI_API_KEY');
            if (apiKey) {
                localStorage.setItem('openai_api_key', apiKey);
            }
        }
    }

    // تعيين المفتاح في جميع المتغيرات
    window.API_KEY = apiKey;
    window.emotionAnalysisAPI_KEY = apiKey;
    window.faceEmotionAPI_KEY = apiKey;
    window.audioEmotionAPI_KEY = apiKey;

    // إرسال حدث للإشارة إلى تعيين مفتاح API
    const event = new CustomEvent('apiKeySet', { detail: { apiKey: apiKey } });
    document.dispatchEvent(event);

    console.log('API key initialized successfully');
}

// تنفيذ عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    initializeApiKey();
});
