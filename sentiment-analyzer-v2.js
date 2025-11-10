
// ملخص المشاعر
class SentimentSummary {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`لم يتم العثور على العنصر بالمعرف: ${containerId}`);
            return;
        }

        this.emotions = {
            happy: { name: 'سعادة', color: '#FFD166', icon: 'fa-smile', value: 0 },
            sad: { name: 'حزن', color: '#118AB2', icon: 'fa-sad-tear', value: 0 },
            angry: { name: 'غضب', color: '#EF476F', icon: 'fa-angry', value: 0 },
            surprised: { name: 'مفاجأة', color: '#7209B7', icon: 'fa-surprise', value: 0 },
            neutral: { name: 'محايد', color: '#8D99AE', icon: 'fa-meh', value: 0 },
            fearful: { name: 'خوف', color: '#4CC9F0', icon: 'fa-frown', value: 0 },
            disgusted: { name: 'اشمئزاز', color: '#90BE6D', icon: 'fa-tired', value: 0 }
        };

        this.init();
    }

    init() {
        this.render();
        this.attachEventListeners();
    }

    render() {
        this.container.innerHTML = `
            <div class="sentiment-summary-container">
                <h3 class="summary-title">ملخص المشاعر</h3>
                <div class="emotions-chart">
                    <div class="chart-container">
                        <canvas id="sentiment-chart"></canvas>
                    </div>
                    <div class="emotions-list">
                        ${Object.entries(this.emotions).map(([key, emotion]) => `
                            <div class="emotion-item" data-emotion="${key}">
                                <div class="emotion-icon">
                                    <i class="fas ${emotion.icon}"></i>
                                </div>
                                <div class="emotion-info">
                                    <div class="emotion-name">${emotion.name}</div>
                                    <div class="emotion-bar">
                                        <div class="emotion-fill" style="background-color: ${emotion.color}; width: 0%"></div>
                                    </div>
                                    <div class="emotion-value">0%</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="dominant-emotion">
                    <div class="dominant-emotion-label">المشاعر المسيطرة:</div>
                    <div class="dominant-emotion-value">لم يتم التحليل بعد</div>
                </div>
                <div class="summary-actions">
                    <button id="analyze-sentiment-btn" class="btn btn-primary">
                        <i class="fas fa-brain"></i> تحليل المشاعر
                    </button>
                    <button id="reset-sentiment-btn" class="btn btn-secondary">
                        <i class="fas fa-redo"></i> إعادة تعيين
                    </button>
                </div>
            </div>
        `;

        // تهيئة المخطط البياني
        this.initChart();
    }

    initChart() {
        const ctx = document.getElementById('sentiment-chart');
        if (!ctx) return;

        // تحضير البيانات للمخطط البياني
        const labels = Object.values(this.emotions).map(emotion => emotion.name);
        const data = Object.values(this.emotions).map(emotion => emotion.value);
        const backgroundColor = Object.values(this.emotions).map(emotion => emotion.color);

        // إنشاء المخطط البياني
        this.chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColor,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: {
                                family: 'Tajawal, sans-serif',
                                size: 14
                            },
                            padding: 15
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${context.parsed}%`;
                            }
                        }
                    }
                },
                cutout: '60%'
            }
        });
    }

    attachEventListeners() {
        const analyzeBtn = document.getElementById('analyze-sentiment-btn');
        const resetBtn = document.getElementById('reset-sentiment-btn');

        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', () => this.analyzeSentiment());
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.reset());
        }
    }

    updateEmotions(emotionsData) {
        // تحديث قيم المشاعر
        Object.keys(this.emotions).forEach(key => {
            if (emotionsData[key] !== undefined) {
                this.emotions[key].value = emotionsData[key];
            }
        });

        // تحديث الواجهة
        this.updateUI();

        // تحديث المخطط البياني
        this.updateChart();

        // تحديث المشاعر المسيطرة
        this.updateDominantEmotion();
    }

    updateUI() {
        // تحديث أشرطة المشاعر والنسب المئوية
        Object.entries(this.emotions).forEach(([key, emotion]) => {
            const emotionElement = document.querySelector(`.emotion-item[data-emotion="${key}"]`);
            if (emotionElement) {
                const emotionFill = emotionElement.querySelector('.emotion-fill');
                const emotionValue = emotionElement.querySelector('.emotion-value');

                if (emotionFill && emotionFill.style) {
                    emotionFill.style.width = `${emotion.value}%`;
                }

                if (emotionValue) {
                    emotionValue.textContent = `${emotion.value}%`;
                }
            }
        });
    }

    updateChart() {
        if (!this.chart) return;

        // تحديث بيانات المخطط البياني
        const data = Object.values(this.emotions).map(emotion => emotion.value);
        this.chart.data.datasets[0].data = data;
        this.chart.update();
    }

    updateDominantEmotion() {
        // البحث عن المشاعر المسيطرة
        let dominantEmotion = null;
        let maxValue = 0;

        Object.entries(this.emotions).forEach(([key, emotion]) => {
            if (emotion.value > maxValue) {
                maxValue = emotion.value;
                dominantEmotion = emotion;
            }
        });

        // تحديث عرض المشاعر المسيطرة
        const dominantEmotionValue = document.querySelector('.dominant-emotion-value');
        if (dominantEmotionValue && dominantEmotion) {
            dominantEmotionValue.innerHTML = `
                <i class="fas ${dominantEmotion.icon}" style="color: ${dominantEmotion.color}"></i>
                ${dominantEmotion.name} (${dominantEmotion.value}%)
            `;
        }
    }

    async analyzeSentiment() {
        // الحصول على النص والصورة من المدخلات
        const textInput = document.getElementById('text-input');
        const imageInput = document.getElementById('image-input');

        const text = textInput ? textInput.value.trim() : '';
        const imageFile = imageInput ? imageInput.files[0] : null;

        if (!text && !imageFile) {
            this.showNotification('الرجاء إدخال نص أو اختيار صورة للتحليل', 'error');
            return;
        }

        // إظهار مؤشر التحميل
        const analyzeBtn = document.getElementById('analyze-sentiment-btn');
        if (analyzeBtn) {
            analyzeBtn.disabled = true;
            analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التحليل...';
        }

        try {
            let result;

            if (text) {
                result = await this.analyzeTextSentiment(text);
            } else if (imageFile) {
                result = await this.analyzeImageSentiment(imageFile);
            }

            if (result) {
                this.updateEmotions(result.scores);
                this.showNotification('تم تحليل المشاعر بنجاح', 'success');
            }
        } catch (error) {
            console.error('Error analyzing sentiment:', error);
            this.showNotification('فشل تحليل المشاعر: ' + error.message, 'error');
        } finally {
            // استعادة زر التحليل
            if (analyzeBtn) {
                analyzeBtn.disabled = false;
                analyzeBtn.innerHTML = '<i class="fas fa-brain"></i> تحليل المشاعر';
            }
        }
    }

    async analyzeTextSentiment(text) {
        // Get API key
        const apiKey = localStorage.getItem('openai_api_key');
        if (!apiKey) {
            throw new Error('الرجاء إدخال مفتاح OpenAI API');
        }

        // Call API for text sentiment analysis
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
                        content: "أنت محلل متخصص للمشاعر في النصوص. قم بتحليل المشاعر في النص المقدم وحدد المشاعر الرئيسية (سعادة، حزن، غضب، خوف، مفاجأة، اشمئزاز، محايد) مع نسب مئوية دقيقة. يجب أن يكون مجموع النسب 100%. قدم شرحًا للنتائج. أرجع النتائج في صيغة json."
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

        // Parse sentiment response
        let sentimentResponse;
        try {
            sentimentResponse = JSON.parse(data.choices[0].message.content);
        } catch (parseError) {
            console.error('Error parsing sentiment response:', data.choices[0].message.content);
            throw new Error('فشل في تحليل استجابة مشاعر النص: ' + parseError.message);
        }

        // Create analysis result
        const result = {
            type: 'text',
            sentiment: sentimentResponse.sentiment || 'neutral',
            confidence: sentimentResponse.confidence || 0.7,
            scores: sentimentResponse.scores || {},
            explanation: sentimentResponse.explanation || '',
            timestamp: Date.now()
        };

        return result;
    }

    async analyzeImageSentiment(file) {
        // Get API key
        const apiKey = localStorage.getItem('openai_api_key');
        if (!apiKey) {
            throw new Error('الرجاء إدخال مفتاح OpenAI API');
        }

        // Convert image to base64
        const base64Image = await this.imageToBase64(file);

        // Call API for image sentiment analysis
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
                        content: "أنت محلل متخصص للمشاعر في الصور. قم بتحليل المشاعر في الصورة المقدمة وحدد المشاعر الرئيسية (سعادة، حزن، غضب، خوف، مفاجأة، اشمئزاز، محايد) مع نسب مئوية دقيقة. يجب أن يكون مجموع النسب 100%. قدم شرحًا للنتائج. أرجع النتائج في صيغة json."
                    },
                    {
                        role: "user",
                        content: [
                            {
                                type: 'text',
                                text: 'حلل مشاعر الوجه في هذه الصورة'
                            },
                            {
                                type: 'image_url',
                                image_url: `data:image/jpeg;base64,${base64Image}`
                            }
                        ]
                    }
                ],
                response_format: { type: "json_object" },
                temperature: 0.1
            })
        });

        const data = await response.json();

        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error(data.error?.message || 'فشل في تحليل مشاعر الصورة');
        }

        // Parse sentiment response
        let sentimentResponse;
        try {
            sentimentResponse = JSON.parse(data.choices[0].message.content);
        } catch (parseError) {
            console.error('Error parsing sentiment response:', data.choices[0].message.content);
            throw new Error('فشل في تحليل استجابة مشاعر الصورة: ' + parseError.message);
        }

        // Create analysis result
        const result = {
            type: 'image',
            sentiment: sentimentResponse.sentiment || 'neutral',
            confidence: sentimentResponse.confidence || 0.7,
            scores: sentimentResponse.scores || {},
            explanation: sentimentResponse.explanation || '',
            timestamp: Date.now()
        };

        return result;
    }

    imageToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = error => reject(error);
            reader.readAsDataURL(file);
        });
    }

    reset() {
        // إعادة تعيين قيم المشاعر
        Object.keys(this.emotions).forEach(key => {
            this.emotions[key].value = 0;
        });

        // تحديث الواجهة
        this.updateUI();

        // تحديث المخطط البياني
        this.updateChart();

        // إعادة تعيين المشاعر المسيطرة
        const dominantEmotionValue = document.querySelector('.dominant-emotion-value');
        if (dominantEmotionValue) {
            dominantEmotionValue.textContent = 'لم يتم التحليل بعد';
        }

        // إظهار إشعار
        this.showNotification('تم إعادة تعيين ملخص المشاعر', 'info');
    }

    showNotification(message, type = 'info') {
        // إنشاء عنصر الإشعار
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;

        // إضافة الإشعار إلى الصفحة
        document.body.appendChild(notification);

        // إظهار الإشعار
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        // إخفاء الإشعار بعد 3 ثوانٍ
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Initialize when the script loads
document.addEventListener('DOMContentLoaded', () => {
    // Initialize sentiment analysis module
    const sentimentSummary = new SentimentSummary('sentiment-summary-container');

    // Make it globally accessible
    window.sentimentSummary = sentimentSummary;
});
