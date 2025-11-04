
// معالج مفتاح API
// يتعامل مع مفتاح API للتأكد من وجوده

// التحقق من وجود مفتاح API
function checkApiKey() {
    const apiKey = localStorage.getItem('openai_api_key');

    if (!apiKey) {
        showNotification('الرجاء إدخال مفتاح OpenAI API أولاً', 'warning');
        return false;
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
