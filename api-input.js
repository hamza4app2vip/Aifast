// إدخال مفتاح API
// يتيح للمستخدم إدخال مفتاح API يدوياً

// دالة لعرض نافذة إدخال مفتاح API
function showApiKeyInput() {
    // إنشاء عنصر النافذة
    const modal = document.createElement('div');
    modal.className = 'api-input-modal';
    modal.innerHTML = `
        <div class="api-input-content">
            <h3>إدخال مفتاح OpenAI API</h3>
            <p>يرجى إدخال مفتاح OpenAI API الصحيح</p>
            <div class="input-group">
                <label for="api-key-input">مفتاح API:</label>
                <input type="password" id="api-key-input" placeholder="sk-..." autocomplete="off">
            </div>
            <div class="button-group">
                <button id="save-api-key" class="btn btn-primary">حفظ</button>
                <button id="cancel-api-key" class="btn btn-secondary">إلغاء</button>
            </div>
        </div>
    `;
    
    // إضافة التنسيق
    modal.style.cssText = `
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
    const contentDiv = modal.querySelector('.api-input-content');
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
        
        const heading = contentDiv.querySelector('h3');
        if (heading) {
            heading.style.cssText = `
                margin: 0 0 15px;
                color: #333;
            `;
        }
        
        const paragraph = contentDiv.querySelector('p');
        if (paragraph) {
            paragraph.style.cssText = `
                margin: 0 0 20px;
                line-height: 1.5;
            `;
        }
        
        const inputGroup = contentDiv.querySelector('.input-group');
        if (inputGroup) {
            inputGroup.style.cssText = `
                margin-bottom: 20px;
                text-align: right;
            `;
            
            const label = inputGroup.querySelector('label');
            if (label) {
                label.style.cssText = `
                    display: block;
                    margin-bottom: 8px;
                    font-weight: bold;
                `;
            }
            
            const input = inputGroup.querySelector('input');
            if (input) {
                input.style.cssText = `
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    font-size: 16px;
                    box-sizing: border-box;
                `;
            }
        }
        
        const buttonGroup = contentDiv.querySelector('.button-group');
        if (buttonGroup) {
            buttonGroup.style.cssText = `
                display: flex;
                justify-content: center;
                gap: 10px;
            `;
            
            const buttons = buttonGroup.querySelectorAll('button');
            buttons.forEach(button => {
                button.style.cssText = `
                    padding: 10px 20px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-weight: bold;
                `;
                
                if (button.id === 'save-api-key') {
                    button.style.backgroundColor = '#3498db';
                    button.style.color = 'white';
                } else {
                    button.style.backgroundColor = '#f8f9fa';
                    button.style.color = '#333';
                    button.style.border = '1px solid #ddd';
                }
            });
        }
    }
    
    // إضافة النافذة إلى الصفحة
    document.body.appendChild(modal);
    
    // التركيز على حقل الإدخال
    const input = document.getElementById('api-key-input');
    if (input) {
        input.focus();
    }
    
    // إضافة الأحداث
    const saveButton = document.getElementById('save-api-key');
    const cancelButton = document.getElementById('cancel-api-key');
    
    if (saveButton) {
        saveButton.addEventListener('click', () => {
            const apiKey = input.value.trim();
            
            if (!apiKey) {
                alert('يرجى إدخال مفتاح API');
                return;
            }
            
            if (!apiKey.startsWith('sk-') || apiKey.length < 20) {
                alert('مفتاح API غير صالح. يرجى التحقق من المفتاح وإدخاله مرة أخرى.');
                return;
            }
            
            // حفظ المفتاح في التخزين المحلي
            localStorage.setItem('openai_api_key', apiKey);
            
            // تعيين المفتاح في المتغيرات العامة
            window.API_KEY = apiKey;
            window.emotionAnalysisAPI_KEY = apiKey;
            window.faceEmotionAPI_KEY = apiKey;
            window.audioEmotionAPI_KEY = apiKey;
            
            // إرسال حدث للإشارة إلى تعيين مفتاح API
            const event = new CustomEvent('apiKeySet', { detail: { apiKey: apiKey } });
            document.dispatchEvent(event);
            
            console.log('API key saved successfully');
            
            // إغلاق النافذة
            document.body.removeChild(modal);
        });
    }
    
    if (cancelButton) {
        cancelButton.addEventListener('click', () => {
            // إغلاق النافذة
            document.body.removeChild(modal);
        });
    }
    
    // إغلاق النافذة عند النقر خارجها
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

// دالة لعرض رسالة للمستخدم تطلب منه إدخال مفتاح API
function requestApiKeyInput() {
    // إنشاء عنصر الرسالة
    const messageDiv = document.createElement('div');
    messageDiv.className = 'api-request-message';
    messageDiv.innerHTML = `
        <div class="api-request-content">
            <i class="fas fa-key"></i>
            <h3>مطلوب مفتاح OpenAI API</h3>
            <p>يرجى إدخال مفتاح OpenAI API لاستخدام التطبيق</p>
            <button id="enter-api-key" class="btn btn-primary">إدخال مفتاح API</button>
        </div>
    `;
    
    // إضافة التنسيق
    messageDiv.style.cssText = `
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
    const contentDiv = messageDiv.querySelector('.api-request-content');
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
                color: #3498db;
                margin-bottom: 15px;
            `;
        }
        
        const heading = contentDiv.querySelector('h3');
        if (heading) {
            heading.style.cssText = `
                margin: 0 0 15px;
                color: #333;
            `;
        }
        
        const paragraph = contentDiv.querySelector('p');
        if (paragraph) {
            paragraph.style.cssText = `
                margin: 0 0 20px;
                line-height: 1.5;
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
                // إزالة الرسالة وعرض نافذة الإدخال
                document.body.removeChild(messageDiv);
                showApiKeyInput();
            });
        }
    }
    
    // إضافة الرسالة إلى الصفحة
    document.body.appendChild(messageDiv);
}

// تصدير الدوال للاستخدام في الملفات الأخرى
window.showApiKeyInput = showApiKeyInput;
window.requestApiKeyInput = requestApiKeyInput;