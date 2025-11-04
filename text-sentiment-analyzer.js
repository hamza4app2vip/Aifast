// تحليل مشاعر النص
document.addEventListener('DOMContentLoaded', function() {
    // تهيئة محلل المشاعر
    const sentimentText = document.getElementById('sentiment-text');
    const analyzeTextEmotionBtn = document.getElementById('analyze-text-emotion-btn');
    const emotionResult = document.getElementById('emotion-result');
    const emotionResults = document.querySelector('.emotion-results');

    // تحديث عدد الأحرف والكلمات
    if (sentimentText) {
        sentimentText.addEventListener('input', function() {
            const text = this.value;
            const charCount = text.length;
            const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

            const charCountElement = document.getElementById('char-count');
            const wordCountElement = document.getElementById('word-count');

            if (charCountElement) charCountElement.textContent = `${charCount} / 5000`;
            if (wordCountElement) wordCountElement.textContent = `${wordCount} كلمة`;
        });
    }

    // تحليل مشاعر النص
    if (analyzeTextEmotionBtn) {
        analyzeTextEmotionBtn.addEventListener('click', function() {
            const text = sentimentText ? sentimentText.value : '';

            if (!text.trim()) {
                if (typeof showNotification === 'function') {
                    showNotification('الرجاء إدخال نص لتحليل مشاعره', 'warning');
                }
                return;
            }

            // إظهار مؤشر التحميل
            this.disabled = true;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التحليل...';

            // محاكاة تحليل المشاعر
            setTimeout(() => {
                // بيانات عشوائية للمشاعر (لأغراض العرض التوضيحي)
                const emotions = {
                    happy: { name: 'سعادة', color: '#FFD166', icon: 'fa-smile', value: Math.floor(Math.random() * 100) },
                    sad: { name: 'حزن', color: '#118AB2', icon: 'fa-sad-tear', value: Math.floor(Math.random() * 100) },
                    angry: { name: 'غضب', color: '#EF476F', icon: 'fa-angry', value: Math.floor(Math.random() * 100) },
                    surprised: { name: 'مفاجأة', color: '#7209B7', icon: 'fa-surprise', value: Math.floor(Math.random() * 100) },
                    neutral: { name: 'محايد', color: '#8D99AE', icon: 'fa-meh', value: Math.floor(Math.random() * 100) },
                    fearful: { name: 'خوف', color: '#4CC9F0', icon: 'fa-frown', value: Math.floor(Math.random() * 100) },
                    disgusted: { name: 'اشمئزاز', color: '#90BE6D', icon: 'fa-tired', value: Math.floor(Math.random() * 100) }
                };

                // تطبيع القيم لتكون مجموعها 100%
                let total = 0;
                Object.values(emotions).forEach(emotion => {
                    total += emotion.value;
                });

                Object.values(emotions).forEach(emotion => {
                    emotion.value = Math.round((emotion.value / total) * 100);
                });

                // البحث عن المشاعر المهيمنة
                let dominantEmotion = null;
                let maxValue = 0;

                Object.entries(emotions).forEach(([key, emotion]) => {
                    if (emotion.value > maxValue) {
                        maxValue = emotion.value;
                        dominantEmotion = emotion;
                    }
                });

                // عرض النتائج
                if (emotionResult) {
                    emotionResult.querySelector('.placeholder').style.display = 'none';
                    emotionResults.style.display = 'block';

                    // تحديث المشاعر المهيمنة
                    const dominantEmotionElement = document.getElementById('emotion-value');
                    if (dominantEmotionElement && dominantEmotion) {
                        dominantEmotionElement.innerHTML = `<i class="fas ${dominantEmotion.icon}" style="color: ${dominantEmotion.color}"></i> ${dominantEmotion.name}`;
                    }

                    // تحديث مستوى الثقة
                    const confidenceProgress = document.getElementById('confidence-progress');
                    const confidenceValue = document.getElementById('confidence-value');
                    const confidence = 70 + Math.floor(Math.random() * 30); // قيمة عشوائية بين 70-99

                    if (confidenceProgress) {
                        confidenceProgress.style.width = `${confidence}%`;
                    }
                    if (confidenceValue) {
                        confidenceValue.textContent = `${confidence}%`;
                    }

                    // إنشاء المخطط البياني
                    const ctx = document.getElementById('emotion-chart');
                    if (ctx) {
                        // تدمير المخطط البياني القديم إذا كان موجودًا
                        if (window.emotionChart) {
                            window.emotionChart.destroy();
                        }

                        const labels = Object.values(emotions).map(emotion => emotion.name);
                        const data = Object.values(emotions).map(emotion => emotion.value);
                        const backgroundColor = Object.values(emotions).map(emotion => emotion.color);

                        window.emotionChart = new Chart(ctx, {
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
                                                size: 12
                                            },
                                            color: '#f8fafc'
                                        }
                                    }
                                }
                            }
                        });
                    }

                    // تحديث شرح النتائج
                    const emotionExplanationText = document.getElementById('emotion-explanation-text');
                    if (emotionExplanationText && dominantEmotion) {
                        emotionExplanationText.textContent = `بناءً على تحليل النص، المشاعر المهيمنة هي ${dominantEmotion.name} بنسبة ${dominantEmotion.value}%. هذا يعكس أن النص يحمل طابعًا ${dominantEmotion.name === 'سعادة' ? 'إيجابيًا ومشرقًا' : dominantEmotion.name === 'حزن' ? 'حزينًا ومؤثرًا' : dominantEmotion.name === 'غضب' ? 'غاضبًا وقويًا' : dominantEmotion.name === 'مفاجأة' ? 'مفاجئًا وغير متوقع' : dominantEmotion.name === 'محايد' ? 'محايدًا وموضوعيًا' : dominantEmotion.name === 'خوف' ? 'خائفًا وحذرًا' : 'مشاعر معقدة ومتنوعة'}.`;
                    }
                }

                // استعادة زر التحليل
                this.disabled = false;
                this.innerHTML = '<i class="fas fa-brain"></i> تحليل مشاعر النص';

                // تمكين إمكانية التحليل مرة أخرى
                const analyzeButton = document.getElementById('analyze-text-emotion-btn');
                if (analyzeButton) {
                    analyzeButton.disabled = false;
                    analyzeButton.innerHTML = '<i class="fas fa-brain"></i> تحليل مشاعر النص';
                }

                // إظهار إشعار النجاح
                if (typeof showNotification === 'function') {
                    showNotification('تم تحليل مشاعر النص بنجاح', 'success');
                }
            }, 2000);
        });
    }
});
