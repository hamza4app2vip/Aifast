
// واجهة مستخدم تحليل المشاعر
// يتعامل مع تفاعلات المستخدم مع واجهة تحليل المشاعر

// متغيرات عامة
let currentEmotionTab = 'text';
let emotionChart = null;

// تهيئة واجهة تحليل المشاعر
document.addEventListener('DOMContentLoaded', function() {
    // تهيئة تبويبات تحليل المشاعر
    initEmotionTabs();

    // تهيئة أحداث تحليل النصوص
    initTextEmotionEvents();

    // تهيئة أحداث تحليل الوجوه
    initFaceEmotionEvents();

    // تهيئة أحداث تحليل الصوت
    initAudioEmotionEvents();

    // تهيئة الرسم البياني للمشاعر
    initEmotionChart();
});

// تهيئة تبويبات تحليل المشاعر
function initEmotionTabs() {
    const tabButtons = document.querySelectorAll('.emotion-tab-btn');
    const tabContents = document.querySelectorAll('.emotion-tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // إزالة الفئة النشطة من جميع الأزرار والمحتويات
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // إضافة الفئة النشطة للزر المضغوط عليه والمحتوى المقابل
            this.classList.add('active');
            const tabId = this.getAttribute('data-emotion-tab');
            document.getElementById(`emotion-${tabId}`).classList.add('active');

            // تحديث التبويب الحالي
            currentEmotionTab = tabId;
        });
    });
}

// تهيئة أحداث تحليل النصوص
function initTextEmotionEvents() {
    const analyzeBtn = document.getElementById('analyze-text-emotion-btn');
    const textInput = document.getElementById('sentiment-text');
    const charCount = document.getElementById('char-count');
    const wordCount = document.getElementById('word-count');

    // تحديث عداد الأحرف والكلمات
    if (textInput) {
        textInput.addEventListener('input', function() {
            const text = this.value;
            const chars = text.length;
            const words = text.trim() ? text.trim().split(/\s+/).length : 0;

            if (charCount) charCount.textContent = `${chars} / 5000`;
            if (wordCount) wordCount.textContent = `${words} كلمة`;
        });
    }

    // تحليل النص عند الضغط على الزر
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', async function() {
            const text = textInput.value.trim();

            if (!text) {
                showNotification('الرجاء إدخال نص للتحليل', 'warning');
                return;
            }

            if (text.length > 5000) {
                showNotification('النص طويل جدًا، الرجاء إدخال نص أقل من 5000 حرف', 'warning');
                return;
            }

            // عرض شاشة التحميل
            showLoading();

            try {
                // تحليل المشاعر من النص
                const result = await window.emotionAnalysis.analyzeText(text);

                // عرض النتائج
                displayEmotionResults(result, 'text');

                // إخفاء شاشة التحميل
                hideLoading();

                // عرض إشعار النجاح
                showNotification('تم تحليل مشاعر النص بنجاح', 'success');
            } catch (error) {
                console.error('Error analyzing text emotion:', error);
                hideLoading();
                showNotification(' ' + error.message, 'error');
            }
        });
    }
}

