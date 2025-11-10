// تحليل مشاعر النص
document.addEventListener('DOMContentLoaded', function() {
    // تهيئة محلل المشاعر
    const sentimentText = document.getElementById('sentiment-text');
    const analyzeTextEmotionBtn = document.getElementById('analyze-text-emotion-btn');
    const emotionResult = document.getElementById('emotion-result');
    const emotionResults = document.querySelector('.emotion-results');

    // قوائم الكلمات الدالة لكل مشاعر
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

            // تحليل النص
            setTimeout(() => {
                // تحليل المشاعر
                const emotions = analyzeTextEmotions(text);

                // تحليل معنى النص
                const meaning = analyzeTextMeaning(text);

                // البحث عن المشاعر المسيطرة
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

                    // تحديث المشاعر المسيطرة
                    const dominantEmotionElement = document.getElementById('emotion-value');
                    if (dominantEmotionElement && dominantEmotion) {
                        dominantEmotionElement.innerHTML = `<i class="fas ${dominantEmotion.icon}" style="color: ${dominantEmotion.color}"></i> ${dominantEmotion.name}`;
                    }

                    // تحديث مستوى الثقة
                    const confidenceProgress = document.getElementById('confidence-progress');
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
