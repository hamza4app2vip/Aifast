// التحقق من مفتاح API
// ملف بسيط للتحقق من وجود مفتاح API في ملف .env

// دالة لقراءة ملف .env مباشرة
async function checkApiKey() {
    try {
        // قراءة ملف .env
        const response = await fetch('.env');
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
            
            return true;
        } else {
            console.error('API key not found in .env');
            // طلب من المستخدم إدخال مفتاح API
            if (typeof requestApiKeyInput === 'function') {
                requestApiKeyInput();
            } else {
                showApiWarning();
            }
            return false;
        }
    } catch (error) {
        console.error('Error reading .env file:', error);
        showApiWarning();
        return false;
    }
}

// دالة لعرض رسالة تحذير للمستخدم
function showApiWarning() {
    // التحقق من وجود الرسالة بالفعل
    let warningDiv = document.querySelector('.api-warning');
    
    if (!warningDiv) {
        // إنشاء عنصر الرسالة
        warningDiv = document.createElement('div');
        warningDiv.className = 'api-warning';
        warningDiv.innerHTML = `
            <div class="api-warning-content">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>مفتاح API غير موجود</h3>
                <p>يرجى التأكد من وجود مفتاح OpenAI API في ملف .env</p>
                <p>يمكنك إنشاء مفتاح جديد من <a href="https://platform.openai.com/api-keys" target="_blank">منصة OpenAI</a></p>
                <button id="close-warning" class="btn btn-primary">فهمت</button>
            </div>
        `;
        
        // إضافة التنسيق
        warningDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            direction: rtl;
        `;
        
        // تنسيق المحتوى
        const contentDiv = warningDiv.querySelector('.api-warning-content');
        if (contentDiv) {
            contentDiv.style.cssText = `
                background-color: white;
                color: #333;
                padding: 30px;
                border-radius: 10px;
                max-width: 500px;
                text-align: center;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            `;
            
            const icon = contentDiv.querySelector('i');
            if (icon) {
                icon.style.cssText = `
                    font-size: 48px;
                    color: #f39c12;
                    margin-bottom: 15px;
                `;
            }
            
            const heading = contentDiv.querySelector('h3');
            if (heading) {
                heading.style.cssText = `
                    margin: 0 0 15px;
                    color: #e74c3c;
                `;
            }
            
            const paragraph = contentDiv.querySelectorAll('p');
            paragraph.forEach(p => {
                p.style.cssText = `
                    margin: 10px 0;
                    line-height: 1.5;
                `;
            });
            
            const link = contentDiv.querySelector('a');
            if (link) {
                link.style.cssText = `
                    color: #3498db;
                    text-decoration: none;
                `;
            }
            
            const button = contentDiv.querySelector('button');
            if (button) {
                button.style.cssText = `
                    background-color: #3498db;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    margin-top: 15px;
                    font-weight: bold;
                `;
                
                button.addEventListener('click', () => {
                    document.body.removeChild(warningDiv);
                });
            }
        }
        
        // إضافة الرسالة إلى الصفحة
        document.body.appendChild(warningDiv);
    }
}

// التحقق من مفتاح API عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', async function() {
    await checkApiKey();
});

// تصدير الدوال للاستخدام في الملفات الأخرى
window.checkApiKey = checkApiKey;
window.showApiWarning = showApiWarning;