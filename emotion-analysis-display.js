
// عرض نتائج تحليل المشاعر
// يعرض نتائج تحليل المشاعر من النصوص والوجوه والصوت

// عرض نتائج تحليل المشاعر
function displayEmotionResults(result, source) {
    // الحصول على حاوية النتائج
    const resultContainer = document.getElementById('emotion-result');

    if (!resultContainer) {
        console.error('Result container not found');
        return;
    }

    // إخفاء العنصر النائب
    const placeholder = resultContainer.querySelector('.placeholder');
    if (placeholder) placeholder.style.display = 'none';

    // عرض حاوية النتائج
    const resultsContainer = resultContainer.querySelector('.emotion-results');
    if (resultsContainer) resultsContainer.style.display = 'block';

    // تحديث نوع التحليل
    const resultType = document.getElementById('result-type');
    if (resultType) {
        let typeText = '';
        if (source === 'text') typeText = 'تحليل مشاعر النص';
        else if (source === 'face') typeText = 'تحليل مشاعر الوجه';
        else if (source === 'audio') typeText = 'تحليل مشاعر الصوت';

        resultType.textContent = typeText;
    }

    // تحديث المشاعر المهيمنة
    const emotionValue = document.getElementById('emotion-value');
    if (emotionValue && result.emotion) {
        emotionValue.textContent = getEmotionNameInArabic(result.emotion);
    }

    // تحديث مستوى الثقة
    const confidenceValue = document.getElementById('confidence-value');
    const confidenceProgress = document.getElementById('confidence-progress');

    if (confidenceValue && result.confidence !== undefined) {
        const confidencePercent = Math.round(result.confidence * 100);
        confidenceValue.textContent = `${confidencePercent}%`;

        if (confidenceProgress) {
            confidenceProgress.style.width = `${confidencePercent}%`;

            // تغيير اللون حسب مستوى الثقة
            if (confidencePercent >= 80) {
                confidenceProgress.style.backgroundColor = '#4CAF50'; // أخضر
            } else if (confidencePercent >= 60) {
                confidenceProgress.style.backgroundColor = '#FFC107'; // أصفر
            } else {
                confidenceProgress.style.backgroundColor = '#F44336'; // أحمر
            }
        }
    }

    // تحديث الرسم البياني للمشاعر
    updateEmotionChart(result);

    // تحديث شرح النتائج
    const explanationText = document.getElementById('emotion-explanation-text');
    if (explanationText && result.explanation) {
        explanationText.textContent = result.explanation;
    }

    // تحديث الاقتراحات
    updateSuggestions(result);
}

// تحويل اسم المشاعر إلى العربية
function getEmotionNameInArabic(emotion) {
    const emotionMap = {
        'happy': 'سعادة',
        'sad': 'حزن',
        'angry': 'غضب',
        'surprised': 'مفاجأة',
        'fearful': 'خوف',
        'disgusted': 'اشمئزاز',
        'neutral': 'محايد',
        'love': 'حب',
        'trust': 'ثقة',
        'anticipation': 'ترقب'
    };

    return emotionMap[emotion] || emotion;
}

