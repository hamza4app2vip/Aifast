                    const confidenceValue = document.getElementById('confidence-value');
                    // حساب الثقة بناءً على عدد الكلمات ونوع النص
                    let confidence = 60;
                    if (meaning.wordCount > 20) confidence += 10;
                    if (meaning.textType === 'إخبار') confidence += 10;
                    if (meaning.complexity === 'معقد') confidence += 10;
                    if (dominantEmotion && dominantEmotion.value > 40) confidence += 10;
                    confidence = Math.min(confidence, 95); // الحد الأقصى 95%

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
                        // إنشاء شرح مفصل بناءً على المشاعر والمعنى
                        let explanation = `بناءً على تحليل النص، المشاعر المسيطرة هي ${dominantEmotion.name} بنسبة ${dominantEmotion.value}%. `;

                        // إضافة تحليل نوع النص
                        explanation += `النص هو من نوع ${meaning.textType} و`;

                        // إضافة تحليل تعقيد النص
                        explanation += `يُعتبر ${meaning.complexity} من حيث البنية. `;

                        // إضافة تحليل الموضوع الرئيسي
                        const topicNames = {
                            personal: 'شخصي',
                            family: 'عائلي',
                            work: 'مهني/عملي',
                            social: 'اجتماعي',
                            health: 'صحي',
                            education: 'تعليمي',
                            عام: 'عام'
                        };
                        explanation += `الموضوع الرئيسي للنص هو ${topicNames[meaning.mainTopic]}. `;

                        // إضافة تحليل المشاعر
                        if (dominantEmotion.name === 'سعادة') {
                            explanation += 'يعبر النص عن مشاعر إيجابية ومرحة، مما يدل على حالة نفسية جيدة ورضا.';
                        } else if (dominantEmotion.name === 'حزن') {
                            explanation += 'يعبر النص عن مشاعر حزينة، مما قد يدل على تجربة مؤلمة أو فقدان.';
                        } else if (dominantEmotion.name === 'غضب') {
                            explanation += 'يعبر النص عن مشاعر غضب واستياء، مما يدل على وجود موقف مثير للضيق.';
                        } else if (dominantEmotion.name === 'مفاجأة') {
                            explanation += 'يعبر النص عن مشاعر المفاجأة والدهشة، مما يدل على حدث غير متوقع.';
                        } else if (dominantEmotion.name === 'محايد') {
                            explanation += 'يعبر النص عن موقف محايد وموضوعي، دون انفعالات واضحة.';
                        } else if (dominantEmotion.name === 'خوف') {
                            explanation += 'يعبر النص عن مشاعر الخوف والقلق، مما يدل على وجود تهديد أو موقف مرعب.';
                        } else {
                            explanation += 'يعبر النص عن مشاعر معقدة ومتنوعة، مما يدل على حالة نفسية متعددة الأوجه.';
                        }

                        emotionExplanationText.textContent = explanation;
                    }

                    // إضافة اقتراحات بناءً على المشاعر المسيطرة
                    const emotionSuggestionsText = document.getElementById('emotion-suggestions-text');
                    if (emotionSuggestionsText && dominantEmotion) {
                        let suggestions = '';

                        if (dominantEmotion.name === 'سعادة') {
                            suggestions = `
                                <div class="suggestion-item">
                                    <i class="fas fa-lightbulb"></i>
                                    <span>حافظ على هذه المشاعر الإيجابية من خلال ممارسة الشكر والتقدير.</span>
                                </div>
                                <div class="suggestion-item">
                                    <i class="fas fa-heart"></i>
                                    <span>شارك سعادتك مع الآخرين لتعزيزها وزيادتها.</span>
                                </div>`;
                        } else if (dominantEmotion.name === 'حزن') {
                            suggestions = `
                                <div class="suggestion-item">
                                    <i class="fas fa-hands-helping"></i>
                                    <span>لا تتردد في طلب الدعم من الأصدقاء أو العائلة أو المتخصصين.</span>
                                </div>
                                <div class="suggestion-item">
                                    <i class="fas fa-walking"></i>
                                    <span>ممارسة الرياضة أو المشي في الطبيعة قد تساعد في تحسين المزاج.</span>
                                </div>`;
                        } else if (dominantEmotion.name === 'غضب') {
                            suggestions = `
                                <div class="suggestion-item">
                                    <i class="fas fa-spa"></i>
                                    <span>جرب تقنيات الاسترخاء مثل التنفس العميق أو التأمل.</span>
                                </div>
                                <div class="suggestion-item">
                                    <i class="fas fa-comments"></i>
                                    <span>التعبير عن مشاعرك بهدوء قد يساعد في حل المشكلة.</span>
                                </div>`;
                        } else if (dominantEmotion.name === 'مفاجأة') {
                            suggestions = `
                                <div class="suggestion-item">
                                    <i class="fas fa-search"></i>
                                    <span>خذ وقتك لفهم الموقف المفاجئ قبل اتخاذ أي قرار.</span>
                                </div>
                                <div class="suggestion-item">
                                    <i class="fas fa-balance-scale"></i>
                                    <span>حاول تقييم الموقف بموضوعية لفهم أبعاده الكاملة.</span>
                                </div>`;
                        } else if (dominantEmotion.name === 'محايد') {
                            suggestions = `
                                <div class="suggestion-item">
                                    <i class="fas fa-book"></i>
                                    <span>استمر في التحليل الموضوعي للمواقف لاتخاذ قرارات سليمة.</span>
                                </div>
                                <div class="suggestion-item">
                                    <i class="fas fa-users"></i>
                                    <span>النظر في وجهات نظر الآخرين قد يثري فهمك للموقف.</span>
                                </div>`;
                        } else if (dominantEmotion.name === 'خوف') {
                            suggestions = `
                                <div class="suggestion-item">
                                    <i class="fas fa-shield-alt"></i>
                                    <span>تحدث عن مخاوفك مع شخص تثق به لتقليل حدة القلق.</span>
                                </div>
                                <div class="suggestion-item">
                                    <i class="fas fa-brain"></i>
                                    <span>تذكر أن معظم المخاوف أكبر في أذهاننا من واقعها.</span>
                                </div>`;
                        } else {
                            suggestions = `
                                <div class="suggestion-item">
                                    <i class="fas fa-user-circle"></i>
                                    <span>مشاعرك معقدة وطبيعية، حاول فهمها بشكل أعمق.</span>
                                </div>
                                <div class="suggestion-item">
                                    <i class="fas fa-pen"></i>
                                    <span>كتابة مشاعرك قد تساعد في تنظيمها وفهمها بشكل أفضل.</span>
                                </div>`;
                        }

                        emotionSuggestionsText.innerHTML = suggestions;
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
