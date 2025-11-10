
// معالج أحداث تحليل المشاعر
// يتعامل مع أزرار تحليل المشاعر من النصوص والوجوه والصوت

document.addEventListener('DOMContentLoaded', function() {
    // تهيئة أحداث تبويبات تحليل المشاعر
    initEmotionTabEvents();

    // تهيئة أحداث تحليل النصوص
    initTextEmotionEvents();

    // تهيئة أحداث تحليل الوجوه
    initFaceEmotionEvents();

    // تهيئة أحداث تحليل الصوت
    initAudioEmotionEvents();
});

// تهيئة أحداث تبويبات تحليل المشاعر
function initEmotionTabEvents() {
    const tabButtons = document.querySelectorAll('.emotion-tab-btn');

    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // إزالة الفئة النشطة من جميع الأزرار والمحتويات
            tabButtons.forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.emotion-tab-content').forEach(content => content.classList.remove('active'));

            // إضافة الفئة النشطة للزر المضغوط عليه والمحتوى المقابل
            this.classList.add('active');
            const tabId = this.getAttribute('data-emotion-tab');
            document.getElementById(`emotion-${tabId}`).classList.add('active');
        });
    });
}

// تهيئة أحداث تحليل النصوص
function initTextEmotionEvents() {
    const analyzeBtn = document.getElementById('analyze-text-emotion-btn');

    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', function() {
            const textInput = document.getElementById('sentiment-text');
            const text = textInput.value.trim();

            if (!text) {
                showNotification('الرجاء إدخال نص للتحليل', 'warning');
                return;
            }

            if (!window.checkApiKey()) return;

            // استدعاء دالة تحليل النصوص الموجودة في ai-assistant-new.js
            const originalAnalyzeBtn = document.getElementById('analyze-sentiment-btn');
            if (originalAnalyzeBtn) {
                originalAnalyzeBtn.click();
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

            if (!window.checkApiKey()) return;

            // عرض شاشة التحميل
            showLoading();

            try {
                // تحليل المشاعر من الصورة
                if (window.emotionAnalysis && window.emotionAnalysis.analyzeFace) {
                    // تعيين مفتاح API
                    window.emotionAnalysisAPI_KEY = localStorage.getItem('openai_api_key');
                    const result = await window.emotionAnalysis.analyzeFace(previewImg);

                    // عرض النتائج
                    displayEmotionResults(result, 'face');

                    // إخفاء شاشة التحميل
                    hideLoading();

                    // عرض إشعار النجاح
                    showNotification('تم تحليل مشاعر الوجه بنجاح', 'success');
                } else {
                    throw new Error('وحدة تحليل مشاعر الوجه غير متاحة');
                }
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

            if (!window.checkApiKey()) return;

            // عرض شاشة التحميل
            showLoading();

            try {
                // تحليل المشاعر من الصوت
                if (window.audioEmotionAnalysis && window.audioEmotionAnalysis.analyze) {
                    const result = await window.audioEmotionAnalysis.analyze(audioPlayer);

                    // عرض النتائج
                    displayEmotionResults(result, 'audio');

                    // إخفاء شاشة التحميل
                    hideLoading();

                    // عرض إشعار النجاح
                    showNotification('تم تحليل مشاعر الصوت بنجاح', 'success');
                } else {
                    throw new Error('وحدة تحليل مشاعر الصوت غير متاحة');
                }
            } catch (error) {
                console.error('Error analyzing audio emotion:', error);
                hideLoading();
                showNotification('فشل تحليل مشاعر الصوت: ' + error.message, 'error');
            }
        });
    }
}

// عرض نتائج تحليل المشاعر
function displayEmotionResults(result, type) {
    const resultContainer = document.getElementById('emotion-result');

    if (!resultContainer) return;

    // إخفاء العنصر النائب
    const placeholder = resultContainer.querySelector('.placeholder');
    if (placeholder) placeholder.style.display = 'none';

    // إظهار حاوية النتائج
    let resultsContainer = resultContainer.querySelector('.emotion-results');
    if (!resultsContainer) {
        resultsContainer = document.createElement('div');
        resultsContainer.className = 'emotion-results';
        resultContainer.appendChild(resultsContainer);
    }
    resultsContainer.style.display = 'block';

    // تحديث نوع التحليل
    const resultType = document.getElementById('result-type');
    if (resultType) {
        if (type === 'text') resultType.textContent = 'نتيجة تحليل النص:';
        else if (type === 'face') resultType.textContent = 'نتيجة تحليل الوجه:';
        else if (type === 'audio') resultType.textContent = 'نتيجة تحليل الصوت:';
    }

    // تحديث المشاعر المسيطرة
    const emotionValue = document.getElementById('emotion-value');
    if (emotionValue && result.emotion) {
        emotionValue.textContent = result.emotion;
    }

    // تحديث مستوى الثقة
    const confidenceValue = document.getElementById('confidence-value');
    const confidenceProgress = document.getElementById('confidence-progress');
    if (confidenceValue && result.confidence) {
        confidenceValue.textContent = `${Math.round(result.confidence * 100)}%`;
    }
    if (confidenceProgress && result.confidence) {
        confidenceProgress.style.width = `${Math.round(result.confidence * 100)}%`;
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

    // إنشاء أو تحديث الرسم البياني للمشاعر
    if (result.scores) {
        createEmotionChart(result.scores);
    }
}

// إنشاء رسم بياني للمشاعر
function createEmotionChart(scores) {
    const chartContainer = document.getElementById('emotion-chart');
    if (!chartContainer) return;

    // تدمير الرسم البياني القديم إذا كان موجودًا
    if (window.emotionChart) {
        window.emotionChart.destroy();
    }

    // إعداد البيانات للرسم البياني
    const labels = Object.keys(scores);
    const data = Object.values(scores);

    // إنشاء الرسم البياني
    const ctx = chartContainer.getContext('2d');
    window.emotionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'مستوى المشاعر',
                data: data,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(153, 102, 255, 0.6)',
                    'rgba(255, 159, 64, 0.6)',
                    'rgba(199, 199, 199, 0.6)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)',
                    'rgba(199, 199, 199, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.raw.toFixed(1) + '%';
                        }
                    }
                }
            }
        }
    });
}