// تحديث الرسم البياني للمشاعر
function updateEmotionChart(result) {
    const canvas = document.getElementById('emotion-chart');

    if (!canvas) return;

    // تدمج النتائج في تنسيق موحد
    let emotionsData = {};

    if (result.scores && typeof result.scores === 'object') {
        emotionsData = result.scores;
    } else if (result.emotion && result.confidence) {
        // إنشاء بيانات من مشاعر واحد
        emotionsData[result.emotion] = result.confidence;

        // إضافة مشاعر أخرى بقيم منخفضة
        const commonEmotions = ['happy', 'sad', 'angry', 'surprised', 'fearful', 'disgusted', 'neutral'];
        commonEmotions.forEach(emotion => {
            if (!emotionsData[emotion]) {
                emotionsData[emotion] = Math.random() * 0.2; // قيم عشوائية منخفضة
            }
        });

        // تطبيع القيم
        const total = Object.values(emotionsData).reduce((sum, val) => sum + val, 0);
        Object.keys(emotionsData).forEach(key => {
            emotionsData[key] = (emotionsData[key] / total) * 100;
        });
    }

    // تحويل أسماء المشاعر إلى العربية
    const arabicLabels = {};
    Object.keys(emotionsData).forEach(key => {
        arabicLabels[key] = getEmotionNameInArabic(key);
    });

    // إنشاء أو تحديث الرسم البياني
    const ctx = canvas.getContext('2d');

    // تدمج الرسم البياني إذا كان موجودًا
    if (window.emotionChartInstance) {
        window.emotionChartInstance.destroy();
    }

    // إنشاء رسم بياني جديد
    window.emotionChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(emotionsData).map(key => arabicLabels[key]),
            datasets: [{
                label: 'نسبة المشاعر (%)',
                data: Object.values(emotionsData).map(val => Math.round(val * 10) / 10),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.5)',   // حزن
                    'rgba(54, 162, 235, 0.5)',   // خوف
                    'rgba(255, 206, 86, 0.5)',   // غضب
                    'rgba(75, 192, 192, 0.5)',   // مفاجأة
                    'rgba(153, 102, 255, 0.5)',  // سعادة
                    'rgba(255, 159, 64, 0.5)',   // اشمئزاز
                    'rgba(201, 203, 207, 0.5)'   // محايد
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)',
                    'rgba(201, 203, 207, 1)'
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
                            return context.dataset.label + ': ' + context.raw + '%';
                        }
                    }
                }
            }
        }
    });
}

// تحديث الاقتراحات
function updateSuggestions(result) {
    const suggestionsContainer = document.getElementById('emotion-suggestions-text');

    if (!suggestionsContainer) return;

    // تفريغ الحاوية
    suggestionsContainer.innerHTML = '';

    // الحصول على الاقتراحات
    let suggestions = [];

    if (result.suggestions && Array.isArray(result.suggestions)) {
        suggestions = result.suggestions;
    } else {
        // إنشاء اقتراحات بناءً على المشاعر
        if (result.emotion) {
            suggestions = generateSuggestionsForEmotion(result.emotion);
        }
    }

    // إضافة الاقتراحات إلى الحاوية
    suggestions.forEach(suggestion => {
        const suggestionItem = document.createElement('div');
        suggestionItem.className = 'suggestion-item';
        suggestionItem.textContent = suggestion;
        suggestionsContainer.appendChild(suggestionItem);
    });
}

// إنشاء اقتراحات بناءً على المشاعر
function generateSuggestionsForEmotion(emotion) {
    const suggestionsMap = {
        'happy': [
            'حافظ على هذا الشعور الإيجابي!',
            'شارك سعادتك مع الآخرين',
            'استغل هذه الطاقة الإيجابية لإنجاز مهامك'
        ],
        'sad': [
            'حاول ممارسة الرياضة لتحسين مزاجك',
            'التحدث مع صديق قد يساعدك',
            'استمع إلى موسيقى هادئة'
        ],
        'angry': [
            'خذ نفسًا عميقًا وعد إلى 10',
            'حاول المشي لتهدئة أعصابك',
            'مارس تقنيات الاسترخاء'
        ],
        'surprised': [
            'خذ وقتًا لمعالجة هذا الموقف',
            'فكر في الأسباب التي أدت لهذه المفاجأة',
            'خطط للتعامل مع مواقف مشابهة في المستقبل'
        ],
        'fearful': [
            'حاول تحديد مصدر الخوف',
            'تحدث مع شخص تثق به',
            'مارس تقنيات التنفس العميق'
        ],
        'disgusted': [
            'حاول فهم سبب هذا الشعور',
            'ابتعد عن مصدر الاشمئزاز',
            'ركّز على أفكار إيجابية'
        ],
        'neutral': [
            'هذا شعور طبيعي ومتوازن',
            'استغل هذه الحالة للتفكير بوضوح',
            'خطط لمستقبلك بهدوء'
        ]
    };

    return suggestionsMap[emotion] || [
        'فكر في مشاعرك وحاول فهمها',
        'مارس تقنيات الوعي بالذات',
        'تحدث مع شخص تثق به حول مشاعرك'
    ];
}
