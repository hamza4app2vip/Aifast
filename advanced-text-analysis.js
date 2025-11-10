// تحليل متقدم للنصوص
document.addEventListener('DOMContentLoaded', function() {
    // قاموس الكلمات الدالة لكل مشاعر
    const emotionKeywords = {
        happy: {
            words: ['سعيد', 'سعادة', 'فرح', 'مبتهج', 'مسرور', 'بهيج', 'متحمس', 'متفائل', 'رائع', 'ممتاز', 'أحسن', 'جميل', 'مدهش', 'رائع', 'مذهل', 'أجمل', 'مبهج', 'مشرق', 'مضيء', 'إيجابي'],
            phrases: ['أنا سعيد', 'يشعر بالسعادة', 'ممتاز جدا', 'رائع جدا', 'أحب', 'متحمس ل', 'أتطلع ل', 'أسعدني', 'فرحت ب'],
            color: '#FFD166',
            icon: 'fa-smile',
            name: 'سعادة'
        },
        sad: {
            words: ['حزين', 'حزن', 'بائس', 'مكروب', 'يائس', 'مكتئب', 'مؤلم', 'مفجع', 'مصاب', 'منكوب', 'بكى', 'دموع', 'أسى', 'أسف', 'ندم', 'كئيب', 'حزينا', 'مهموما', 'مغموما', 'مضطرب'],
            phrases: ['أنا حزين', 'حزنت على', 'أشعر بالحزن', 'مفجوع ب', 'مصاب ب', 'بكيت من', 'دموعي', 'أسف على', 'ندمت على'],
            color: '#118AB2',
            icon: 'fa-sad-tear',
            name: 'حزن'
        },
        angry: {
            words: ['غاضب', 'غضب', 'مغتاظ', 'مستاء', 'ساخط', 'محنق', 'مستنفر', 'مثور', 'عصبي', 'منزعج', 'مستفز', 'غيور', 'مشمئز', 'مقرف', 'مقيت', 'ساخط', 'غاضبا', 'محنقا', 'مثورا', 'عصبيا'],
            phrases: ['أنا غاضب', 'غضبت من', 'أشعر بالغضب', 'مستاء من', 'ساخط على', 'محنق على', 'مثور من', 'عصبت من', 'منزعج من', 'مستفز من'],
            color: '#EF476F',
            icon: 'fa-angry',
            name: 'غضب'
        },
        surprised: {
            words: ['متفاجئ', 'مصدوم', 'مذهول', 'دهش', 'مندهش', 'مستغرب', 'مستنكر', 'متعجب', 'مبهور', 'منبهر', 'ذهل', 'ذهلت', 'صعقت', 'صدمت', 'مفاجأة', 'مفاجأة', 'مدهش', 'عجيب', 'غريب'],
            phrases: ['أنا متفاجئ', 'متفاجئ من', 'مصدوم من', 'مذهول من', 'مندهش من', 'مستغرب ل', 'مستنكر ل', 'متعجب من', 'مبهور ب', 'منبهر ب'],
            color: '#7209B7',
            icon: 'fa-surprise',
            name: 'مفاجأة'
        },
        neutral: {
            words: ['عادي', 'طبيعي', 'محايد', 'موضوعي', 'بسيط', 'معتدل', 'متوسط', 'عادي', 'مقبول', 'جيد', 'ممتاز', 'مفهوم', 'واضح', 'بديهي', 'منطقي', 'معقول', 'صحيح', 'دقيق', 'دقيق', 'واضح'],
            phrases: ['أرى أن', 'أعتقد أن', 'في رأيي', 'حسب فهمي', 'من وجهة نظري', 'بصراحة', 'بصدق', 'بكل وضوح', 'بكل بساطة', 'بكل تأكيد'],
            color: '#8D99AE',
            icon: 'fa-meh',
            name: 'محايد'
        },
        fearful: {
            words: ['خائف', 'خوف', 'مرعوب', 'مذعور', 'فزع', 'هلع', 'قلق', 'مضطرب', 'توتر', 'رهبة', 'رعب', 'فزع', 'مذعور', 'مرعوب', 'مذعور', 'مرعوب', 'خائف', 'خائفا', 'قلقا', 'مضطربا'],
            phrases: ['أنا خائف', 'أخاف من', 'أشعر بالخوف', 'مرعوب من', 'مذعور من', 'فزعت من', 'هلعت من', 'قلق من', 'متوتر من', 'مرعوب من'],
            color: '#4CC9F0',
            icon: 'fa-frown',
            name: 'خوف'
        },
        disgusted: {
            words: ['مقرف', 'مقيت', 'منفر', 'مشئوم', 'مشمئز', 'مستهجن', 'مستقذر', 'كريه', 'بشع', 'قبيح', 'مقرف', 'مقيت', 'منفر', 'مشئوم', 'مشمئز', 'مستهجن', 'مستقذر', 'كريه', 'بشع', 'قبيح'],
            phrases: ['أنا مقرف', 'مقرف من', 'أشعر بالاشمئزاز', 'منفر من', 'مشئوم من', 'مشمئز من', 'مستهجن ل', 'مستقذر من', 'كريه', 'بشع'],
            color: '#90BE6D',
            icon: 'fa-tired',
            name: 'اشمئزاز'
        }
    };

    // تحليل النص لتحديد المشاعر
    function analyzeTextEmotions(text) {
        // تهيئة نتائج المشاعر
        const emotions = {};
        Object.keys(emotionKeywords).forEach(key => {
            emotions[key] = {
                name: emotionKeywords[key].name,
                color: emotionKeywords[key].color,
                icon: emotionKeywords[key].icon,
                value: 0
            };
        });

        // تحويل النص إلى أحرف صغيرة وإزالة علامات الترقيم
        const normalizedText = text.toLowerCase().replace(/[.,;:!?'"()\[\]{}]/g, ' ');

        // حساب درجة كل مشاعر
        Object.keys(emotionKeywords).forEach(key => {
            const keywords = emotionKeywords[key];

            // حساب عدد الكلمات الدالة
            keywords.words.forEach(word => {
                const regex = new RegExp(`\b${word}\b`, 'g');
                const matches = normalizedText.match(regex);
                if (matches) {
                    emotions[key].value += matches.length * 2; // وزن أكبر للكلمات المفردة
                }
            });

            // حساب عدد العبارات الدالة
            keywords.phrases.forEach(phrase => {
                if (normalizedText.includes(phrase)) {
                    emotions[key].value += 3; // وزن أكبر للعبارات
                }
            });
        });

        // إذا لم يتم العثور على أي مشاعر، اجعل المحايد هو المهيمن
        let totalEmotion = 0;
        Object.values(emotions).forEach(emotion => {
            totalEmotion += emotion.value;
        });

        if (totalEmotion === 0) {
            emotions.neutral.value = 10; // قيمة افتراضية للمشاعر المحايدة
            totalEmotion = 10;
        }

        // تطبيع القيم لتكون مجموعها 100%
        Object.values(emotions).forEach(emotion => {
            emotion.value = Math.round((emotion.value / totalEmotion) * 100);
        });

        return emotions;
    }

    // تحليل النص لفهم المعنى
    function analyzeTextMeaning(text) {
        // تحليل طول النص
        const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

        // تحليل نوع النص (سؤال، إخبار، أمر، تعجب)
        let textType = 'إخبار';
        if (text.includes('?') || text.includes('؟')) {
            textType = 'سؤال';
        } else if (text.includes('!') || text.includes('!')) {
            textType = 'تعجب';
        } else if (text.match(/^(من فضلك|رجاء|هل يمكن|أرجو|أريد|يجب)/)) {
            textType = 'طلب';
        }

        // تحليل الموضوعات الرئيسية
        const topics = {
            personal: ['أنا', 'لي', 'لي', 'عندي', 'لدي', 'شعوري', 'أرى', 'أعتقد'],
            family: ['والدي', 'والدتي', 'أبي', 'أمي', 'أخي', 'أختي', 'عائلتي', 'أسرة'],
            work: ['عمل', 'وظيفة', 'مكتب', 'مدير', 'زميل', 'موظف', 'شركة', 'مشروع'],
            social: ['صديق', 'أصدقاء', 'اجتماع', 'حفلة', 'مناسبة', 'زواج', 'عيد'],
            health: ['مرض', 'صحة', 'دواء', 'طبيب', 'مستشفى', 'علاج', 'ألم', 'إصابة'],
            education: ['مدرسة', 'جامعة', 'دراسة', 'امتحان', 'درجة', 'طالب', 'أستاذ', 'مادة']
        };

        let mainTopic = 'عام';
        let topicScore = 0;

        Object.keys(topics).forEach(topic => {
            let score = 0;
            topics[topic].forEach(keyword => {
                if (text.includes(keyword)) {
                    score++;
                }
            });

            if (score > topicScore) {
                topicScore = score;
                mainTopic = topic;
            }
        });

        return {
            wordCount,
            textType,
            mainTopic,
            complexity: wordCount > 50 ? 'معقد' : wordCount > 20 ? 'متوسط' : 'بسيط'
        };
    }

    // تحليل النص لتحديد الأنماط النفسية
    function analyzePsychologicalPatterns(text) {
        const patterns = {
            optimistic: 0,
            pessimistic: 0,
            anxious: 0,
            confident: 0,
            doubtful: 0
        };

        // كلمات دالة لكل نمط
        const patternKeywords = {
            optimistic: ['أمل', 'مستقبل', 'نجاح', 'تحسن', 'فرصة', 'إيجابي', 'أفضل', 'تقدم', 'مشرق', 'ممكن'],
            pessimistic: ['فشل', 'صعب', 'مستحيل', 'لا أمل', 'سيء', 'أسوأ', 'مأساة', 'كارثة', 'بائس', 'يأس'],
            anxious: ['قلق', 'خوف', 'توتر', 'ضغط', 'مشكلة', 'صعوبة', 'تحدي', 'مخاطر', 'خطر', 'تهديد'],
            confident: ['ثقة', 'قدرة', 'استطيع', 'أقدر', 'أنا قادر', 'بالتأكيد', 'أكيد', 'حتمي', 'بلا شك', 'بالتأكيد'],
            doubtful: ['شك', 'ربما', 'لست متأكدا', 'قد', 'ربما', 'أحتار', 'غير متأكد', 'أظن', 'أعتقد', 'لست متيقنا']
        };

        // تحليل النص لتحديد الأنماط
        Object.keys(patternKeywords).forEach(pattern => {
            patternKeywords[pattern].forEach(keyword => {
                const regex = new RegExp(`\b${keyword}\b`, 'g');
                const matches = text.toLowerCase().match(regex);
                if (matches) {
                    patterns[pattern] += matches.length;
                }
            });
        });

        return patterns;
    }

    // تحليل النص لتحديد المستوى اللغوي
    function analyzeLanguageLevel(text) {
        const words = text.trim().split(/\s+/);
        const wordCount = words.length;

        // حساب متوسط طول الكلمات
        let totalLength = 0;
        words.forEach(word => {
            totalLength += word.length;
        });
        const avgWordLength = totalLength / wordCount;

        // تحديد المستوى اللغوي بناءً على متوسط طول الكلمات والتعقيد
        let languageLevel = 'عادي';
        if (avgWordLength > 6) {
            languageLevel = 'رفيع';
        } else if (avgWordLength < 4) {
            languageLevel = 'بسيط';
        }

        // تحديد وجود تعابير معقدة
        const complexExpressions = text.match(/[^.!?]*[,.][^.!?]*[,.][^.!?]*/g);
        const hasComplexExpressions = complexExpressions && complexExpressions.length > 0;

        return {
            level: languageLevel,
            avgWordLength: avgWordLength.toFixed(1),
            hasComplexExpressions
        };
    }

    // تحليل النص لتحديد الأهداف والنوايا
    function analyzeIntentions(text) {
        const intentions = {
            informative: 0,
            persuasive: 0,
            emotional: 0,
            questioning: 0,
            requesting: 0
        };

        // كلمات وعبارات دالة لكل نية
        const intentionKeywords = {
            informative: ['معلومة', 'شرح', 'أوضح', 'أوضح لك', 'أخبرك', 'أعرف', 'أفهم', 'أوضح', 'أوضح أن', 'أخبر أن', 'أذكر أن'],
            persuasive: ['أقنع', 'أ persuad', 'أ pursuad', 'أ pursuad', 'أ pursuad', 'أ pursuad', 'أ pursuad', 'أ pursuad', 'أ pursuad', 'أ pursuad'],
            emotional: ['أشعر', 'شعوري', 'قلبي', 'روحي', 'نفسيتي', 'مشاعري', 'عاطفتي', 'أحب', 'أكره', 'أفرح', 'أحزن'],
            questioning: ['هل', 'كيف', 'لماذا', 'متى', 'أين', 'من', 'ماذا', 'كم', 'هل يمكن', 'هل من الممكن', 'هل يوجد'],
            requesting: ['أرجو', 'من فضلك', 'رجاء', 'أريد', 'أحتاج', 'هل يمكن', 'هل بإمكان', 'ساعدني', 'ساعد', 'تفضل']
        };

        // تحليل النص لتحديد النوايا
        Object.keys(intentionKeywords).forEach(intention => {
            intentionKeywords[intention].forEach(keyword => {
                const regex = new RegExp(`\b${keyword}\b`, 'g');
                const matches = text.toLowerCase().match(regex);
                if (matches) {
                    intentions[intention] += matches.length;
                }
            });
        });

        // تحديد النية الرئيسية
        let dominantIntention = null;
        let maxScore = 0;
        Object.entries(intentions).forEach(([key, value]) => {
            if (value > maxScore) {
                maxScore = value;
                dominantIntention = key;
            }
        });

        return {
            intentions,
            dominantIntention
        };
    }

    // تحليل شامل للنص
    function comprehensiveTextAnalysis(text) {
        const emotions = analyzeTextEmotions(text);
        const meaning = analyzeTextMeaning(text);
        const patterns = analyzePsychologicalPatterns(text);
        const languageLevel = analyzeLanguageLevel(text);
        const intentions = analyzeIntentions(text);

        return {
            emotions,
            meaning,
            patterns,
            languageLevel,
            intentions
        };
    }

    // دالة لتحليل النص عند الضغط على زر التحليل
    function performAdvancedTextAnalysis(text) {
        const analysis = comprehensiveTextAnalysis(text);

        // إرجاع النتائج
        return analysis;
    }

    // جعل الدالة متاحة عالمياً
    window.performAdvancedTextAnalysis = performAdvancedTextAnalysis;

    // تحليل النص عند الضغط على زر التحليل
    const analyzeTextEmotionBtn = document.getElementById('analyze-text-emotion-btn');
    if (analyzeTextEmotionBtn) {
        // حفظ الدالة الأصلية
        const originalClickHandler = analyzeTextEmotionBtn.onclick;

        // إضافة معالج النقر الجديد
        analyzeTextEmotionBtn.addEventListener('click', function(e) {
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

            // تحليل النص بشكل متقدم
            setTimeout(() => {
                const analysis = performAdvancedTextAnalysis(text);

                // عرض النتائج
                displayAdvancedAnalysisResults(analysis);

                // استعادة زر التحليل
                this.disabled = false;
                this.innerHTML = '<i class="fas fa-brain"></i> تحليل مشاعر النص';

                // إظهار إشعار النجاح
                if (typeof showNotification === 'function') {
                    showNotification('تم تحليل النص بنجاح باستخدام تقنيات متقدمة', 'success');
                }
            }, 2000);
        });
    }

    // دالة لعرض نتائج التحليل المتقدم
    function displayAdvancedAnalysisResults(analysis) {
        const emotionResult = document.getElementById('emotion-result');
        const emotionResults = document.querySelector('.emotion-results');

        if (!emotionResult || !emotionResults) return;

        // إخفاء العنصر النائب وإظهار النتائج
        emotionResult.querySelector('.placeholder').style.display = 'none';
        emotionResults.style.display = 'block';

        // البحث عن المشاعر المسيطرة
        let dominantEmotion = null;
        let maxValue = 0;

        Object.entries(analysis.emotions).forEach(([key, emotion]) => {
            if (emotion.value > maxValue) {
                maxValue = emotion.value;
                dominantEmotion = emotion;
            }
        });

        // تحديث المشاعر المسيطرة
        const dominantEmotionElement = document.getElementById('emotion-value');
        if (dominantEmotionElement && dominantEmotion) {
            dominantEmotionElement.innerHTML = `<i class="fas ${dominantEmotion.icon}" style="color: ${dominantEmotion.color}"></i> ${dominantEmotion.name}`;
        }

        // تحديث مستوى الثقة
        const confidenceProgress = document.getElementById('confidence-progress');
        const confidenceValue = document.getElementById('confidence-value');

        // حساب الثقة بناءً على تحليل متقدم
        let confidence = 60;
        if (analysis.meaning.wordCount > 20) confidence += 10;
        if (analysis.meaning.textType === 'إخبار') confidence += 10;
        if (analysis.meaning.complexity === 'معقد') confidence += 10;
        if (dominantEmotion && dominantEmotion.value > 40) confidence += 10;
        if (analysis.languageLevel.level === 'رفيع') confidence += 5;
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
                        }
                    }
                }
            });
        }

        // تحديث شرح النتائج
        const emotionExplanationText = document.getElementById('emotion-explanation-text');
        if (emotionExplanationText && dominantEmotion) {
            // إنشاء شرح مفصل بناءً على التحليل المتقدم
            let explanation = `بناءً على تحليل متقدم للنص، المشاعر المسيطرة هي ${dominantEmotion.name} بنسبة ${dominantEmotion.value}%. `;

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

            emotionExplanationText.textContent = explanation;
        }

        // إضافة اقتراحات بناءً على المشاعر المسيطرة والتحليل المتقدم
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
});
    window.performAdvancedTextAnalysis = performAdvancedTextAnalysis;
    window.analyzeTextEmotions = analyzeTextEmotions;
    window.analyzeTextMeaning = analyzeTextMeaning;
    window.analyzePsychologicalPatterns = analyzePsychologicalPatterns;
    window.analyzeLanguageLevel = analyzeLanguageLevel;
    window.analyzeIntentions = analyzeIntentions;
});