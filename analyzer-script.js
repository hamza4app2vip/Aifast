
// تحليل المشاعر
document.addEventListener('DOMContentLoaded', function() {
    const apiKeyInput = document.getElementById('apiKeyInput');
    const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
    const textInput = document.getElementById('textInput');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const resultsSection = document.getElementById('resultsSection');
    const charCount = document.getElementById('charCount');
    const wordCount = document.getElementById('wordCount');

    // التحقق من وجود مفتاح API محفوظ
    const savedApiKey = localStorage.getItem('openai_api_key');
    if (savedApiKey) {
        apiKeyInput.placeholder = 'تم حفظ المفتاح في المتصفح';
        apiKeyInput.value = '';
    }

    // حفظ مفتاح API
    saveApiKeyBtn.addEventListener('click', function() {
        const apiKey = apiKeyInput.value.trim();
        if (apiKey) {
            localStorage.setItem('openai_api_key', apiKey);
            apiKeyInput.value = '';
            apiKeyInput.placeholder = 'تم حفظ المفتاح في المتصفح';
            showNotification('تم حفظ مفتاح API بنجاح', 'success');
        } else {
            showNotification('الرجاء إدخال مفتاح API صحيح', 'error');
        }
    });

    // تحديث عدد الأحرف والكلمات
    textInput.addEventListener('input', function() {
        const text = textInput.value;
        const chars = text.length;
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;

        charCount.textContent = `${chars} / 5000 حرف`;
        wordCount.textContent = `${words} كلمة`;
    });

    // تحليل النص
    analyzeBtn.addEventListener('click', async function() {
        const text = textInput.value.trim();

        if (!text) {
            showNotification('الرجاء إدخال نص للتحليل', 'warning');
            return;
        }

        const apiKey = localStorage.getItem('openai_api_key');
        if (!apiKey) {
            showNotification('الرجاء إدخال مفتاح OpenAI API أولاً', 'warning');
            return;
        }

        // تعطيل الزر أثناء التحليل
        analyzeBtn.disabled = true;
        analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>جاري التحليل...</span>';

        try {
            // تحليل النص
            const result = await analyzeText(text, apiKey);

            // عرض النتائج
            displayResults(result);

            showNotification('تم تحليل مشاعر النص بنجاح', 'success');
        } catch (error) {
            console.error('Error analyzing text:', error);
            showNotification('فشل تحليل مشاعر النص: ' + error.message, 'error');
        } finally {
            // تفعيل الزر
            analyzeBtn.disabled = false;
            analyzeBtn.innerHTML = '<i class="fas fa-search"></i> <span>تحليل المشاعر</span>';
        }
    });

    // تحليل النص باستخدام API
    async function analyzeText(text, apiKey) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: "أنت محلل متخصص للمشاعر في النصوص. قم بتحليل المشاعر في النص المقدم وحدد المشاعر الرئيسية (سعادة، حزن، غضب، خوف، مفاجأة، اشمئزاز، محايد) مع نسب مئوية دقيقة. يجب أن يكون مجموع النسب 100%. قدم شرحًا للنتائج."
                    },
                    {
                        role: "user",
                        content: text
                    }
                ],
                response_format: { type: "json_object" },
                temperature: 0.1
            })
        });

        const data = await response.json();

        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error(data.error?.message || 'فشل في تحليل مشاعر النص');
        }

        // تحليل الاستجابة
        let emotionResponse;
        try {
            emotionResponse = JSON.parse(data.choices[0].message.content);
        } catch (parseError) {
            console.error('Error parsing emotion response:', data.choices[0].message.content);
            throw new Error('فشل في تحليل استجابة مشاعر النص: ' + parseError.message);
        }

        // إنشاء نتيجة التحليل
        return {
            emotion: emotionResponse.emotion || 'neutral',
            confidence: emotionResponse.confidence || 0.7,
            scores: emotionResponse.scores || {},
            explanation: emotionResponse.explanation || '',
            timestamp: Date.now()
        };
    }

    // عرض النتائج
    function displayResults(result) {
        // إظهار قسم النتائج
        resultsSection.classList.add('active');

        // تحديث ملخص المشاعر
        const emotionValue = document.getElementById('emotionValue');
        const emotionLabel = document.getElementById('emotionLabel');
        const positiveMeter = document.getElementById('positiveMeter');
        const negativeMeter = document.getElementById('negativeMeter');
        const neutralMeter = document.getElementById('neutralMeter');
        const positiveValue = document.getElementById('positiveValue');
        const negativeValue = document.getElementById('negativeValue');
        const neutralValue = document.getElementById('neutralValue');

        // تحديد المشاعر الرئيسية
        let mainEmotion, emotionPercentage;
        if (result.scores.positive > result.scores.negative && result.scores.positive > result.scores.neutral) {
            mainEmotion = 'إيجابي';
            emotionPercentage = result.scores.positive;
        } else if (result.scores.negative > result.scores.positive && result.scores.negative > result.scores.neutral) {
            mainEmotion = 'سلبي';
            emotionPercentage = result.scores.negative;
        } else {
            mainEmotion = 'محايد';
            emotionPercentage = result.scores.neutral;
        }

        emotionValue.textContent = `${emotionPercentage}%`;
        emotionLabel.textContent = mainEmotion;

        // تحديث أشرطة المشاعر
        positiveMeter.style.width = `${result.scores.positive || 0}%`;
        negativeMeter.style.width = `${result.scores.negative || 0}%`;
        neutralMeter.style.width = `${result.scores.neutral || 0}%`;

        positiveValue.textContent = `${result.scores.positive || 0}%`;
        negativeValue.textContent = `${result.scores.negative || 0}%`;
        neutralValue.textContent = `${result.scores.neutral || 0}%`;

        // تحديث شرح النتائج
        const explanationText = document.getElementById('explanationText');
        explanationText.textContent = result.explanation || 'لا يوجد شرح متاح';

        // تحديث تفاصيل المشاعر
        const emotionBars = document.getElementById('emotionBars');
        emotionBars.innerHTML = '';

        for (const [emotion, value] of Object.entries(result.scores)) {
            if (emotion !== 'explanation' && typeof value === 'number') {
                const barContainer = document.createElement('div');
                barContainer.className = 'emotion-bar-container';

                const barLabel = document.createElement('div');
                barLabel.className = 'emotion-label';
                barLabel.innerHTML = `<span class="emotion-icon fas ${getEmotionIcon(emotion)}"></span>${getEmotionNameInArabic(emotion)}`;

                const bar = document.createElement('div');
                bar.className = 'emotion-fill';

                const barFill = document.createElement('div');
                barFill.className = 'emotion-fill-inner';
                barFill.style.width = `${value}%`;

                const barValue = document.createElement('span');
                barValue.className = 'emotion-value';
                barValue.textContent = `${value}%`;

                bar.appendChild(barFill);
                bar.appendChild(barValue);

                barContainer.appendChild(barLabel);
                barContainer.appendChild(bar);

                emotionBars.appendChild(barContainer);
            }
        }
    }

    // الحصول على أيقونة المشاعر
    function getEmotionIcon(emotion) {
        const iconMap = {
            'happy': 'fa-smile',
            'sad': 'fa-sad-tear',
            'angry': 'fa-angry',
            'surprised': 'fa-surprise',
            'fearful': 'fa-grimace',
            'disgusted': 'fa-tired',
            'neutral': 'fa-meh',
            'positive': 'fa-smile',
            'negative': 'fa-frown'
        };

        return iconMap[emotion] || 'fa-meh';
    }

    // الحصول على اسم المشاعر بالعربية
    function getEmotionNameInArabic(emotion) {
        const nameMap = {
            'happy': 'سعادة',
            'sad': 'حزن',
            'angry': 'غضب',
            'surprised': 'مفاجأة',
            'fearful': 'خوف',
            'disgusted': 'اشمئزاز',
            'neutral': 'محايد',
            'positive': 'إيجابي',
            'negative': 'سلبي'
        };

        return nameMap[emotion] || emotion;
    }

    // عرض إشعار
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <span class="notification-close">&times;</span>
            ${message}
        `;

        document.body.appendChild(notification);

        // إظهار الإشعار
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        // إغلاق الإشعار عند النقر على زر الإغلاق
        notification.querySelector('.notification-close').addEventListener('click', function() {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        });

        // إخفاء الإشعار تلقائيًا بعد 5 ثوانٍ
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }
});
