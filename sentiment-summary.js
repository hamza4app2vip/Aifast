// ملخص المشاعر (نسخة محسّنة باللغة العربية بفهم سياقي)
class SentimentSummary {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`لا يمكن العثور على عنصر الحاوية: ${containerId}`);
            return;
        }

        this.emotions = {
            happy: { name: 'سعادة', color: '#FFD166', icon: 'fa-smile', value: 0 },
            sad: { name: 'حزن', color: '#118AB2', icon: 'fa-sad-tear', value: 0 },
            angry: { name: 'غضب', color: '#EF476F', icon: 'fa-angry', value: 0 },
            surprised: { name: 'دهشة', color: '#7209B7', icon: 'fa-surprise', value: 0 },
            neutral: { name: 'حياد', color: '#8D99AE', icon: 'fa-meh', value: 0 },
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
                    <div class="dominant-emotion-label">المشاعر السائدة:</div>
                    <div class="dominant-emotion-value">لا توجد بيانات بعد</div>
                </div>
                <div class="summary-actions">
                    <button id="analyze-sentiment-btn" class="btn btn-primary">
                        <i class="fas fa-brain"></i> تحليل المشاعر
                    </button>
                    <button id="reset-sentiment-btn" class="btn btn-secondary">
                        <i class="fas fa-redo"></i> إعادة ضبط
                    </button>
                </div>
            </div>
        `;

        this.initChart();
    }

    initChart() {
        const ctx = document.getElementById('sentiment-chart');
        if (!ctx) return;

        const labels = Object.values(this.emotions).map(emotion => emotion.name);
        const data = Object.values(this.emotions).map(emotion => emotion.value);
        const backgroundColor = Object.values(this.emotions).map(emotion => emotion.color);

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
        Object.keys(this.emotions).forEach(key => {
            if (emotionsData[key] !== undefined) {
                this.emotions[key].value = emotionsData[key];
            }
        });

        this.updateUI();
        this.updateChart();
        this.updateDominantEmotion();
    }

    updateUI() {
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
        const data = Object.values(this.emotions).map(emotion => emotion.value);
        this.chart.data.datasets[0].data = data;
        this.chart.update();
    }

    updateDominantEmotion() {
        let dominantEmotion = null;
        let maxValue = 0;

        Object.entries(this.emotions).forEach(([key, emotion]) => {
            if (emotion.value > maxValue) {
                maxValue = emotion.value;
                dominantEmotion = emotion;
            }
        });

        const dominantEmotionValue = document.querySelector('.dominant-emotion-value');
        if (dominantEmotionValue && dominantEmotion) {
            dominantEmotionValue.innerHTML = `
                <i class="fas ${dominantEmotion.icon}" style="color: ${dominantEmotion.color}"></i>
                ${dominantEmotion.name} (${dominantEmotion.value}%)
            `;
        }
    }

    // ----------------------
    // Arabic NLP utilities
    // ----------------------
    normalizeArabic(text) {
        if (!text) return '';
        return text
            .toLowerCase()
            .replace(/[\u064B-\u0652]/g, '')
            .replace(/\u0640/g, '')
            .replace(/[ـ]+/g, '')
            .replace(/[“”«»]/g, '"')
            .replace(/[’‘']/g, "'")
            .replace(/[\u061F\?]+/g, '?')
            .replace(/[!！]+/g, '!')
            .replace(/\s+/g, ' ')
            .trim();
    }

    tokenize(text) {
        if (!text) return [];
        return text
            .split(/[\s,;:\-\(\)\[\]\{\}\.|\n\r]+/)
            .filter(Boolean);
    }

    hasNegationWindow(tokens, index) {
        const negations = [
            'لا','ليس','لم','لن','ما','بدون','من غير','غير','مو','مش','ولا','مهو','موش'
        ];
        for (let i = Math.max(0, index - 3); i < index; i++) {
            if (negations.includes(tokens[i])) return true;
        }
        return false;
    }

    intensityMultiplier(tokens, index, text) {
        let mult = 1;
        const intensifiers = ['جدا','للغاية','قوي','قوووي','جداً','غاية','تماماً','حقاً','مرة'];
        const diminishers = ['قليلا','قليلاً','نوعا','نوعاً','نوعًا','شوية','بعض','إلى حد ما'];
        for (let i = Math.max(0, index - 2); i <= Math.min(tokens.length - 1, index + 2); i++) {
            if (intensifiers.includes(tokens[i])) mult *= 1.5;
            if (diminishers.includes(tokens[i])) mult *= 0.7;
        }
        if (text) {
            const exclam = (text.match(/!/g) || []).length;
            if (exclam >= 3) mult *= 1.4; else if (exclam === 2) mult *= 1.2; else if (exclam === 1) mult *= 1.1;
        }
        return mult;
    }

    emojiSignals(text) {
        const map = [
            { re: /[😀😄😁😊🙂😍🥰😻✨👍🎉👏😂]/g, key: 'happy', w: 2.0 },
            { re: /[😢😭☹️🙁😿]/g, key: 'sad', w: 2.0 },
            { re: /[😡🤬😤👿]/g, key: 'angry', w: 2.0 },
            { re: /[😱😮😲🤯]/g, key: 'surprised', w: 2.0 },
            { re: /[😨😰😥]/g, key: 'fearful', w: 2.0 },
            { re: /[🤢🤮]/g, key: 'disgusted', w: 2.0 }
        ];
        const scores = { happy:0, sad:0, angry:0, surprised:0, neutral:0, fearful:0, disgusted:0 };
        map.forEach(({re, key, w}) => {
            const m = text.match(re);
            if (m && m.length) scores[key] += m.length * w * 10;
        });
        return scores;
    }

    analyzeTextContent(rawText) {
        const text = this.normalizeArabic(rawText);
        const tokens = this.tokenize(text);

        const lex = {
            happy: ['سعيد','سعيدة','مبسوط','مبسوطة','فرح','مفرح','فرحة','ممتاز','رائع','جميل','أحب','بحب','يعجبني','أفضل','مذهل','ممتع','شيء جميل','شكرا','شكراً','الحمد لله','راضي','مرتاح','ولا أروع'],
            sad: ['حزين','حزينة','محبط','إحباط','سيء','سيئة','مؤلم','أفتقد','افتقد','للأسف','لاسف','خيبة','وحيد','بكيت','دموعي','قهر','تعبان'],
            angry: ['غاضب','غاضبة','قهر','مقرف','تافه','كرهت','كارثي','فاشل','فاشلة','مزعج','استفزازي','مستفز','عار','بلا فائدة','يا للوقاحة'],
            surprised: ['مفاجأة','مندهش','مندهشة','مذهول','لم أتوقع','غير متوقع','غريب','عجيب','واو','يا إلهي'],
            fearful: ['خائف','خايف','مرعوب','قلق','قلقان','أخشى','أخاف','مخيف','خطير','تهديد'],
            disgusted: ['مقزز','مقرف','قرف','اشمئزاز','مقززة','منفر','منفرة']
        };

        const contrastives = ['لكن','ولكن','إلا أن','إلا أنّ','رغم أن','رغم أنّ','بس'];
        const clauses = text.split(/(?:(?:\.|!|\?|،|؛)\s*|\n+)/).filter(Boolean);

        const scores = { happy:0, sad:0, angry:0, surprised:0, neutral:0, fearful:0, disgusted:0 };
        const reasons = { happy:[], sad:[], angry:[], surprised:[], neutral:[], fearful:[], disgusted:[] };

        const emojiScore = this.emojiSignals(rawText || '');
        Object.keys(scores).forEach(k => scores[k] += emojiScore[k] || 0);

        let clauseWeights = clauses.map((c, i) => ({ text: c, weight: 1 }));
        if (contrastives.some(c => text.includes(` ${c} `))) {
            const idx = clauses.length - 1;
            if (idx >= 0) clauseWeights[idx].weight *= 1.3;
            if (idx - 1 >= 0) clauseWeights[idx - 1].weight *= 0.85;
        }

        clauseWeights.forEach(({text: ctext, weight}) => {
            const ctoks = this.tokenize(ctext);
            ctoks.forEach((tk, i) => {
                Object.entries(lex).forEach(([emo, words]) => {
                    if (words.includes(tk)) {
                        let base = 12;
                        const neg = this.hasNegationWindow(ctoks, i);
                        let mult = this.intensityMultiplier(ctoks, i, ctext);
                        let val = base * mult * weight;
                        if (neg) val *= -1;
                        if (val >= 0) {
                            scores[emo] += val;
                            reasons[emo].push(tk);
                        } else {
                            scores.neutral += Math.abs(val) * 0.6;
                        }
                    }
                });
            });

            const positivePolarity = ['جيد','جيدة','كويس','كويسة','تمام','لطيف','محترم','هايل','حلو','تحسن','أفضل','مرضي'];
            const negativePolarity = ['سيء','سيئة','رديء','رديئة','سئ','سئية','كارثة','كارثي','مزري','ضعيف','مؤسف','يؤسف'];
            ctoks.forEach((tk, i) => {
                let mult = this.intensityMultiplier(ctoks, i, ctext) * weight;
                if (positivePolarity.includes(tk)) {
                    const neg = this.hasNegationWindow(ctoks, i);
                    if (!neg) { scores.happy += 10 * mult; reasons.happy.push(tk); } else { scores.sad += 6 * mult; }
                }
                if (negativePolarity.includes(tk)) {
                    const neg = this.hasNegationWindow(ctoks, i);
                    if (!neg) { scores.sad += 10 * mult; reasons.sad.push(tk); } else { scores.happy += 6 * mult; }
                }
            });
        });

        const totalSignal = Object.values(scores).reduce((a,b)=>a+b,0);
        if (totalSignal < 1) {
            scores.neutral = 100;
            return { scores, reasons };
        }

        const nonNegScores = Object.fromEntries(Object.entries(scores).map(([k,v]) => [k, Math.max(0, v)]));
        const sum = Object.values(nonNegScores).reduce((a,b)=>a+b,0) || 1;
        Object.keys(nonNegScores).forEach(k => {
            nonNegScores[k] = Math.round((nonNegScores[k] / sum) * 100);
        });
        return { scores: nonNegScores, reasons };
    }

    analyzeSentiment() {
        const analyzeBtn = document.getElementById('analyze-sentiment-btn');
        const textEl = document.getElementById('text-input');
        const rawText = textEl ? textEl.value : '';

        if (!rawText || !rawText.trim()) {
            this.showNotification('من فضلك أدخل نصاً لتحليله.', 'error');
            return;
        }

        if (analyzeBtn) {
            analyzeBtn.disabled = true;
            analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جار التحليل...';
        }

        setTimeout(() => {
            const { scores } = this.analyzeTextContent(rawText);
            this.updateEmotions(scores);

            const top = Object.entries(scores)
                .filter(([k]) => k !== 'neutral')
                .sort((a,b)=>b[1]-a[1])
                .slice(0,2);
            if (top.length) {
                const msg = `أبرز الانفعالات: ${top.map(([k,v])=>`${this.emotions[k].name} ${v}%`).join('، ')}.`;
                this.showNotification(msg, 'success');
            } else {
                this.showNotification('النص أقرب للحياد العام.', 'info');
            }

            if (analyzeBtn) {
                analyzeBtn.disabled = false;
                analyzeBtn.innerHTML = '<i class="fas fa-brain"></i> تحليل المشاعر';
            }
        }, 150);
    }

    reset() {
        Object.keys(this.emotions).forEach(key => {
            this.emotions[key].value = 0;
        });

        this.updateUI();
        this.updateChart();
        const dominantEmotionValue = document.querySelector('.dominant-emotion-value');
        if (dominantEmotionValue) {
            dominantEmotionValue.textContent = 'لا توجد بيانات بعد';
        }
        this.showNotification('تمت إعادة ضبط ملخص المشاعر', 'info');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(notification);
        setTimeout(() => { notification.classList.add('show'); }, 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => { if (notification.parentNode) notification.parentNode.removeChild(notification); }, 300);
        }, 3000);
    }
}

// تهيئة ملخص المشاعر عند تحميل الصفحة (الإبقاء على نفس السلوك)
document.addEventListener('DOMContentLoaded', () => {
    const sentimentSummary = new SentimentSummary('sentiment-summary-container');
});

