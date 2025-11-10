// التحقق من حالة مفتاح API
// يتحقق من وجود مفتاح API في ملف .env ويظهر الحالة للمستخدم

// دالة للتحقق من مفتاح API
async function checkApiStatus() {
    try {
        // قراءة ملف .env
        const response = await fetch('.env', { cache: "no-store" });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const envText = await response.text();
        
        // البحث عن مفتاح API في النص
        const apiKeyMatch = envText.match(/OPENAI_API_KEY=(.+)/);
        
        if (apiKeyMatch && apiKeyMatch[1]) {
            const apiKey = apiKeyMatch[1].trim();
            console.log('API key found in .env:', apiKey.substring(0, 10) + '...');
            
            // تعيين المفتاح في التخزين المحلي
            localStorage.setItem('openai_api_key', apiKey);
            
            // تعيين المفتاح في المتغيرات العامة
            window.API_KEY = apiKey;
            window.emotionAnalysisAPI_KEY = apiKey;
            window.faceEmotionAPI_KEY = apiKey;
            window.audioEmotionAPI_KEY = apiKey;
            
            // إرسال حدث للإشارة إلى تعيين مفتاح API
            const event = new CustomEvent('apiKeySet', { detail: { apiKey: apiKey } });
            document.dispatchEvent(event);
            
            // عرض رسالة نجاح
            showApiStatus(true, 'تم العثور على مفتاح API في ملف .env بنجاح!');
            
            return true;
        } else {
            console.error('API key not found in .env');
            
            // عرض رسالة خطأ
            showApiStatus(false, 'لم يتم العثور على مفتاح API في ملف .env');
            
            return false;
        }
    } catch (error) {
        console.error('Error reading .env file:', error);
        
        // عرض رسالة خطأ
        showApiStatus(false, `حدث خطأ أثناء قراءة ملف .env: ${error.message}`);
        
        return false;
    }
}

// دالة لعرض رسالة حالة مفتاح API
function showApiStatus(success, message) {
    // التحقق من وجود الرسالة بالفعل
    let statusDiv = document.querySelector('.api-status');
    
    if (!statusDiv) {
        // إنشاء عنصر الرسالة
        statusDiv = document.createElement('div');
        statusDiv.className = 'api-status';
        
        // إضافة التنسيق
        statusDiv.style.cssText = `
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
        document.body.appendChild(statusDiv);
        
        // إظهار الرسالة بتأثير
        setTimeout(() => {
            statusDiv.style.opacity = '1';
            statusDiv.style.transform = 'translateY(0)';
        }, 100);
        
        // إغلاق الرسالة تلقائياً بعد 5 ثوانٍ
        setTimeout(() => {
            if (statusDiv.parentNode) {
                statusDiv.style.opacity = '0';
                statusDiv.style.transform = 'translateY(-20px)';
                
                setTimeout(() => {
                    if (statusDiv.parentNode) {
                        statusDiv.parentNode.removeChild(statusDiv);
                    }
                }, 300);
            }
        }, 5000);
    }
    
    // تحديث محتوى الرسالة
    statusDiv.innerHTML = `
        <div class="api-status-content">
            <i class="fas fa-${success ? 'check-circle' : 'exclamation-circle'}"></i>
            <div class="message">${message}</div>
        </div>
    `;
    
    // تحديث لون الخلفية حسب النجاح أو الخطأ
    statusDiv.style.backgroundColor = success ? '#d4edda' : '#f8d7da';
    
    // تنسيق المحتوى
    const contentDiv = statusDiv.querySelector('.api-status-content');
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
                color: ${success ? '#155724' : '#721c24'};
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
}

// التحقق من مفتاح API عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', async function() {
    await checkApiStatus();
});

// تصدير الدوال للاستخدام في الملفات الأخرى
window.checkApiStatus = checkApiStatus;
window.showApiStatus = showApiStatus;