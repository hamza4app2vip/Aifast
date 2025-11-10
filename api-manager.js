
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
    
    // الحصول على مفتاح API من متغيرات البيئة
    if (!apiKey && window.getEnvVar) {
        apiKey = window.getEnvVar('OPENAI_API_KEY');
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
    
    // إرسال حدث للإشارة إلى تعيين مفتاح API
    const event = new CustomEvent('apiKeySet', { detail: { apiKey: apiKey } });
    document.dispatchEvent(event);
}

// التحقق من وجود مفتاح API
function checkApiKey() {
    let apiKey = getApiKey();

    // إذا لم يكن هناك مفتاح، قم بتعيين المفتاح من متغيرات البيئة
    if (!apiKey) {
        // الحصول على مفتاح API من متغيرات البيئة
        if (window.getEnvVar) {
            const envApiKey = window.getEnvVar('OPENAI_API_KEY');
            if (envApiKey) {
                setApiKey(envApiKey);
                apiKey = envApiKey;
                console.log('API key from .env has been set automatically');
            } else {
                // عرض رسالة للمستخدم إذا لم يتم العثور على مفتاح API
                if (typeof showNotification === 'function') {
                    showNotification('لم يتم العثور على مفتاح API في ملف .env', 'error');
                }
            }
        }
    }
    
    // التحقق من صيغة مفتاح API
    if (!checkApiKeyFormat(apiKey)) {
        console.warn('Invalid API key format detected');
        // عرض رسالة للمستخدم
        if (typeof showNotification === 'function') {
            showNotification('صيغة مفتاح API غير صالحة', 'error');
        }
        return false;
    }
    
    return true;
}

// التحقق من صيغة مفتاح API
function checkApiKeyFormat(apiKey) {
    if (!apiKey || !apiKey.startsWith('sk-') || apiKey.length < 20) {
        showNotification('مفتاح API غير صالح. يرجى التحقق من المفتاح وإدخاله مرة أخرى.', 'error');
        // إزالة المفتاح غير الصالح
        localStorage.removeItem('openai_api_key');
        // مسح المتغيرات العامة
        window.API_KEY = null;
        window.emotionAnalysisAPI_KEY = null;
        window.faceEmotionAPI_KEY = null;
        window.audioEmotionAPI_KEY = null;
        return false;
    }

    return true;
}

// معالجة أخطاء API
function handleApiError(error) {
    console.error('API Error:', error);
    
    // التحقق من نوع الخطأ
    if (error.message && error.message.includes('Incorrect API key')) {
        console.log('Detected incorrect API key, setting the correct one');
        // الحصول على المفتاح الصحيح من متغيرات البيئة
        let correctApiKey = '';
        if (window.getEnvVar) {
            correctApiKey = window.getEnvVar('OPENAI_API_KEY');
        }
        
        if (correctApiKey) {
            localStorage.setItem('openai_api_key', correctApiKey);
            window.API_KEY = correctApiKey;
            window.emotionAnalysisAPI_KEY = correctApiKey;
            window.faceEmotionAPI_KEY = correctApiKey;
            window.audioEmotionAPI_KEY = correctApiKey;
        }
        
        // إرسال حدث للإشارة إلى تعيين مفتاح API
        const event = new CustomEvent('apiKeySet', { detail: { apiKey: correctApiKey } });
        document.dispatchEvent(event);
        
        console.log('Correct API key has been set');
        return true;
    }
    
    return false;
}

// تهيئة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // التحقق من وجود مفتاح API
    let apiKey = getApiKey();

    if (apiKey) {
        console.log('API key found');
    } else {
        console.warn('API key not found, setting default key');
        // الحصول على مفتاح API من متغيرات البيئة
        if (window.getEnvVar) {
            const envApiKey = window.getEnvVar('OPENAI_API_KEY');
            if (envApiKey) {
                setApiKey(envApiKey);
                console.log('API key from .env has been set');
            }
        }
    }
});
