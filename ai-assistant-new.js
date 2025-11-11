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
    // سيتم عرض واجهة إدخال المفتاح من خلال github-env-config.js
    return false;
}

// عناصر DOM
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const loadingOverlay = document.getElementById('loading');
const navbar = document.querySelector('.navbar');
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
const apiKeyInput = document.getElementById('apiKeyInput');
const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
const toggleApiKeyBtn = document.getElementById('toggleApiKeyBtn');
const apiSection = document.querySelector('.api-section');
const notification = document.getElementById('notification');
const notificationText = document.getElementById('notification-text');
const closeNotificationBtn = document.getElementById('close-notification');

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

// إظهار إشعار
function showNotification(message, type = 'info') {
    notificationText.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');

    // إخفاء الإشعار تلقائيًا بعد 5 ثوانٍ
    setTimeout(() => {
        notification.classList.remove('show');
    }, 5000);
}

// إغلاق الإشعار
closeNotificationBtn.addEventListener('click', () => {
    notification.classList.remove('show');
});

// تغيير شريط التنقل عند التمرير
window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// تبديل القائمة في الشاشات الصغيرة
menuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
});

// إغلاق القائمة عند النقر على رابط
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
    });
});

// التعامل مع مفتاح API
function saveApiKey() {
    apiKey = apiKeyInput.value.trim();
    if (apiKey) {
        localStorage.setItem('openai_api_key', apiKey);
        // لا نعرض المفتاح في الحقل بعد الحفظ ونخفي القسم
        if (apiKeyInput) {
            apiKeyInput.value = '';
            apiKeyInput.placeholder = 'تم حفظ المفتاح في المتصفح';
        }
        if (apiSection) {
            apiSection.style.display = 'none';
        }
        showNotification('تم حفظ مفتاح API بنجاح', 'success');
    } else {
        showNotification('الرجاء إدخال مفتاح API صحيح', 'error');
    }
}

if (saveApiKeyBtn) {
    saveApiKeyBtn.addEventListener('click', saveApiKey);
}

// عرض/إخفاء مفتاح API
if (toggleApiKeyBtn) {
    // إخفاء زر عرض المفتاح لمنع إظهاره
    toggleApiKeyBtn.style.display = 'none';
}

// دالة لإرسال طلبات API
async function makeAPIRequest(endpoint, payload) {
    showLoading();

    try {
        const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = errorData.error ? errorData.error.message : 'حدث خطأ في الاتصال بالخادم';
            
            // استخدام دالة معالجة الأخطاء العامة إذا كانت متاحة
            if (typeof handleApiError === 'function') {
                handleApiError(new Error(errorMessage));
            }
            
            throw new Error(errorMessage);
        }

        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        
        // استخدام دالة معالجة الأخطاء العامة إذا كانت متاحة
        if (typeof handleApiError === 'function') {
            handleApiError(error);
        }
        
        throw error;
    } finally {
        hideLoading();
    }
}

// التحقق من وجود مفتاح API
function checkApiKey() {
    // محاولة تحميل مفتاح API من متغيرات البيئة أولاً
    loadApiKeyFromEnv();
    
    if (!apiKey) {
        showNotification('الرجاء إدخال مفتاح OpenAI API أولاً', 'warning');
        // على GitHub Pages اعرض نافذة إدخال المفتاح عند الحاجة
        if (typeof showApiKeyInputModal === 'function') {
            try { showApiKeyInputModal(); } catch (_) {}
        }
        return false;
    }
    return true;
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

    if (!checkApiKey()) return;

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
        showNotification(error.message, 'error');
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

    if (!checkApiKey()) return;

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
        showNotification(error.message, 'error');
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

    if (!checkApiKey()) return;

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
        showNotification(error.message, 'error');
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
                'Authorization': `Bearer ${apiKey}`
            },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = errorData.error ? errorData.error.message : 'حدث خطأ في الاتصال بالخادم';
            
            // استخدام دالة معالجة الأخطاء العامة إذا كانت متاحة
            if (typeof handleApiError === 'function') {
                handleApiError(new Error(errorMessage));
            }
            
            throw new Error(errorMessage);
        }

        const data = await response.json();
        speechResult.innerHTML = `<div class="result">${data.text}</div>`;
    } catch (error) {
        speechResult.innerHTML = `<div class="error">⚠ خطأ: ${error.message}</div>`;
        showNotification(error.message, 'error');
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

    if (!checkApiKey()) return;

    try {
        const response = await fetch(`${API_BASE_URL}/audio/speech`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'tts-1',
                voice: 'nova',
                input: text
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = errorData.error ? errorData.error.message : 'حدث خطأ في الاتصال بالخادم';
            
            // استخدام دالة معالجة الأخطاء العامة إذا كانت متاحة
            if (typeof handleApiError === 'function') {
                handleApiError(new Error(errorMessage));
            }
            
            throw new Error(errorMessage);
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        ttsResult.innerHTML = `<audio src="${audioUrl}" controls autoplay></audio>`;
    } catch (error) {
        ttsResult.innerHTML = `<div class="error">⚠ خطأ: ${error.message}</div>`;
        showNotification(error.message, 'error');
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
        showNotification('الرجاء اختيار صورة أولاً', 'warning');
        return;
    }

    if (!checkApiKey()) return;

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
                showNotification(error.message, 'error');
            }
        };
        reader.readAsDataURL(file);
    } catch (error) {
        analysisResult.innerHTML = `<div class="error">⚠ خطأ: ${error.message}</div>`;
        showNotification(error.message, 'error');
    }
});

