
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

    analyzeSentiment() {
        // محاكاة تحليل المشاعر
        // في التطبيق الحقيقي، سيتم استدعاء واجهة برمجة التطبيقات هنا

        // إظهار مؤشر التحميل
        const analyzeBtn = document.getElementById('analyze-sentiment-btn');
        if (analyzeBtn) {
            analyzeBtn.disabled = true;
            analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التحليل...';
        }

        // محاكاة استجابة واجهة برمجة التطبيقات
        setTimeout(() => {
            // بيانات عشوائية للمشاعر (لأغراض العرض التوضيحي)
            const randomEmotions = {};
            let total = 0;

            // إنشاء قيم عشوائية للمشاعر
            Object.keys(this.emotions).forEach(key => {
                randomEmotions[key] = Math.floor(Math.random() * 100);
                total += randomEmotions[key];
            });

            // تطبيع القيم لتكون مجموعها 100%
            Object.keys(randomEmotions).forEach(key => {
                randomEmotions[key] = Math.round((randomEmotions[key] / total) * 100);
            });

            // تحديث المشاعر
            this.updateEmotions(randomEmotions);

            // استعادة زر التحليل
            if (analyzeBtn) {
                analyzeBtn.disabled = false;
                analyzeBtn.innerHTML = '<i class="fas fa-brain"></i> تحليل المشاعر';
            }

            // إظهار إشعار النجاح
            this.showNotification('تم تحليل المشاعر بنجاح', 'success');
        }, 2000);
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

// تهيئة ملخص المشاعر عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    const sentimentSummary = new SentimentSummary('sentiment-summary-container');
});
