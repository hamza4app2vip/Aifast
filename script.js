// متغيرات عامة
let API_KEY = "";
const API_BASE_URL = "https://api.openai.com/v1";

// الحصول على مفتاح API من متغيرات البيئة
function loadApiKeyFromEnv() {
    if (window.getEnvVar) {
        API_KEY = window.getEnvVar('OPENAI_API_KEY');
        if (!API_KEY && typeof showNotification === 'function') {
            showNotification('لم يتم العثور على مفتاح API في ملف .env', 'error');
        }
    }
}

// الاستماع لحدث تعيين مفتاح API
document.addEventListener('apiKeySet', (event) => {
    API_KEY = event.detail.apiKey;
    console.log('API key updated in script.js');
});

// تحميل مفتاح API من متغيرات البيئة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    loadApiKeyFromEnv();
});

// عناصر DOM
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const loadingOverlay = document.getElementById('loading');

// تبديل التبويبات
tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const tabId = button.getAttribute('data-tab');

        // إزالة الكلاس النشط من كل الأزرار والمحتويات
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));

        // إضافة الكلاس النشط للزر والمحتوى المحددين
        button.classList.add('active');
        document.getElementById(tabId).classList.add('active');
    });
});

// عرض وإخفاء شاشة التحميل
function showLoading() {
    loadingOverlay.classList.add('active');
}

function hideLoading() {
    loadingOverlay.classList.remove('active');
}

// دالة لإرسال طلبات API
async function makeAPIRequest(endpoint, payload) {
    showLoading();

    try {
        const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${window.API_KEY || API_KEY}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error.message || 'حدث خطأ في الاتصال بالخادم');
        }

        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    } finally {
        hideLoading();
    }
}

// ===== وظائف الدردشة =====
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendButton = document.getElementById('send-message');

// إضافة رسالة إلى واجهة الدردشة
function addMessage(content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : ''}`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = isUser ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.textContent = content;

    if (messageDiv && avatar) messageDiv.appendChild(avatar);
    if (messageDiv && messageContent) messageDiv.appendChild(messageContent);

    if (chatMessages && messageDiv) chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// إرسال رسالة الدردشة
async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    addMessage(message, true);
    chatInput.value = '';

    try {
        const response = await makeAPIRequest('chat/completions', {
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: 'أنت مساعد ذكي ودقيق.' },
                { role: 'user', content: message }
            ]
        });

        const assistantMessage = response.choices[0].message.content;
        addMessage(assistantMessage);
    } catch (error) {
        addMessage(`⚠ خطأ: ${error.message}`);
    }
}

sendButton.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// ===== وظائف إنشاء الصور =====
const imagePrompt = document.getElementById('image-prompt');
const generateImageBtn = document.getElementById('generate-image-btn');
const imageResult = document.getElementById('image-result');

generateImageBtn.addEventListener('click', async () => {
    const prompt = imagePrompt.value.trim();
    if (!prompt) return;

    try {
        const response = await makeAPIRequest('images/generations', {
            model: 'dall-e-3',
            prompt: prompt,
            size: '1024x1024',
            n: 1
        });

        const imageUrl = response.data[0].url;
        imageResult.innerHTML = `<img src="${imageUrl}" alt="الصورة الناتجة">`;
    } catch (error) {
        imageResult.innerHTML = `<div class="error">⚠ خطأ: ${error.message}</div>`;
    }
});

// ===== وظائف تحويل الكلام إلى نص =====
const recordBtn = document.getElementById('record-btn');
const audioPlayer = document.getElementById('audio-player');
const speechResult = document.getElementById('speech-result');
let mediaRecorder;
let audioChunks = [];

recordBtn.addEventListener('click', async () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        // إيقاف التسجيل
        mediaRecorder.stop();
        recordBtn.classList.remove('recording');
        recordBtn.innerHTML = '<i class="fas fa-microphone"></i> ابدأ التسجيل';
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            const audioUrl = URL.createObjectURL(audioBlob);
            audioPlayer.src = audioUrl;
            audioPlayer.style.display = 'block';

            // تحويل الصوت إلى نص
            await transcribeAudio(audioBlob);

            // إعادة تعيين المتغيرات
            audioChunks = [];
        };

        mediaRecorder.start();
        recordBtn.classList.add('recording');
        recordBtn.innerHTML = '<i class="fas fa-stop"></i> إيقاف التسجيل';
    } catch (error) {
        speechResult.innerHTML = `<div class="error">⚠ خطأ في الوصول إلى الميكروفون: ${error.message}</div>`;
    }
});

async function transcribeAudio(audioBlob) {
    try {
        const formData = new FormData();
        formData.append('file', audioBlob, 'audio.wav');
        formData.append('model', 'whisper-1');

        showLoading();

        const response = await fetch(`${API_BASE_URL}/audio/transcriptions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${window.API_KEY || API_KEY}`
            },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error.message || 'حدث خطأ في الاتصال بالخادم');
        }

        const data = await response.json();
        speechResult.innerHTML = `<div class="result">${data.text}</div>`;
    } catch (error) {
        speechResult.innerHTML = `<div class="error">⚠ خطأ: ${error.message}</div>`;
    } finally {
        hideLoading();
    }
}

// ===== وظائف تحويل النص إلى كلام =====
const ttsText = document.getElementById('tts-text');
const ttsBtn = document.getElementById('tts-btn');
const ttsResult = document.getElementById('tts-result');

ttsBtn.addEventListener('click', async () => {
    const text = ttsText.value.trim();
    if (!text) return;

    try {
        const response = await fetch(`${API_BASE_URL}/audio/speech`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${window.API_KEY || API_KEY}`
            },
            body: JSON.stringify({
                model: 'tts-1',
                voice: 'nova',
                input: text
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error.message || 'حدث خطأ في الاتصال بالخادم');
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        ttsResult.innerHTML = `<audio src="${audioUrl}" controls autoplay></audio>`;
    } catch (error) {
        ttsResult.innerHTML = `<div class="error">⚠ خطأ: ${error.message}</div>`;
    }
});

