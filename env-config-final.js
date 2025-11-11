// تكوين متغيرات البيئة
// يقرأ متغيرات البيئة من ملف .env

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
            window.API_KEY = envVars['OPENAI_API_KEY'];
            window.emotionAnalysisAPI_KEY = envVars['OPENAI_API_KEY'];
            window.faceEmotionAPI_KEY = envVars['OPENAI_API_KEY'];
            window.audioEmotionAPI_KEY = envVars['OPENAI_API_KEY'];
            
            // إرسال حدث للإشارة إلى تعيين مفتاح API
            const event = new CustomEvent('apiKeySet', { detail: { apiKey: envVars['OPENAI_API_KEY'] } });
            document.dispatchEvent(event);
            
            // عرض رسالة نجاح
            showNotification('تم العثور على مفتاح API في ملف .env بنجاح!', 'success');
        } else {
            console.warn('API key not found in .env file');
            
            // لا يوجد مفتاح API افتراضي
            window.API_KEY = null;
            window.emotionAnalysisAPI_KEY = null;
            window.faceEmotionAPI_KEY = null;
            window.audioEmotionAPI_KEY = null;
            
            console.log('API key not set');
        }
        
        return envVars;
    } catch (error) {
        console.error('Error loading environment variables:', error);
        
        // لا يوجد مفتاح API افتراضي
        window.API_KEY = null;
        window.emotionAnalysisAPI_KEY = null;
        window.faceEmotionAPI_KEY = null;
        window.audioEmotionAPI_KEY = null;
        
        console.log('API key not set due to error');
        
        return {};
    }
}

// دالة للحصول على قيمة متغير بيئة
function getEnvVar(key) {
    return envVars[key] || '';
}

// دالة لعرض رسالة للمستخدم
function showNotification(message, type = 'info') {
    // التحقق من وجود الرسالة بالفعل
    let notification = document.querySelector('.env-notification');
    
    if (!notification) {
        // إنشاء عنصر الرسالة
        notification = document.createElement('div');
        notification.className = 'env-notification';
        
        // إضافة التنسيق
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            max-width: 300px;
            direction: rtl;
            transition: all 0.3s ease;
            opacity: 0;
            transform: translateY(-20px);
        `;
        
        // إضافة الرسالة إلى الصفحة
        document.body.appendChild(notification);
    }
    
    // تحديث محتوى الرسالة
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <div class="message">${message}</div>
        </div>
    `;
    
    // تحديث لون الخلفية حسب النجاح أو الخطأ
    if (type === 'success') {
        notification.style.backgroundColor = '#d4edda';
        notification.style.color = '#155724';
    } else if (type === 'error') {
        notification.style.backgroundColor = '#f8d7da';
        notification.style.color = '#721c24';
    } else {
        notification.style.backgroundColor = '#d1ecf1';
        notification.style.color = '#0c5460';
    }
    
    // تنسيق المحتوى
    const contentDiv = notification.querySelector('.notification-content');
    if (contentDiv) {
        contentDiv.style.cssText = `
            display: flex;
            align-items: center;
            gap: 10px;
        `;
        
        const icon = contentDiv.querySelector('i');
        if (icon) {
            icon.style.cssText = `
                font-size: 20px;
            `;
        }
        
        const messageDiv = contentDiv.querySelector('.message');
        if (messageDiv) {
            messageDiv.style.cssText = `
                font-size: 14px;
                line-height: 1.4;
            `;
        }
    }
    
    // إظهار الرسالة بتأثير
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
    }, 100);
    
    // إغلاق الرسالة تلقائياً بعد 5 ثوانٍ
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-20px)';
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }, 5000);
}

// تحميل متغيرات البيئة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', async function() {
    // محاولة الحصول على مفتاح API من التخزين المحلي أولاً
    const localApiKey = localStorage.getItem('openai_api_key');
    if (localApiKey) {
        console.log('API key found in localStorage');
        
        // تعيين مفتاح API في المتغيرات العامة
        window.API_KEY = localApiKey;
        window.emotionAnalysisAPI_KEY = localApiKey;
        window.faceEmotionAPI_KEY = localApiKey;
        window.audioEmotionAPI_KEY = localApiKey;
        
        // إرسال حدث للإشارة إلى تعيين مفتاح API
        const event = new CustomEvent('apiKeySet', { detail: { apiKey: localApiKey } });
        document.dispatchEvent(event);
        
        return;
    }
    
    // إذا لم يكن هناك مفتاح في التخزين المحلي، حاول تحميل متغيرات البيئة
    try {
        await loadEnv();
    } catch (error) {
        console.error('Error loading environment variables:', error);
        
        // لا يوجد مفتاح API افتراضي
        window.API_KEY = null;
        window.emotionAnalysisAPI_KEY = null;
        window.faceEmotionAPI_KEY = null;
        window.audioEmotionAPI_KEY = null;
        
        console.log('API key not set due to error');
    }
});

// تصدير الدوال للاستخدام في الملفات الأخرى
window.loadEnv = loadEnv;
window.getEnvVar = getEnvVar;
window.showNotification = showNotification;