// تهيئة أحداث تحليل الوجوه
function initFaceEmotionEvents() {
    const uploadInput = document.getElementById('emotion-face-upload');
    const previewImg = document.getElementById('emotion-face-preview');
    const fileName = document.getElementById('emotion-face-file-name');
    const analyzeBtn = document.getElementById('analyze-face-emotion-btn');

    // معالجة اختيار الملف
    if (uploadInput) {
        uploadInput.addEventListener('change', function() {
            const file = this.files[0];

            if (file) {
                // التحقق من نوع الملف
                if (!file.type.startsWith('image/')) {
                    showNotification('الرجاء اختيار ملف صورة صالح', 'warning');
                    this.value = '';
                    return;
                }

                // التحقق من حجم الملف (10MB كحد أقصى)
                if (file.size > 10 * 1024 * 1024) {
                    showNotification('حجم الملف كبير جدًا، الرجاء اختيار صورة أصغر من 10 ميجابايت', 'warning');
                    this.value = '';
                    return;
                }

                // عرض اسم الملف
                if (fileName) fileName.textContent = file.name;

                // قراءة وعرض الصورة
                const reader = new FileReader();
                reader.onload = function(e) {
                    if (previewImg) {
                        previewImg.src = e.target.result;
                        previewImg.style.display = 'block';
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // تحليل الصورة عند الضغط على الزر
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', async function() {
            if (!uploadInput.files || !uploadInput.files[0]) {
                showNotification('الرجاء اختيار صورة للتحليل', 'warning');
                return;
            }

            if (!previewImg.src || previewImg.style.display === 'none') {
                showNotification('الرجاء انتظار تحميل الصورة', 'warning');
                return;
            }

            // عرض شاشة التحميل
            showLoading();

            try {
                // تحليل المشاعر من الصورة
                const result = await window.emotionAnalysis.analyzeFace(previewImg);

                // عرض النتائج
                displayEmotionResults(result, 'face');

                // إخفاء شاشة التحميل
                hideLoading();

                // عرض إشعار النجاح
                showNotification('تم تحليل مشاعر الوجه بنجاح', 'success');
            } catch (error) {
                console.error('Error analyzing face emotion:', error);
                hideLoading();
                showNotification('فشل تحليل مشاعر الوجه: ' + error.message, 'error');
            }
        });
    }
}

// تهيئة أحداث تحليل الصوت
function initAudioEmotionEvents() {
    const recordBtn = document.getElementById('emotion-record-btn');
    const uploadInput = document.getElementById('emotion-audio-upload');
    const audioPlayer = document.getElementById('emotion-audio-player');
    const audioContainer = document.querySelector('.audio-player-container');
    const fileName = document.getElementById('emotion-audio-file-name');
    const analyzeBtn = document.getElementById('analyze-audio-emotion-btn');
    const clearBtn = document.getElementById('clear-audio-btn');

    let mediaRecorder;
    let audioChunks = [];
    let isRecording = false;

    // معالجة التسجيل
    if (recordBtn) {
        recordBtn.addEventListener('click', async function() {
            if (!isRecording) {
                try {
                    // طلب الإذن للوصول إلى الميكروفون
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

                    // تهيئة مسجل الصوت
                    mediaRecorder = new MediaRecorder(stream);
                    audioChunks = [];

                    mediaRecorder.ondataavailable = function(event) {
                        audioChunks.push(event.data);
                    };

                    mediaRecorder.onstop = function() {
                        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                        const audioUrl = URL.createObjectURL(audioBlob);

                        // عرض مشغل الصوت
                        if (audioPlayer) {
                            audioPlayer.src = audioUrl;
                            if (audioContainer) audioContainer.style.display = 'flex';
                        }

                        // تحديث زر التسجيل
                        recordBtn.innerHTML = '<i class="fas fa-stop"></i> إيقاف التسجيل';
                        recordBtn.classList.add('recording');

                        // إيقاف جميع مسارات الصوت
                        stream.getTracks().forEach(track => track.stop());
                    };

                    // بدء التسجيل
                    mediaRecorder.start();
                    isRecording = true;

                    // تحديث واجهة المستخدم
                    recordBtn.innerHTML = '<i class="fas fa-stop"></i> إيقاف التسجيل';
                    recordBtn.classList.add('recording');

                } catch (error) {
                    console.error('Error accessing microphone:', error);
                    showNotification('فشل الوصول إلى الميكروفون: ' + error.message, 'error');
                }
            } else {
                // إيقاف التسجيل
                if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                    mediaRecorder.stop();
                    isRecording = false;

                    // تحديث واجهة المستخدم
                    recordBtn.innerHTML = '<i class="fas fa-microphone"></i> ابدأ التسجيل';
                    recordBtn.classList.remove('recording');
                }
            }
        });
    }

    // معالجة مسح الصوت
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            if (audioPlayer) {
                audioPlayer.src = '';
                if (audioContainer) audioContainer.style.display = 'none';
            }
        });
    }

    // معالجة اختيار الملف
    if (uploadInput) {
        uploadInput.addEventListener('change', function() {
            const file = this.files[0];

            if (file) {
                // التحقق من نوع الملف
                if (!file.type.startsWith('audio/')) {
                    showNotification('الرجاء اختيار ملف صوتي صالح', 'warning');
                    this.value = '';
                    return;
                }

                // التحقق من حجم الملف (20MB كحد أقصى)
                if (file.size > 20 * 1024 * 1024) {
                    showNotification('حجم الملف كبير جدًا، الرجاء اختيار ملف أصغر من 20 ميجابايت', 'warning');
                    this.value = '';
                    return;
                }

                // عرض اسم الملف
                if (fileName) fileName.textContent = file.name;

                // قراءة وتشغيل الصوت
                const reader = new FileReader();
                reader.onload = function(e) {
                    if (audioPlayer) {
                        audioPlayer.src = e.target.result;
                        if (audioContainer) audioContainer.style.display = 'flex';
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // تحليل الصوت عند الضغط على الزر
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', async function() {
            // التحقق من وجود صوت
            if (!audioPlayer.src) {
                showNotification('الرجاء تسجيل أو اختيار ملف صوتي للتحليل', 'warning');
                return;
            }

            // عرض شاشة التحميل
            showLoading();

            try {
                // تحليل المشاعر من الصوت
                const result = await window.emotionAnalysis.analyzeAudio(audioPlayer);

                // عرض النتائج
                displayEmotionResults(result, 'audio');

                // إخفاء شاشة التحميل
                hideLoading();

                // عرض إشعار النجاح
                showNotification('تم تحليل مشاعر الصوت بنجاح', 'success');
            } catch (error) {
                console.error('Error analyzing audio emotion:', error);
                hideLoading();
                showNotification('فشل تحليل مشاعر الصوت: ' + error.message, 'error');
            }
        });
    }
}

// تهيئة الرسم البياني للمشاعر
function initEmotionChart() {
    const ctx = document.getElementById('emotion-chart');

    if (ctx) {
        emotionChart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['سعادة', 'حزن', 'غضب', 'خوف', 'مفاجأة', 'اشمئزاز', 'محايد'],
                datasets: [{
                    label: 'مستوى المشاعر',
                    data: [0, 0, 0, 0, 0, 0, 0],
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(54, 162, 235, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(54, 162, 235, 1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: {
                            display: true,
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        pointLabels: {
                            color: '#ddd',
                            font: {
                                size: 12
                            }
                        },
                        ticks: {
                            backdropColor: 'transparent',
                            color: '#aaa'
                        },
                        suggestedMin: 0,
                        suggestedMax: 1
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }
}

// عرض نتائج تحليل المشاعر
function displayEmotionResults(result, source) {
    const resultContainer = document.getElementById('emotion-result');
    const resultsDiv = document.querySelector('.emotion-results');

    if (!resultContainer || !resultsDiv) return;

    // إخفاء العنصر النائب وإظهار النتائج
    const placeholder = resultContainer.querySelector('.placeholder');
    if (placeholder) placeholder.style.display = 'none';
    resultsDiv.style.display = 'block';

    // تحديث نوع التحليل
    const resultType = document.getElementById('result-type');
    if (resultType) {
        let typeText = 'نتيجة التحليل:';
        if (source === 'text') typeText = 'نتيجة تحليل النص:';
        else if (source === 'face') typeText = 'نتيجة تحليل الوجه:';
        else if (source === 'audio') typeText = 'نتيجة تحليل الصوت:';

        resultType.textContent = typeText;
    }

    // تحديث المشاعر المسيطرة
    const emotionValue = document.getElementById('emotion-value');
    if (emotionValue && result.emotion) {
        emotionValue.textContent = getEmotionNameInArabic(result.emotion);
    }

    // تحديث مستوى الثقة
    const confidenceValue = document.getElementById('confidence-value');
    const confidenceProgress = document.getElementById('confidence-progress');
    if (confidenceValue && confidenceProgress && result.confidence) {
        const confidencePercent = Math.round(result.confidence * 100);
        confidenceValue.textContent = `${confidencePercent}%`;
        confidenceProgress.style.width = `${confidencePercent}%`;
    }

    // تحديث الرسم البياني
    if (emotionChart && result.scores) {
        emotionChart.data.datasets[0].data = [
            result.scores.happy || 0,
            result.scores.sad || 0,
            result.scores.angry || 0,
            result.scores.fearful || 0,
            result.scores.surprised || 0,
            result.scores.disgusted || 0,
            result.scores.neutral || 0
        ];
        emotionChart.update();
    }

    // تحديث شرح النتائج
    const explanationText = document.getElementById('emotion-explanation-text');
    if (explanationText && result.explanation) {
        explanationText.textContent = result.explanation;
    }

    // تحديث الاقتراحات
    const suggestionsText = document.getElementById('emotion-suggestions-text');
    if (suggestionsText && result.suggestions) {
        suggestionsText.innerHTML = '';

        result.suggestions.forEach(suggestion => {
            const suggestionItem = document.createElement('div');
            suggestionItem.className = 'suggestion-item';
            suggestionItem.textContent = suggestion;
            suggestionsText.appendChild(suggestionItem);
        });
    }

    // التمرير إلى نتائج التحليل
    resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// الحصول على اسم المشاعر باللغة العربية
function getEmotionNameInArabic(emotion) {
    const emotions = {
        'happy': 'سعادة',
        'sad': 'حزن',
        'angry': 'غضب',
        'fearful': 'خوف',
        'surprised': 'مفاجأة',
        'disgusted': 'اشمئزاز',
        'neutral': 'محايد'
    };

    return emotions[emotion] || emotion;
}

// وظائف مساعدة للواجهة
function showLoading() {
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'flex';
}

function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'none';
}

function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notification-text');

    if (notification && notificationText) {
        notificationText.textContent = message;

        // إزالة جميع الفئات
        notification.classList.remove('info', 'success', 'warning', 'error');

        // إضافة الفئة المناسبة
        notification.classList.add(type);

        // عرض الإشعار
        notification.style.display = 'flex';

        // إخفاء الإشعار تلقائيًا بعد 5 ثوانٍ
        setTimeout(() => {
            notification.style.display = 'none';
        }, 5000);
    }
}