// ===== وظائف تحليل الصور =====
const imageUpload = document.getElementById('image-upload');
const fileName = document.getElementById('file-name');
const previewImage = document.getElementById('preview-image');
const imageQuestion = document.getElementById('image-question');
const analyzeBtn = document.getElementById('analyze-btn');
const analysisResult = document.getElementById('analysis-result');

imageUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        fileName.textContent = file.name;

        const reader = new FileReader();
        reader.onload = (e) => {
            previewImage.src = e.target.result;
            previewImage.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});

analyzeBtn.addEventListener('click', async () => {
    const file = imageUpload.files[0];
    if (!file) {
        analysisResult.innerHTML = '<div class="error">⚠ الرجاء اختيار صورة أولاً</div>';
        return;
    }

    const question = imageQuestion.value.trim() || 'صف محتوى هذه الصورة بالتفصيل.';

    try {
        // تحويل الصورة إلى base64
        const reader = new FileReader();
        reader.onload = async (e) => {
            const base64Image = e.target.result.split(',')[1];

            try {
                const response = await makeAPIRequest('chat/completions', {
                    model: 'gpt-4o',
                    messages: [
                        { role: 'system', content: 'أنت مساعد ذكي يشرح الصور بدقة وبالعربية.' },
                        {
                            role: 'user',
                            content: [
                                { type: 'text', text: question },
                                {
                                    type: 'image_url',
                                    image_url: {
                                        url: `data:image/jpeg;base64,${base64Image}`
                                    }
                                }
                            ]
                        }
                    ],
                    max_tokens: 1000
                });

                const analysis = response.choices[0].message.content;
                analysisResult.innerHTML = `<div class="result">${analysis}</div>`;
            } catch (error) {
                analysisResult.innerHTML = `<div class="error">⚠ خطأ: ${error.message}</div>`;
            }
        };
        reader.readAsDataURL(file);
    } catch (error) {
        analysisResult.innerHTML = `<div class="error">⚠ خطأ: ${error.message}</div>`;
    }
});

// إضافة رسالة ترحيب عند تحميل الصفحة
window.addEventListener('load', () => {
    addMessage('مرحباً! أنا مساعدك الذكي متعدد الوسائط. كيف يمكنني مساعدتك اليوم؟');
});