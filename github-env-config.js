// تكوين متغيرات البيئة لـ GitHub Pages
// يقرأ متغيرات البيئة من ملف .env أو من واجهة المستخدم

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
            
            // عرض واجهة إدخال مفتاح API
            showApiKeyInputModal();
        }
        
        return envVars;
    } catch (error) {
        console.error('Error loading environment variables:', error);
        
        // عرض واجهة إدخال مفتاح API
        showApiKeyInputModal();
        
        return {};
    }
}

// دالة لعرض واجهة إدخال مفتاح API
function showApiKeyInputModal() {
    // التحقق من وجود واجهة الإدخال بالفعل
    if (document.getElementById('api-key-modal')) {
        return;
    }
    
    // إنشاء واجهة الإدخال
    const modal = document.createElement('div');
    modal.id = 'api-key-modal';
    modal.className = 'api-key-modal';
    modal.innerHTML = `
        <div class="api-key-modal-content">
            <div class="api-key-modal-header">
                <h3>مفتاح OpenAI API مطلوب</h3>
                <button class="api-key-modal-close">&times;</button>
            </div>
            <div class="api-key-modal-body">
                <p>يرجى إدخال مفتاح OpenAI API لاستخدام جميع وظائف التطبيق.</p>
                <div class="api-key-input-group">
                    <input type="password" id="api-key-input" placeholder="sk-..." autocomplete="off">
                    <button id="api-key-toggle" class="api-key-toggle-btn"><i class="fas fa-eye"></i></button>
                </div>
                <div class="api-key-help">
                    <p>يمكنك الحصول على مفتاح API من <a href="https://platform.openai.com/api-keys" target="_blank">هنا</a>.</p>
                </div>
            </div>
            <div class="api-key-modal-footer">
                <button id="api-key-save" class="btn btn-primary">حفظ</button>
            </div>
        </div>
    `;
    
    // إضافة تنسيق CSS
    const style = document.createElement('style');
    style.textContent = `
        .api-key-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            direction: rtl;
        }
        
        .api-key-modal-content {
            background-color: #fff;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            width: 90%;
            max-width: 500px;
            overflow: hidden;
        }
        
        .api-key-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 20px;
            background-color: #f8f9fa;
            border-bottom: 1px solid #e9ecef;
        }
        
        .api-key-modal-header h3 {
            margin: 0;
            color: #333;
        }
        
        .api-key-modal-close {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #6c757d;
        }
        
        .api-key-modal-body {
            padding: 20px;
        }
        
        .api-key-input-group {
            position: relative;
            margin: 16px 0;
        }
        
        .api-key-input-group input {
            width: 100%;
            padding: 12px 40px 12px 16px;
            border: 1px solid #ced4da;
            border-radius: 4px;
            font-size: 16px;
            direction: ltr;
        }
        
        .api-key-toggle-btn {
            position: absolute;
            left: 12px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: #6c757d;
            cursor: pointer;
        }
        
        .api-key-help {
            margin-top: 12px;
            font-size: 14px;
            color: #6c757d;
        }
        
        .api-key-help a {
            color: #007bff;
        }
        
        .api-key-modal-footer {
            padding: 16px 20px;
            background-color: #f8f9fa;
            border-top: 1px solid #e9ecef;
            text-align: left;
        }
        
        .btn {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
        }
        
        .btn-primary {
            background-color: #007bff;
            color: white;
        }
        
        .btn-primary:hover {
            background-color: #0069d9;
        }
    `;
    
    // إضافة الواجهة والتنسيق إلى الصفحة
    document.head.appendChild(style);
    document.body.appendChild(modal);
    
    // إضافة معالجات الأحداث
    const apiKeyInput = document.getElementById('api-key-input');
    const apiKeyToggle = document.getElementById('api-key-toggle');
    const apiKeySave = document.getElementById('api-key-save');
    const modalClose = document.querySelector('.api-key-modal-close');
    
    // تبديل عرض مفتاح API
    apiKeyToggle.addEventListener('click', function() {
        if (apiKeyInput.type === 'password') {
            apiKeyInput.type = 'text';
            apiKeyToggle.innerHTML = '<i class="fas fa-eye-slash"></i>';
        } else {
            apiKeyInput.type = 'password';
            apiKeyToggle.innerHTML = '<i class="fas fa-eye"></i>';
        }
    });
    
    // حفظ مفتاح API
    apiKeySave.addEventListener('click', function() {
        const apiKey = apiKeyInput.value.trim();
        
        if (!apiKey) {
            showNotification('يرجى إدخال مفتاح API', 'error');
            return;
        }
        
        if (!apiKey.startsWith('sk-') || apiKey.length < 20) {
            showNotification('صيغة مفتاح API غير صالحة', 'error');
            return;
        }
        
        // حفظ مفتاح API في التخزين المحلي
        localStorage.setItem('openai_api_key', apiKey);
        
        // تعيين مفتاح API في المتغيرات العامة
        window.API_KEY = apiKey;
        window.emotionAnalysisAPI_KEY = apiKey;
        window.faceEmotionAPI_KEY = apiKey;
        window.audioEmotionAPI_KEY = apiKey;
        
        // إرسال حدث للإشارة إلى تعيين مفتاح API
        const event = new CustomEvent('apiKeySet', { detail: { apiKey: apiKey } });
        document.dispatchEvent(event);
        
        // عرض رسالة نجاح
        showNotification('تم حفظ مفتاح API بنجاح', 'success');
        
        // إغلاق الواجهة
        document.body.removeChild(modal);
        document.head.removeChild(style);
    });
    
    // إغلاق الواجهة
    modalClose.addEventListener('click', function() {
        document.body.removeChild(modal);
        document.head.removeChild(style);
    });
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
        
        // عرض واجهة إدخال مفتاح API
        showApiKeyInputModal();
    }
});

// تصدير الدوال للاستخدام في الملفات الأخرى
window.loadEnv = loadEnv;
window.getEnvVar = getEnvVar;
window.showNotification = showNotification;