// ===== وظائف تحليل المشاعر =====
const sentimentText = document.getElementById('sentiment-text');
const analyzeSentimentBtn = document.getElementById('analyze-sentiment-btn');
const sentimentResult = document.getElementById('sentiment-result');
const charCount = document.getElementById('char-count');
const wordCount = document.getElementById('word-count');
const sentimentOptions = document.querySelectorAll('.option-card[data-option]');
const reanalyzeEmotionBtn = document.getElementById('reanalyze-emotion-btn');
let selectedAnalysisType = 'basic';

// إضافة وظيفة لزر إعادة التحليل
if (reanalyzeEmotionBtn) {
    reanalyzeEmotionBtn.addEventListener('click', () => {
        // إخفاء النتائج الحالية
        const emotionResults = document.querySelector('.emotion-results');
        if (emotionResults) {
            emotionResults.style.display = 'none';
        }

        // إظهار العنصر النائب
        const placeholder = sentimentResult.querySelector('.placeholder');
        if (placeholder) {
            placeholder.style.display = 'block';
        }

        // التمرير إلى الأعلى
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// عداد الأحرف والكلمات
sentimentText.addEventListener('input', () => {
    const text = sentimentText.value;
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;

    charCount.textContent = `${chars} / 5000`;
    wordCount.textContent = `${words} كلمة`;
});

// اختيار نوع التحليل
sentimentOptions.forEach(option => {
    option.addEventListener('click', () => {
        sentimentOptions.forEach(opt => opt.classList.remove('active'));
        option.classList.add('active');
        selectedAnalysisType = option.getAttribute('data-option');
    });
});

// تحليل المشاعر
analyzeSentimentBtn.addEventListener('click', async () => {
    const text = sentimentText.value.trim();
    if (!text) {
        showNotification('الرجاء إدخال نص لتحليله', 'warning');
        return;
    }

    if (!checkApiKey()) return;

    // تعطيل الزر وإظهار حالة التحميل
    analyzeSentimentBtn.disabled = true;
    analyzeSentimentBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التحليل...';

    try {
        let prompt;

        // تحديد نوع التحليل حسب الخيار المحدد
        if (selectedAnalysisType === 'basic') {
            prompt = `قم بتحليل المشاعر في النص التالي بدقة عالية. حدد نسب المشاعر الثلاثة الرئيسية: الإيجابية، السلبية، والمحايدة. يجب أن تكون النسب المئوية دقيقة ومجموعها يساوي 100% بالضبط. قدم شرحاً موجزاً للنتيجة. النص: ${text}`;
        } else if (selectedAnalysisType === 'detailed') {
            prompt = `قم بتحليل المشاعر في النص التالي بدقة فائقة. حدد نسب المشاعر التالية: السعادة، الحزن، الغضب، الخوف، المفاجأة، الاشمئزاز، الثقة، الحب، الترقب، بالإضافة إلى المشاعر الرئيسية (إيجابي، سلبي، محايد). يجب أن تكون النسب المئوية دقيقة جداً ومجموعها يساوي 100% بالضبط. قدم شرحاً مفصلاً للنتائج. النص: ${text}`;
        } else { // emotional
            prompt = `قم بتحليل المشاعر والعواطف المعقدة في النص التالي بعمق. حدد المشاعر الأساسية والثانوية، مع تقديم نسب مئوية دقيقة جداً لكل مشعر. يجب أن يكون مجموع جميع النسب 100% بالضبط. قدم تحليلاً نفسياً عميقاً للدوافع العاطفية المحتملة والانفعالات الخفية. النص: ${text}`;
        }

        const response = await makeAPIRequest('chat/completions', {
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: 'أنت محلل نفسي متخصص في تحليل المشاعر بدقة متناهية. يجب أن تقدم نتائج دقيقة بنسبة 100% ومجموع النسب المئوية يجب أن يكون 100% بالضبط. استخدم تحليلات كمية دقيقة للغاية. قدم النتائج بتنسيق JSON صالح.' },
                { role: 'user', content: prompt + '\n\nمهم جداً: قدم النتائج بتنسيق JSON فقط، بدون أي نص إضافي قبل أو بعد. يجب أن يكون مجموع جميع النسب المئوية 100% بالضبط.' }
            ],
            response_format: { type: "json_object" },
            temperature: 0.1  // تقليل العشوائية لزيادة الدقة
        });

        // استخراج محتوى JSON من الاستجابة
        let responseText = response.choices[0].message.content;

        // البحث عن محتوى JSON في الاستجابة
        let jsonMatch = responseText.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
            throw new Error('لم يتم العثور على بيانات JSON صالحة في الاستجابة');
        }

        let analysisData;
        try {
            analysisData = JSON.parse(jsonMatch[0]);

            // التحقق من صحة النسب المئوية وتصحيحها
            let totalPercentage = 0;
            let emotions = {};

            // استخلاص المشاعر والنسب
            for (const key in analysisData) {
                if (typeof analysisData[key] === 'number' && key !== 'explanation') {
                    emotions[key] = analysisData[key];
                    totalPercentage += analysisData[key];
                }
            }

            // إذا لم يكن المجموع 100%، قم بتصحيح النسب
            if (Math.abs(totalPercentage - 100) > 0.1) {
                console.warn(`مجموع النسب المئوية: ${totalPercentage}%. سيتم تصحيحها إلى 100%`);

                // تصحيح النسب لتكون مجموعها 100%
                const correctionFactor = 100 / totalPercentage;
                for (const key in emotions) {
                    emotions[key] = Math.round(emotions[key] * correctionFactor * 10) / 10;
                }

                // إعادة حساب المجموع بعد التصحيح
                let correctedTotal = 0;
                for (const key in emotions) {
                    correctedTotal += emotions[key];
                }

                // تعديل آخر لضمان أن المجموع 100%
                const diff = 100 - correctedTotal;
                if (Math.abs(diff) > 0.1) {
                    // إضافة الفرق للعنصر الأكبر
                    let maxKey = Object.keys(emotions).reduce((a, b) => emotions[a] > emotions[b] ? a : b);
                    emotions[maxKey] = Math.round((emotions[maxKey] + diff) * 10) / 10;
                }

                // تحديث بيانات التحليل
                for (const key in emotions) {
                    analysisData[key] = emotions[key];
                }
            }

            // التأكد من وجود المشاعر الرئيسية
            if (!analysisData.positive && !analysisData.negative && !analysisData.neutral) {
                // حساب المشاعر الرئيسية من المشاعر الفرعية
                let positive = 0, negative = 0, neutral = 0;

                if (analysisData.happiness || analysisData.love || analysisData.trust) {
                    positive += (analysisData.happiness || 0) + (analysisData.love || 0) + (analysisData.trust || 0);
                }

                if (analysisData.sadness || analysisData.anger || analysisData.fear || analysisData.disgust) {
                    negative += (analysisData.sadness || 0) + (analysisData.anger || 0) + (analysisData.fear || 0) + (analysisData.disgust || 0);
                }

                if (analysisData.neutral || analysisData.surprise || analysisData.anticipation) {
                    neutral += (analysisData.neutral || 0) + (analysisData.surprise || 0) + (analysisData.anticipation || 0);
                }

                // إذا لم يتم حساب أي شيء، اجعلها محايدة
                if (positive === 0 && negative === 0 && neutral === 0) {
                    neutral = 100;
                }

                // تطبيع النسب لتكون مجموعها 100%
                const total = positive + negative + neutral;
                if (total > 0) {
                    analysisData.positive = Math.round((positive / total) * 100 * 10) / 10;
                    analysisData.negative = Math.round((negative / total) * 100 * 10) / 10;
                    analysisData.neutral = Math.round((neutral / total) * 100 * 10) / 10;
                } else {
                    analysisData.positive = 33.3;
                    analysisData.negative = 33.3;
                    analysisData.neutral = 33.4;
                }
            }
        } catch (parseError) {
            console.error('Error parsing JSON:', parseError);
            throw new Error('فشل في تحليل بيانات JSON من الاستجابة');
        }

        // عرض النتائج
        sentimentResult.querySelector('.placeholder').style.display = 'none';
        sentimentResult.querySelector('.sentiment-results').style.display = 'block';

        // تحويل بيانات المشاعر إلى التنسيق المتوقع من ملخص المشاعر
        const emotionsData = {
            happy: analysisData.happiness || 0,
            sad: analysisData.sadness || 0,
            angry: analysisData.anger || 0,
            surprised: analysisData.surprise || 0,
            neutral: analysisData.neutral || 0,
            fearful: analysisData.fear || 0,
            disgusted: analysisData.disgust || 0
        };

        // تهيئة ملخص المشاعر إذا لم يكن مهيأً بالفعل
        let sentimentSummary = window.sentimentSummary;
        if (!sentimentSummary) {
            sentimentSummary = new SentimentSummary('sentiment-summary-container');
            window.sentimentSummary = sentimentSummary;
        }

        // تحديث ملخص المشاعر بالبيانات الجديدة
        if (sentimentSummary && typeof sentimentSummary.updateEmotions === 'function') {
            sentimentSummary.updateEmotions(emotionsData);
        }

        // تحديث متغيرات CSS للدائرة
        document.documentElement.style.setProperty('--sentiment-positive', `${analysisData.positive}%`);
        document.documentElement.style.setProperty('--sentiment-negative', `${analysisData.negative}%`);

        // إضافة أيقونات للمشاعر
        addEmotionIcons();

        // إضافة أيقونات للاقتراحات
        addSuggestionIcons();

        // تحديث ملخص المشاعر
        const sentimentValue = document.getElementById('sentiment-value');
        const sentimentLabel = document.getElementById('sentiment-label');
        const positiveMeter = document.getElementById('positive-meter');
        const negativeMeter = document.getElementById('negative-meter');

        // تحديد المشاعر الرئيسية
        let mainSentiment, sentimentPercentage;
        if (analysisData.positive > analysisData.negative && analysisData.positive > analysisData.neutral) {
            mainSentiment = 'إيجابي';
            sentimentPercentage = analysisData.positive;
        } else if (analysisData.negative > analysisData.positive && analysisData.negative > analysisData.neutral) {
            mainSentiment = 'سلبي';
            sentimentPercentage = analysisData.negative;
        } else {
            mainSentiment = 'محايد';
            sentimentPercentage = analysisData.neutral;
        }

        if (sentimentValue) sentimentValue.textContent = `${sentimentPercentage}%`;
        if (sentimentLabel) sentimentLabel.textContent = mainSentiment;

        // تحديث أشرطة المشاعر
        if (positiveMeter && positiveMeter.style) positiveMeter.style.width = `${analysisData.positive}%`;
        if (negativeMeter && negativeMeter.style) negativeMeter.style.width = `${analysisData.negative}%`;

        // إضافة قسم النتائج المفصل
        addDetailedScores(analysisData);

        // تحديث تفاصيل المشاعر
        const emotionBars = document.querySelector('.emotion-bars');
        emotionBars.innerHTML = '';
        // اعتمد على القيم المطَبَّعة من ملخص المشاعر إن وجدت
        const normalizedEmotions = (window.sentimentSummary && window.sentimentSummary.emotions) ? window.sentimentSummary.emotions : null;
        const entriesForBars = normalizedEmotions ? Object.entries(normalizedEmotions).map(([k, e]) => [k, e.value]) : Object.entries(analysisData);
        for (const [emotion, value] of entriesForBars) {
            if (emotion !== 'explanation' && emotion !== 'suggestions' && typeof value === 'number') {
                const barContainer = document.createElement('div');
                barContainer.className = 'emotion-bar-container';

                const barLabel = document.createElement('div');
                barLabel.className = 'emotion-label';
                barLabel.textContent = emotion;

                const bar = document.createElement('div');
                bar.className = 'emotion-bar';

                const barFill = document.createElement('div');
                barFill.className = 'emotion-fill';
                barFill.style.width = `${value}%`;

                const barValue = document.createElement('div');
                barValue.className = 'emotion-value';
                barValue.textContent = `${value}%`;

                if (bar && barFill) bar.appendChild(barFill);
                if (bar && barValue) bar.appendChild(barValue);
                if (barContainer && barLabel) barContainer.appendChild(barLabel);
                if (barContainer && bar) barContainer.appendChild(bar);
                if (emotionBars && barContainer) emotionBars.appendChild(barContainer);
            }
        }

        // تحديث شرح النتائج
        const explanationText = document.getElementById('sentiment-explanation-text');
        explanationText.textContent = analysisData.explanation || 'لا يوجد شرح متاح';

        // تحديث الاقتراحات
        const suggestionsText = document.getElementById('sentiment-suggestions-text');
        suggestionsText.innerHTML = '';

        if (analysisData.suggestions && Array.isArray(analysisData.suggestions)) {
            analysisData.suggestions.forEach(suggestion => {
                const suggestionItem = document.createElement('div');
                suggestionItem.className = 'suggestion-item';
                suggestionItem.textContent = suggestion;
                if (suggestionsText && suggestionItem) suggestionsText.appendChild(suggestionItem);
            });
        }

        // إعادة تعيين زر التحليل بعد اكتمال التحليل بنجاح
        if (analyzeSentimentBtn) {
            analyzeSentimentBtn.disabled = false;
            analyzeSentimentBtn.innerHTML = '<i class="fas fa-brain"></i> تحليل مشاعر النص';
        }

    } catch (error) {
        console.error('Error analyzing sentiment:', error);
        showNotification(`حدث خطأ في تحليل المشاعر: ${error.message}`, 'error');

        // عرض رسالة خطأ في منطقة النتائج
        sentimentResult.querySelector('.placeholder').style.display = 'none';
        sentimentResult.querySelector('.sentiment-results').style.display = 'none';
        sentimentResult.innerHTML = `<div class="error">⚠ خطأ في تحليل المشاعر: ${error.message}</div>`;
    } finally {
        // إعادة تعيين زر التحليل
        if (analyzeSentimentBtn) {
            analyzeSentimentBtn.disabled = false;
            analyzeSentimentBtn.innerHTML = '<i class="fas fa-brain"></i> تحليل مشاعر النص';
        }
    }
});

