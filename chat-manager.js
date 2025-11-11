// مدير الدردشة
// يدير عملية إرسال الرسائل واستقبالها

// متغيرات عامة
let apiKey = '';
const API_BASE_URL = (typeof window !== 'undefined' && window.OPENAI_PROXY_URL) ? window.OPENAI_PROXY_URL : "https://api.openai.com/v1";

// استمع لحدث تعيين مفتاح API لضمان مزامنة المفتاح بعد تحميل .env أو إدخال المستخدم في GitHub Pages
document.addEventListener('apiKeySet', function (e) {
    try {
        const incoming = e && e.detail && e.detail.apiKey ? String(e.detail.apiKey).trim() : '';
        if (incoming && incoming.startsWith('sk-')) {
            apiKey = incoming;
            try { localStorage.setItem('openai_api_key', apiKey); } catch (_) {}
            console.log('API key received via apiKeySet event');
        }
    } catch (_) {}
});

// تحميل مفتاح API عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // دعم تمرير المفتاح عبر معامل ?api_key=sk-...
    try {
        const url = new URL(window.location.href);
        const qpKey = url.searchParams.get('api_key');
        if (qpKey && qpKey.trim().startsWith('sk-')) {
            apiKey = qpKey.trim();
            try { localStorage.setItem('openai_api_key', apiKey); } catch (_) {}
            try {
                const evt = new CustomEvent('apiKeySet', { detail: { apiKey } });
                document.dispatchEvent(evt);
            } catch (_) {}
        }
    } catch (_) {}

    const loaded = loadApiKeyFromEnv();
    if (!loaded) {
        setTimeout(() => {
            if (!apiKey) {
                loadApiKeyFromEnv();
            }
        }, 300);
    }
});

// دالة لتحميل مفتاح API من متغيرات البيئة
function loadApiKeyFromEnv() {
    // محاولة الحصول على مفتاح API من التخزين المحلي أولاً
    const localApiKey = localStorage.getItem('openai_api_key');
    if (localApiKey) {
        apiKey = localApiKey;
        console.log('API key loaded from localStorage');
        return true;
    }

    // إذا لم يكن هناك مفتاح في التخزين المحلي، حاول من متغيرات البيئة
    if (window.getEnvVar) {
        const envApiKey = window.getEnvVar('OPENAI_API_KEY');
        if (envApiKey) {
            apiKey = envApiKey;
            localStorage.setItem('openai_api_key', apiKey);
            console.log('API key loaded from .env file');
            return true;
        } else {
            console.log('API key not found in .env file');
        }
    } else {
        console.log('getEnvVar function is not available');
    }

    // إذا لم يتم العثور على مفتاح API في أي مكان، لا تعرض رسالة خطأ هنا
    return false;
}

// التحقق من وجود مفتاح API
function checkApiKey() {
    // محاولة تحميل مفتاح API من متغيرات البيئة أولاً
    loadApiKeyFromEnv();

    if (!apiKey) {
        // لا نعرض رسالة خطأ
        return false;
    }
    return true;
}

// عناصر DOM
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendButton = document.getElementById('send-message');

// إضافة رسالة إلى واجهة الدردشة
function addMessage(content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'ai'}`;

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.innerHTML = `<p>${content}</p>`;

    const messageInfo = document.createElement('div');
    messageInfo.className = 'message-info';
    messageInfo.innerHTML = `<span class="message-time">الآن</span>`;

    messageDiv.appendChild(messageContent);
    messageDiv.appendChild(messageInfo);

    if (chatMessages) chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// إظهار مؤشر الكتابة
function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message ai-message typing-indicator animate__animated animate__fadeIn';
    typingDiv.innerHTML = `
        <div class="message-content">
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
        <div class="message-info">
            <span class="message-time">الآن</span>
        </div>
    `;
    
    if (chatMessages) {
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// إخفاء مؤشر الكتابة
function hideTypingIndicator() {
    const typingIndicator = document.querySelector('.typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// إرسال رسالة الدردشة
async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    if (!checkApiKey()) return;

    addMessage(message, true);
    chatInput.value = '';
    
    // إظهار مؤشر الكتابة
    showTypingIndicator();

    try {
        const response = await fetch(`${API_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: 'أنت مساعد ذكي متعدد الوسائط. تم تطويرك بواسطة المهندسة زينب.' },
                    { role: 'user', content: message }
                ]
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const assistantMessage = data.choices[0].message.content;
        
        // إخفاء مؤشر الكتابة
        hideTypingIndicator();
        
        addMessage(assistantMessage);
    } catch (error) {
        console.error('Error:', error);
        
        // إخفاء مؤشر الكتابة
        hideTypingIndicator();
        
        addMessage('حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى.');
    }
}

// ربط الأحداث
if (sendButton) {
    sendButton.addEventListener('click', sendMessage);
}

if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}

// تصدير الدوال للاستخدام في الملفات الأخرى
window.sendMessage = sendMessage;
window.addMessage = addMessage;
window.checkApiKey = checkApiKey;