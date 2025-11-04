
// مدير API
// يتعامل مع مفتاح API بشكل موحد

// الحصول على مفتاح API
function getApiKey() {
    // محاولة الحصول على مفتاح API من عدة مصادر
    let apiKey = localStorage.getItem('openai_api_key');

    if (!apiKey && window.API_KEY) {
        apiKey = window.API_KEY;
    }

    if (!apiKey && window.emotionAnalysisAPI_KEY) {
        apiKey = window.emotionAnalysisAPI_KEY;
    }

    if (!apiKey && window.faceEmotionAPI_KEY) {
        apiKey = window.faceEmotionAPI_KEY;
    }

    if (!apiKey && window.audioEmotionAPI_KEY) {
        apiKey = window.audioEmotionAPI_KEY;
    }

    return apiKey;
}

// تعيين مفتاح API في جميع المتغيرات
function setApiKey(apiKey) {
    // حفظ المفتاح في التخزين المحلي
    localStorage.setItem('openai_api_key', apiKey);

    // تعيين المفتاح في جميع المتغيرات
    window.API_KEY = apiKey;
    window.emotionAnalysisAPI_KEY = apiKey;
    window.faceEmotionAPI_KEY = apiKey;
    window.audioEmotionAPI_KEY = apiKey;
}

// التحقق من وجود مفتاح API
function checkApiKey() {
    const apiKey = getApiKey();

    if (!apiKey) {
        showNotification('الرجاء إدخال مفتاح OpenAI API أولاً', 'warning');
        return false;
    }

    return true;
}

// تهيئة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // التحقق من وجود مفتاح API
    const apiKey = getApiKey();

    if (apiKey) {
        console.log('API key found');
    } else {
        console.warn('API key not found');
    }
});