// دوال مساعدة لتحليل المشاعر

// إضافة أيقونات للمشاعر
function addEmotionIcons() {
    const emotionLabels = document.querySelectorAll('.emotion-label');

    emotionLabels.forEach(label => {
        const emotionName = label.textContent.trim();
        let iconClass = '';

        // تحديد الأيقونة حسب نوع المشاعر
        if (emotionName.includes('سعادة') || emotionName.includes('فرح')) {
            iconClass = 'fa-smile';
        } else if (emotionName.includes('حزن')) {
            iconClass = 'fa-sad-tear';
        } else if (emotionName.includes('غضب')) {
            iconClass = 'fa-angry';
        } else if (emotionName.includes('خوف')) {
            iconClass = 'fa-grimace';
        } else if (emotionName.includes('مفاجأة')) {
            iconClass = 'fa-surprise';
        } else if (emotionName.includes('اشمئزاز')) {
            iconClass = 'fa-tired';
        } else if (emotionName.includes('حب')) {
            iconClass = 'fa-heart';
        } else if (emotionName.includes('ثقة')) {
            iconClass = 'fa-handshake';
        } else if (emotionName.includes('ترقب')) {
            iconClass = 'fa-clock';
        } else {
            iconClass = 'fa-meh';
        }

        // إنشاء عنصر الأيقونة إذا لم يكن موجودًا
        if (!label.querySelector('.emotion-icon')) {
            const icon = document.createElement('div');
            icon.className = 'emotion-icon fas ' + iconClass;
            label.insertBefore(icon, label.firstChild);
        }
    });
}

