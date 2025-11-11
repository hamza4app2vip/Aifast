// تحليل النصوص باستخدام API
document.addEventListener('DOMContentLoaded', function() {
    // الحصول على مفتاح API (بدون إزعاج المستخدم)
    function getApiKey() {
        // 1) مفتاح عام إن وُجد
        if (typeof window.apiKey !== 'undefined' && window.apiKey) {
            return window.apiKey;
        }

        // 2) التخزين المحلي
        try {
            const savedApiKey = localStorage.getItem('openai_api_key');
            if (savedApiKey) return savedApiKey;
        } catch (_) {}

        // 3) متغيرات البيئة المحمّلة عبر env-loader
        if (typeof window.getEnvVar === 'function') {
            const envKey = window.getEnvVar('OPENAI_API_KEY');
            if (envKey) {
                try { localStorage.setItem('openai_api_key', envKey); } catch (_) {}
                return envKey;
            }
        }

        // 4) متغير عام اختياري
        if (typeof window.OPENAI_API_KEY === 'string' && window.OPENAI_API_KEY) {
            try { localStorage.setItem('openai_api_key', window.OPENAI_API_KEY); } catch (_) {}
            return window.OPENAI_API_KEY;
        }

        // بدون رسائل تنبيه — يُعاد null ليتم التعامل معه أعلى السلسلة
        return null;
    }

    // تحليل النص باستخدام OpenAI API
    async function analyzeTextWithAPI(text) {
        const apiKey = getApiKey();
        if (!apiKey) {
            throw new Error('مفتاح API غير متوفر');
        }

        // إنشاء طلب API
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: `أنت محلل نصوص محترف متخصص في تحليل المشاعر والمعنى والنوايا. 
                        قم بتحليل النص التالي بشكل شامل وقدم النتائج في صيغة JSON.

                        يجب أن تتضمن النتائج:
                        1. تحليل المشاعر: نسبة كل مشاعر (سعادة، حزن، غضب، مفاجأة، محايد، خوف، اشمئزاز)
                        2. تحليل المعنى: نوع النص (سؤال، إخبار، طلب، تعجب)، تعقيد النص (بسيط، متوسط، معقد)، الموضوع الرئيسي
                        3. تحليل الأنماط النفسية: تفاؤل، تشاؤم، قلق، ثقة، شك
                        4. تحليل المستوى اللغوي: المستوى (بسيط، عادي، رفيع)، متوسط طول الكلمات، وجود تعابير معقدة
                        5. تحليل النوايا: إعلامي، إقناعي، عاطفي، استفهامي، طلبي

                        قدم النتائج ككائن JSON صالح مع قيم رقمية للمشاعر والأنماط والنوايا.`
                    },
                    {
                        role: 'user',
                        content: text
                    }
                ],
                temperature: 0.3,
                max_tokens: 1500
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`خطأ في API: ${errorData.error.message}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        // محاولة تحليل المحتوى كـ JSON
        try {
            // البحث عن كائن JSON في المحتوى
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            } else {
                // إذا لم يتم العثور على JSON، قم بإنشاء تحليل بديل
                return createFallbackAnalysis(text, content);
            }
        } catch (error) {
            console.error('خطأ في تحليل JSON:', error);
            // إنشاء تحليل بديل في حالة فشل تحليل JSON
            return createFallbackAnalysis(text, content);
        }
    }

    // إنشاء تحليل بديل في حالة فشل تحليل JSON
    function createFallbackAnalysis(text, apiResponse) {
        // استخدام المحلل المحلي كخطة احتياطية
        if (typeof window.performAdvancedTextAnalysis === 'function') {
            return window.performAdvancedTextAnalysis(text);
        }

        // إنشاء تحليل بسيط
        return {
            emotions: {
                happy: { name: 'سعادة', color: '#FFD166', icon: 'fa-smile', value: 20 },
                sad: { name: 'حزن', color: '#118AB2', icon: 'fa-sad-tear', value: 10 },
                angry: { name: 'غضب', color: '#EF476F', icon: 'fa-angry', value: 10 },
                surprised: { name: 'مفاجأة', color: '#7209B7', icon: 'fa-surprise', value: 15 },
                neutral: { name: 'محايد', color: '#8D99AE', icon: 'fa-meh', value: 30 },
                fearful: { name: 'خوف', color: '#4CC9F0', icon: 'fa-frown', value: 10 },
                disgusted: { name: 'اشمئزاز', color: '#90BE6D', icon: 'fa-tired', value: 5 }
            },
            meaning: {
                wordCount: text.trim() ? text.trim().split(/\s+/).length : 0,
                textType: 'إخبار',
                mainTopic: 'عام',
                complexity: 'متوسط'
            },
            patterns: {
                optimistic: 1,
                pessimistic: 1,
                anxious: 1,
                confident: 1,
                doubtful: 1
            },
            languageLevel: {
                level: 'عادي',
                avgWordLength: '4.5',
                hasComplexExpressions: false
            },
            intentions: {
                informative: 2,
                persuasive: 1,
                emotional: 1,
                questioning: 1,
                requesting: 1,
                dominantIntention: 'informative'
            },
            apiResponse: apiResponse // حفظ استجابة API للعرض
        };
    }

    // تحليل النص عند الضغط على زر التحليل
    const analyzeTextEmotionBtn = document.getElementById('analyze-text-emotion-btn');
    if (analyzeTextEmotionBtn) {
        // إضافة معالج النقر الجديد
        analyzeTextEmotionBtn.addEventListener('click', async function(e) {
            // منع السلوك الافتراضي
            e.preventDefault();

            const sentimentText = document.getElementById('sentiment-text');
            const text = sentimentText ? sentimentText.value : '';

            if (!text.trim()) {
                if (typeof showNotification === 'function') {
                    showNotification('الرجاء إدخال نص لتحليل مشاعره', 'warning');
                }
                return;
            }

            // إظهار مؤشر التحميل
            this.disabled = true;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التحليل المتقدم...';

            try {
                // تحليل النص باستخدام API
                const analysis = await analyzeTextWithAPI(text);

                // عرض النتائج
                displayAPIAnalysisResults(analysis);

                // إظهار إشعار النجاح
                if (typeof showNotification === 'function') {
                    showNotification('تم تحليل النص بنجاح باستخدام تقنيات الذكاء الاصطناعي المتقدمة', 'success');
                }
            } catch (error) {
                console.error('خطأ في تحليل النص:', error);

                // استخدام المحلل المحلي كخطة احتياطية
                if (typeof window.performAdvancedTextAnalysis === 'function') {
                    try {
                        const fallbackAnalysis = window.performAdvancedTextAnalysis(text);
                        displayAPIAnalysisResults(fallbackAnalysis);

                        if (typeof showNotification === 'function') {
                            showNotification('تم التحليل باستخدام الطريقة المحلية بسبب مشكلة في الاتصال بالخدمة السحابية', 'info');
                        }
                    } catch (fallbackError) {
                        console.error('خطأ في التحليل المحلي:', fallbackError);

                        if (typeof showNotification === 'function') {
                            showNotification(`فشل تحليل النص: ${error.message}`, 'error');
                        }
                    }
                } else {
                    if (typeof showNotification === 'function') {
                        showNotification(`فشل تحليل النص: ${error.message}`, 'error');
                    }
                }
            } finally {
                // استعادة زر التحليل
                this.disabled = false;
                this.innerHTML = '<i class="fas fa-brain"></i> تحليل مشاعر النص';
            }
        });
    }

    // دالة لعرض نتائج تحليل API
    function displayAPIAnalysisResults(analysis) {
        const emotionResult = document.getElementById('emotion-result');
        const emotionResults = document.querySelector('.emotion-results');

        if (!emotionResult || !emotionResults) return;

        // إخفاء العنصر النائب وإظهار النتائج
        emotionResult.querySelector('.placeholder').style.display = 'none';
        emotionResults.style.display = 'block';

        // البحث عن المشاعر المهيمنة
        let dominantEmotion = null;
        let maxValue = 0;

        Object.entries(analysis.emotions).forEach(([key, emotion]) => {
            if (emotion.value > maxValue) {
                maxValue = emotion.value;
                dominantEmotion = emotion;
            }
        });

        // تحديث المشاعر المهيمنة
        const dominantEmotionElement = document.getElementById('emotion-value');
        if (dominantEmotionElement && dominantEmotion) {
            dominantEmotionElement.innerHTML = `<i class="fas ${dominantEmotion.icon}" style="color: ${dominantEmotion.color}"></i> ${dominantEmotion.name}`;
        }

        // تحديث مستوى الثقة
        const confidenceProgress = document.getElementById('confidence-progress');
        const confidenceValue = document.getElementById('confidence-value');

        // حساب الثقة بناءً على تحليل متقدم
        let confidence = 75; // قيمة أساسية أعلى لتحليل API

        // زيادة الثقة بناءً على نوع النص
        if (analysis.meaning.textType === 'إخبار') confidence += 5;
        if (analysis.meaning.textType === 'سؤال') confidence += 3;

        // زيادة الثقة بناءً على تعقيد النص
        if (analysis.meaning.complexity === 'معقد') confidence += 10;
        if (analysis.meaning.complexity === 'متوسط') confidence += 5;

        // زيادة الثقة بناءً على طول النص
        if (analysis.meaning.wordCount > 50) confidence += 5;
        if (analysis.meaning.wordCount > 100) confidence += 5;

        // زيادة الثقة بناءً على المستوى اللغوي
        if (analysis.languageLevel.level === 'رفيع') confidence += 5;

        // زيادة الثقة بناءً على قوة المشاعر المهيمنة
        if (dominantEmotion && dominantEmotion.value > 50) confidence += 5;

        confidence = Math.min(confidence, 98); // الحد الأقصى 98%

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

            const labels = Object.values(analysis.emotions).map(emotion => emotion.name);
            const data = Object.values(analysis.emotions).map(emotion => emotion.value);
            const backgroundColor = Object.values(analysis.emotions).map(emotion => emotion.color);

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
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.parsed || 0;
                                    return `${label}: ${value}%`;
                                }
                            }
                        }
                    }
                }
            });
        }

        // تحديث شرح النتائج
        const emotionExplanationText = document.getElementById('emotion-explanation-text');
        if (emotionExplanationText && dominantEmotion) {
            // إنشاء شرح مفصل بناءً على التحليل المتقدم
            let explanation = `بناءً على تحليل متقدم للنص باستخدام الذكاء الاصطناعي، المشاعر المهيمنة هي ${dominantEmotion.name} بنسبة ${dominantEmotion.value}%. `;

            // إضافة تحليل نوع النص
            explanation += `النص هو من نوع ${analysis.meaning.textType} و`;

            // إضافة تحليل تعقيد النص
            explanation += `يُعتبر ${analysis.meaning.complexity} من حيث البنية. `;

            // إضافة تحليل المستوى اللغوي
            explanation += `المستوى اللغوي للنص هو ${analysis.languageLevel.level} بمتوسط طول كلمة ${analysis.languageLevel.avgWordLength}. `;

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
            explanation += `الموضوع الرئيسي للنص هو ${topicNames[analysis.meaning.mainTopic]}. `;

            // إضافة تحليل الأنماط النفسية
            const dominantPattern = Object.entries(analysis.patterns).reduce((max, [key, value]) => value > max.value ? { key, value } : max, { key: '', value: 0 });
            const patternNames = {
                optimistic: 'تفاؤل',
                pessimistic: 'تشاؤم',
                anxious: 'قلق',
                confident: 'ثقة',
                doubtful: 'شك'
            };
            if (dominantPattern.key) {
                explanation += `النمط النفسي المهيمن في النص هو ${patternNames[dominantPattern.key]}. `;
            }

            // إضافة تحليل النوايا
            const intentionNames = {
                informative: 'إعلامي',
                persuasive: 'إقناعي',
                emotional: 'عاطفي',
                questioning: 'استفهامي',
                requesting: 'طلبي'
            };
            if (analysis.intentions.dominantIntention) {
                explanation += `النية الرئيسية للنص هي ${intentionNames[analysis.intentions.dominantIntention]}. `;
            }

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

            // إضافة معلومات إضافية إذا كانت متوفرة
            if (analysis.apiResponse) {
                explanation += '\n\nتحليل إضافي من الذكاء الاصطناعي:\n' + analysis.apiResponse.substring(0, 200) + '...';
            }

            emotionExplanationText.textContent = explanation;
        }

        // إضافة اقتراحات بناءً على المشاعر المهيمنة والتحليل المتقدم
        const emotionSuggestionsText = document.getElementById('emotion-suggestions-text');
        if (emotionSuggestionsText && dominantEmotion) {
            let suggestions = '';

            // اقتراحات بناءً على المشاعر
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

            // إضافة اقتراحات إضافية بناءً على التحليل المتقدم
            if (analysis.patterns.anxious > 2) {
                suggestions += `
                    <div class="suggestion-item">
                        <i class="fas fa-cloud-sun"></i>
                        <span>نمط القلق واضح في نصك، قد تساعد تقنيات إدارة التوتر مثل اليوغا أو التأمل.</span>
                    </div>`;
            }

            if (analysis.patterns.pessimistic > 2) {
                suggestions += `
                    <div class="suggestion-item">
                        <i class="fas fa-sun"></i>
                        <span>نمط التشاؤم واضح في نصك، حاول التركيز على الجوانب الإيجابية في المواقف.</span>
                    </div>`;
            }

            if (analysis.languageLevel.level === 'رفيع') {
                suggestions += `
                    <div class="suggestion-item">
                        <i class="fas fa-graduation-cap"></i>
                        <span>مستواك اللغوي رفيع، يمكنك استخدام هذه القدرة للتعبير عن مشاعرك بشكل أكثر دقة.</span>
                    </div>`;
            }

            emotionSuggestionsText.innerHTML = suggestions;
        }
    }

    // جعل الدوال متاحة عالمياً
    window.analyzeTextWithAPI = analyzeTextWithAPI;
    window.displayAPIAnalysisResults = displayAPIAnalysisResults;
});