// إضافة أيقونات للاقتراحات
function addSuggestionIcons() {
    const suggestionsContainer = document.querySelector('.sentiment-suggestions-text');

    if (!suggestionsContainer) return;

    // تحويل النص إلى حاوية منظم
    if (!suggestionsContainer.classList.contains('suggestions-container')) {
        const suggestions = suggestionsContainer.textContent.trim().split(/\d+\.\s*/).filter(s => s.trim());
        suggestionsContainer.innerHTML = '';
        suggestionsContainer.classList.add('suggestions-container');

        suggestions.forEach((suggestion, index) => {
            if (suggestion.trim()) {
                const item = document.createElement('div');
                item.className = 'suggestion-item';

                const icon = document.createElement('div');
                icon.className = 'suggestion-icon fas fa-lightbulb';

                const content = document.createElement('div');
                content.className = 'suggestion-content';
                content.textContent = suggestion.trim();

                if (item && icon) item.appendChild(icon);
                if (item && content) item.appendChild(content);
                if (suggestionsContainer && item) suggestionsContainer.appendChild(item);
            }
        });
    }
}

// إضافة قسم النتائج المفصل
function addDetailedScores(analysisData) {
    // التحقق من وجود قسم النتائج المفصل
    let scoresContainer = document.querySelector('.sentiment-score');

    // إنشاء قسم النتائج المفصل إذا لم يكن موجودًا
    if (!scoresContainer) {
        scoresContainer = document.createElement('div');
        scoresContainer.className = 'sentiment-score';

        // إضافة القسم بعد ملخص المشاعر
        const sentimentSummary = document.querySelector('.sentiment-summary');
        if (sentimentSummary && scoresContainer) sentimentSummary.appendChild(scoresContainer);
    }

    // تفريغ الحاوية
    scoresContainer.innerHTML = '';

    // إنشاء عناصر النتائج
    const positiveScore = document.createElement('div');
    positiveScore.className = 'sentiment-score-item positive-score';

    const positiveValue = document.createElement('div');
    positiveValue.className = 'sentiment-score-value';
    positiveValue.textContent = `${analysisData.positive}%`;

    const positiveLabel = document.createElement('div');
    positiveLabel.className = 'sentiment-score-label';
    positiveLabel.textContent = 'إيجابي';

    if (positiveScore && positiveValue) positiveScore.appendChild(positiveValue);
    if (positiveScore && positiveLabel) positiveScore.appendChild(positiveLabel);

    const negativeScore = document.createElement('div');
    negativeScore.className = 'sentiment-score-item negative-score';

    const negativeValue = document.createElement('div');
    negativeValue.className = 'sentiment-score-value';
    negativeValue.textContent = `${analysisData.negative}%`;

    const negativeLabel = document.createElement('div');
    negativeLabel.className = 'sentiment-score-label';
    negativeLabel.textContent = 'سلبي';

    if (negativeScore && negativeValue) negativeScore.appendChild(negativeValue);
    if (negativeScore && negativeLabel) negativeScore.appendChild(negativeLabel);

    const neutralScore = document.createElement('div');
    neutralScore.className = 'sentiment-score-item neutral-score';

    const neutralValue = document.createElement('div');
    neutralValue.className = 'sentiment-score-value';
    neutralValue.textContent = `${analysisData.neutral}%`;

    const neutralLabel = document.createElement('div');
    neutralLabel.className = 'sentiment-score-label';
    neutralLabel.textContent = 'محايد';

    if (neutralScore && neutralValue) neutralScore.appendChild(neutralValue);
    if (neutralScore && neutralLabel) neutralScore.appendChild(neutralLabel);

    // إضافة العناصر إلى الحاوية
    if (scoresContainer && positiveScore) scoresContainer.appendChild(positiveScore);
    if (scoresContainer && negativeScore) scoresContainer.appendChild(negativeScore);
    if (scoresContainer && neutralScore) scoresContainer.appendChild(neutralScore);
}

// نموذج الاتصال
const contactForm = document.getElementById('contactForm');
contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    showNotification('تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.', 'success');
    contactForm.reset();
});

// تهيئة الصفحة
window.addEventListener('load', () => {
    // تحميل مفتاح API من متغيرات البيئة
    loadApiKeyFromEnv();
    
    // تعيين قيمة مفتاح API إذا كان موجودًا
    if (apiKey) {
        if (apiKeyInput) {
            apiKeyInput.value = '';
            apiKeyInput.placeholder = 'تم حفظ المفتاح في المتصفح';
        }
        if (apiSection) {
            apiSection.style.display = 'none';
        }
    }

    // إضافة رسالة ترحيب في الدردشة
    addMessage('مرحباً! أنا مساعدك الذكي متعدد الوسائط. كيف يمكنني مساعدتك اليوم؟');

    // تفعيل التلميحات (tippy.js)
    if (typeof tippy !== 'undefined') {
        tippy('[data-tippy-content]', {
            theme: 'glass',
            animation: 'shift-away',
            placement: 'bottom'
        });
    }
});

// معالجة الأخطاء العامة
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    
    // التحقق إذا كان الخطأ يتعلق بمفتاح API
    if (e.error && e.error.message && e.error.message.includes('Incorrect API key')) {
        if (typeof handleApiError === 'function') {
            handleApiError(e.error);
            return;
        }
    }
    
    showNotification('حدث خطأ غير متوقع. يرجى تحديث الصفحة والمحاولة مرة أخرى.', 'error');
});
