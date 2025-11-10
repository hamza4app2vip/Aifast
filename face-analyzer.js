// ===== وظائف تحليل الوجوه والمشاعر المتقدمة =====

// متغيرات API
const API_BASE_URL = 'https://api.openai.com/v1';
let apiKey = localStorage.getItem('openai_api_key') || '';

// متغيرات عامة
let faceDetectionModel = null;
let currentImage = null;
let detectedFaces = [];
let emotionColors = {
    'happy': '#FFD166',
    'sad': '#118AB2', 
    'angry': '#EF476F',
    'surprised': '#7209B7',
    'neutral': '#8D99AE',
    'fearful': '#4CC9F0',
    'disgusted': '#90BE6D'
};

// تهيئة عناصر DOM
function initializeFaceDetection() {
    const canvas = document.getElementById('face-detection-canvas');
    const ctx = canvas ? canvas.getContext('2d') : null;

    // عناصر DOM
    const imageUpload = document.getElementById('image-upload');
    const fileName = document.getElementById('file-name');
    const previewImage = document.getElementById('preview-image');
    const analyzeBtn = document.getElementById('analyze-btn');
    const analysisResult = document.getElementById('analysis-result');

    if (!canvas || !ctx || !imageUpload || !analyzeBtn || !analysisResult) {
        console.error('Required DOM elements not found');
        return;
    }

    // تبديل بين أنواع التحليل
    const optionCards = document.querySelectorAll('.option-card');
    const generalQuestion = document.getElementById('general-question');
    const facesQuestion = document.getElementById('faces-question');
    let currentAnalysisType = 'general';

    if (optionCards) {
        optionCards.forEach(card => {
            card.addEventListener('click', () => {
                // إزالة الكلاس النشط من كل البطاقات
                optionCards.forEach(c => c.classList.remove('active'));
                // إضافة الكلاس النشط للبطاقة المحددة
                card.classList.add('active');

                // حفظ نوع التحليل المحدد
                currentAnalysisType = card.getAttribute('data-option');

                // إخفاء جميع أسئلة التحليل
                document.querySelectorAll('.analysis-question').forEach(q => {
                    q.style.display = 'none';
                });

                // إظهار السؤال المناسب
                if (currentAnalysisType === 'general') {
                    generalQuestion.style.display = 'block';
                } else if (currentAnalysisType === 'faces') {
                    facesQuestion.style.display = 'block';
                }
            });
        });
    }

    // التعامل مع رفع الصور
    imageUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            fileName.textContent = file.name;

            const reader = new FileReader();
            reader.onload = (e) => {
                previewImage.src = e.target.result;
                previewImage.style.display = 'block';
                currentImage = new Image();
                currentImage.src = e.target.result;

                // إعداد قماش الكشف عن الوجوه
                currentImage.onload = () => {
                    canvas.width = currentImage.naturalWidth;
                    canvas.height = currentImage.naturalHeight;
                    canvas.style.display = 'block';
                    ctx.clearRect(0, 0, canvas.width, canvas.height);

                    // مسح نتائج التحليل السابقة
                    analysisResult.innerHTML = '<div class="placeholder">نتيجة التحليل ستظهر هنا</div>';
                    detectedFaces = [];
                };
            };
            reader.readAsDataURL(file);
        }
    });

    // تحليل الصورة عند الضغط على الزر
    analyzeBtn.addEventListener('click', async () => {
        const file = imageUpload.files[0];
        if (!file) {
            analysisResult.innerHTML = '<div class="result-message error-message"><i class="fas fa-exclamation-circle"></i><h3>لا توجد صورة</h3><p>الرجاء اختيار صورة أولاً</p></div>';
            showNotification('الرجاء اختيار صورة أولاً', 'warning');
            return;
        }

        if (!checkApiKey()) return;

        // مسح قماش الكشف عن الوجوه
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        detectedFaces = [];

        try {
            // تحويل الصورة إلى base64
            const reader = new FileReader();
            reader.onload = async (e) => {
                const base64Image = e.target.result.split(',')[1];

                try {
                    // تحديد المحتوى بناءً على نوع التحليل
                    let prompt;
                    if (currentAnalysisType === 'general') {
                        const imageQuestion = document.getElementById('image-question');
                        prompt = imageQuestion.value.trim() || 'صف محتوى هذه الصورة بالتفصيل.';
                    } else if (currentAnalysisType === 'faces') {
                        const detectEmotions = document.getElementById('detect-emotions').checked;
                        const detectAge = document.getElementById('detect-age').checked;
                        const detectGender = document.getElementById('detect-gender').checked;
                        const detectFeatures = document.getElementById('detect-features').checked;
                        const analyzeExpressions = document.getElementById('analyze-expressions').checked;

                        let analysisOptions = [];
                        if (detectEmotions) analysisOptions.push('المشاعر');
                        if (detectAge) analysisOptions.push('العمر التقريبي');
                        if (detectGender) analysisOptions.push('الجنس');
                        if (detectFeatures) analysisOptions.push('الميزات المميزة');
                        if (analyzeExpressions) analysisOptions.push('تعبيرات الوجه');

                        prompt = `حلل هذه الصورة وحدد عدد الوجوه فيها بدقة. لكل وجه، حدد: ${analysisOptions.join(', ')}. قدم النتائج بتنسيق JSON كامل وصحيح كالتالي:
                        {
                          "faces": [
                            {
                              "id": 1,
                              "position": {"x": 100, "y": 100, "width": 200, "height": 200},
                              "emotion": {"happy": 0.1, "sad": 0.2, "angry": 0.05, "surprised": 0.1, "neutral": 0.5, "fearful": 0.05, "disgusted": 0.0},
                              "age": "25-35",
                              "gender": "male",
                              "features": {
                                "glasses": false,
                                "beard": true,
                                "mustache": false,
                                "smile": true,
                                "hat": false,
                                "makeup": false
                              },
                              "expression": "smiling"
                            }
                          ],
                          "statistics": {
                            "totalFaces": 1,
                            "averageAge": "30",
                            "genderDistribution": {"male": 1, "female": 0},
                            "emotionDistribution": {"happy": 0.1, "sad": 0.2, "angry": 0.05, "surprised": 0.1, "neutral": 0.5, "fearful": 0.05, "disgusted": 0.0},
                            "featuresDistribution": {"glasses": 0, "beard": 1, "mustache": 0, "smile": 1, "hat": 0, "makeup": 0}
                          }
                        }`;
                    } else if (currentAnalysisType === 'objects') {
                        prompt = 'حدد وقائمة جميع الكائنات والعناصر الموجودة في هذه الصورة مع وصف موجز لكل منها.';
                    } else if (currentAnalysisType === 'text') {
                        prompt = 'استخرج كل النصوص الموجودة في هذه الصورة وترجمها إلى العربية إذا كانت بلغة أخرى.';
                    }

                    const response = await makeAPIRequest('chat/completions', {
                        model: 'gpt-4o',
                        messages: [
                            { 
                                role: 'system', 
                                content: 'أنت مساعد ذكي متخصص في تحليل الصور والتعرف على الوجوه والمشاعر. قدم دائماً إجابات دقيقة ومفصلة.' 
                            },
                            {
                                role: 'user',
                                content: [
                                    { type: 'text', text: prompt },
                                    {
                                        type: 'image_url',
                                        image_url: {
                                            url: `data:image/jpeg;base64,${base64Image}`,
                                            detail: "high"
                                        }
                                    }
                                ]
                            }
                        ],
                        max_tokens: 3000,
                        temperature: 0.2
                    });

                    const analysis = response.choices[0].message.content;

                    // معالجة النتائج بناءً على نوع التحليل
                    if (currentAnalysisType === 'faces') {
                        try {
                            // محاولة تحليل JSON
                            let facesData;

                            // محاولة استخراج JSON من النص
                            const jsonMatch = analysis.match(/```json\s*([\s\S]*?)\s*```/);
                            if (jsonMatch) {
                                facesData = JSON.parse(jsonMatch[1]);
                            } else {
                                // محاولة البحث عن JSON مباشرة
                                const jsonStart = analysis.indexOf('{');
                                const jsonEnd = analysis.lastIndexOf('}');
                                if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
                                    const jsonStr = analysis.substring(jsonStart, jsonEnd + 1);
                                    facesData = JSON.parse(jsonStr);
                                } else {
                                    // إذا لم يتم العثور على JSON، عرض النص كاملاً
                                    analysisResult.innerHTML = `<div class="result">${analysis}</div>`;
                                    return;
                                }
                            }

                            // عرض نتائج تحليل الوجوه
                            displayFacesAnalysis(facesData);
                        } catch (e) {
                            console.error('Error parsing faces response:', e);
                            // في حالة حدوث خطأ في تحليل JSON، عرض النص كاملاً
                            analysisResult.innerHTML = `<div class="result">${analysis}</div>`;
                        }
                    } else {
                        analysisResult.innerHTML = `<div class="result">${analysis}</div>`;
                    }
                } catch (error) {
                    analysisResult.innerHTML = `<div class="result-message error-message"><i class="fas fa-exclamation-circle"></i><h3>خطأ في التحليل</h3><p>${error.message}</p></div>`;
                    showNotification(error.message, 'error');
                }
            };
            reader.readAsDataURL(file);
        } catch (error) {
            analysisResult.innerHTML = `<div class="result-message error-message"><i class="fas fa-exclamation-circle"></i><h3>خطأ في المعالجة</h3><p>${error.message}</p></div>`;
            showNotification(error.message, 'error');
        }
    });
}

// عرض نتائج تحليل الوجوه
function displayFacesAnalysis(facesData) {
    const canvas = document.getElementById('face-detection-canvas');
    const ctx = canvas ? canvas.getContext('2d') : null;
    const previewImage = document.getElementById('preview-image');
    const analysisResult = document.getElementById('analysis-result');

    if (!facesData.faces || facesData.faces.length === 0) {
        analysisResult.innerHTML = `<div class="result-message warning-message"><i class="fas fa-user-slash"></i><h3>لم يتم العثور على وجوه</h3><p>لم يتمكن النظام من تحديد أي وجه في الصورة</p></div>`;
        return;
    }

    // حفظ بيانات الوجوه المكتشفة
    detectedFaces = facesData.faces;

    // رسم إطارات حول الوجوه
    if (ctx && previewImage && currentImage) {
        // حساب النسب بناءً على أبعاد الصورة المعروضة
        const scaleX = previewImage.clientWidth / currentImage.naturalWidth;
        const scaleY = previewImage.clientHeight / currentImage.naturalHeight;

        // رسم الصورة كخلفية
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(currentImage, 0, 0);

        // تطبيق تأثير ضبابي خفيف
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1.0;

        // رسم إطارات حول الوجوه
        facesData.faces.forEach(face => {
            const { x, y, width, height } = face.position;

            // رسم منطقة الوجه
            ctx.save();

            // إنشاء مسار مقطوع للوجه
            ctx.beginPath();
            ctx.rect(x, y, width, height);
            ctx.clip();

            // استعادة الصورة الأصلية في منطقة الوجه
            ctx.drawImage(currentImage, 0, 0, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);

            ctx.restore();

            // رسم إطار حول الوجه
            ctx.strokeStyle = '#6366f1';
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, width, height);

            // رسم تدرج لوني حول الإطار
            const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
            gradient.addColorStop(0, '#6366f1');
            gradient.addColorStop(1, '#8b5cf6');
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 4;
            ctx.strokeRect(x - 2, y - 2, width + 4, height + 4);

            // رسم رقم الوجه
            ctx.fillStyle = '#6366f1';
            ctx.fillRect(x, y - 30, 30, 30);

            ctx.fillStyle = 'white';
            ctx.font = 'bold 16px Arial';
            ctx.fillText(
                face.id.toString(),
                x + 7,
                y - 7
            );
        });
    }

    // إنشاء HTML لعرض تفاصيل الوجوه
    let facesHTML = '<div class="faces-summary">';
    facesHTML += `<div class="result-message success-message"><i class="fas fa-user-check"></i><h3>تم تحديد ${facesData.faces.length} وجه</h3></div>`;
    facesHTML += '</div>';

    // إضافة إحصائيات عامة
    if (facesData.statistics) {
        facesHTML += '<div class="stats-container">';

        // إحصائيات العمر
        if (facesData.statistics.averageAge) {
            facesHTML += '<div class="stat-card">';
            facesHTML += '<div class="stat-header">';
            facesHTML += '<i class="fas fa-birthday-cake"></i>';
            facesHTML += '<h4>متوسط العمر</h4>';
            facesHTML += '</div>';
            facesHTML += `<div class="stat-value">${facesData.statistics.averageAge}</div>`;
            facesHTML += '</div>';
        }

        // إحصائيات الجنس
        if (facesData.statistics.genderDistribution) {
            facesHTML += '<div class="stat-card">';
            facesHTML += '<div class="stat-header">';
            facesHTML += '<i class="fas fa-venus-mars"></i>';
            facesHTML += '<h4>توزيع الجنس</h4>';
            facesHTML += '</div>';
            facesHTML += '<div class="stat-values">';

            if (facesData.statistics.genderDistribution.male > 0) {
                facesHTML += `<div class="stat-value male">${facesData.statistics.genderDistribution.male} ذكر</div>`;
            }

            if (facesData.statistics.genderDistribution.female > 0) {
                facesHTML += `<div class="stat-value female">${facesData.statistics.genderDistribution.female} أنثى</div>`;
            }

            facesHTML += '</div>';
            facesHTML += '</div>';
        }

        // إحصائيات المشاعر
        if (facesData.statistics.emotionDistribution) {
            facesHTML += '<div class="stat-card">';
            facesHTML += '<div class="stat-header">';
            facesHTML += '<i class="fas fa-smile"></i>';
            facesHTML += '<h4>توزيع المشاعر</h4>';
            facesHTML += '</div>';

            facesHTML += '<div class="emotion-stats">';

            Object.entries(facesData.statistics.emotionDistribution).forEach(([emotion, value]) => {
                if (value > 0) {
                    const emotionArabic = getEmotionArabicName(emotion);
                    const emotionClass = `emotion-${emotion}`;
                    const percentage = Math.round(value * 100);

                    facesHTML += `<div class="emotion-stat-item">`;
                    facesHTML += `<div class="emotion-stat-label">${emotionArabic}</div>`;
                    facesHTML += `<div class="emotion-stat-bar">`;
                    facesHTML += `<div class="emotion-stat-fill ${emotionClass}" style="width: ${percentage}%"></div>`;
                    facesHTML += `</div>`;
                    facesHTML += `<div class="emotion-stat-value">${percentage}%</div>`;
                    facesHTML += `</div>`;
                }
            });

            facesHTML += '</div>';
            facesHTML += '</div>';
        }

        facesHTML += '</div>';
    }

    facesHTML += '<div class="faces-analysis">';

    facesData.faces.forEach(face => {
        facesHTML += '<div class="face-card">';

        // رأس البطاقة
        facesHTML += '<div class="face-header">';
        facesHTML += `<div class="face-number">${face.id}</div>`;
        facesHTML += '<div class="face-info">';
        facesHTML += '<h4>الوجه رقم ' + face.id + '</h4>';

        if (face.age) {
            facesHTML += `<p>العمر التقريبي: ${face.age}</p>`;
        }

        if (face.gender) {
            const genderText = face.gender === 'male' ? 'ذكر' : 'أنثى';
            const genderIcon = face.gender === 'male' ? 'fa-mars' : 'fa-venus';
            facesHTML += `<p>الجنس: ${genderText} <i class="fas ${genderIcon}"></i></p>`;
        }

        facesHTML += '</div>';
        facesHTML += '</div>';

        // تحليل المشاعر
        if (face.emotion) {
            facesHTML += '<div class="emotions-chart">';

            // تحديد المشاعر الرئيسية
            const emotions = Object.entries(face.emotion);
            emotions.sort((a, b) => b[1] - a[1]);
            const dominantEmotion = emotions[0][0];

            // عرض المشاعر كأشرطة
            emotions.forEach(([emotion, value]) => {
                if (value > 0) {
                    const emotionArabic = getEmotionArabicName(emotion);
                    const emotionClass = `emotion-${emotion}`;
                    const percentage = Math.round(value * 100);

                    facesHTML += `<div class="emotion-item">`;
                    facesHTML += `<div class="emotion-name">`;
                    facesHTML += `<span>${emotionArabic}</span>`;
                    facesHTML += `<span class="emotion-percentage">${percentage}%</span>`;
                    facesHTML += `</div>`;
                    facesHTML += `<div class="emotion-bar">`;
                    facesHTML += `<div class="emotion-fill ${emotionClass}" data-width="${percentage}%"></div>`;
                    facesHTML += `</div>`;
                    facesHTML += `</div>`;
                }
            });

            // عرض المشاعر المسيطرة
            const dominantEmotionArabic = getEmotionArabicName(dominantEmotion);
            const dominantEmotionIcon = getEmotionIcon(dominantEmotion);
            facesHTML += `<div class="dominant-emotion">`;
            facesHTML += `<i class="fas ${dominantEmotionIcon}"></i>`;
            facesHTML += `المشاعر المسيطرة: ${dominantEmotionArabic}`;
            facesHTML += `</div>`;

            facesHTML += '</div>';
        }

        // تحليل الميزات
        if (face.features) {
            facesHTML += '<div class="features-section">';
            facesHTML += '<h4>الميزات المميزة:</h4>';

            Object.entries(face.features).forEach(([feature, hasFeature]) => {
                if (hasFeature) {
                    const featureArabic = getFeatureArabicName(feature);
                    const featureIcon = getFeatureIcon(feature);

                    facesHTML += `<div class="feature-item">`;
                    facesHTML += `<i class="fas ${featureIcon}"></i>`;
                    facesHTML += `<span>${featureArabic}</span>`;
                    facesHTML += `</div>`;
                }
            });

            facesHTML += '</div>';
        }

        // تحليل التعبير
        if (face.expression) {
            facesHTML += '<div class="expression-section">';
            facesHTML += '<h4>تعبير الوجه:</h4>';

            const expressionArabic = getExpressionArabicName(face.expression);
            const expressionIcon = getExpressionIcon(face.expression);

            facesHTML += `<div class="expression-item">`;
            facesHTML += `<i class="fas ${expressionIcon}"></i>`;
            facesHTML += `<span>${expressionArabic}</span>`;
            facesHTML += `</div>`;

            facesHTML += '</div>';
        }

        facesHTML += '</div>';
    });

    facesHTML += '</div>';

    analysisResult.innerHTML = facesHTML;

    // تحريك أشرطة المشاعر
    setTimeout(() => {
        document.querySelectorAll('.emotion-fill').forEach(bar => {
            const width = bar.getAttribute('data-width') || bar.style.width;
            bar.style.width = width;
        });
    }, 300);
}

// الحصول على اسم المشاعر بالعربية
function getEmotionArabicName(emotion) {
    const emotions = {
        'happy': 'سعادة',
        'sad': 'حزن',
        'angry': 'غضب',
        'surprised': 'مفاجأة',
        'neutral': 'محايد',
        'fearful': 'خوف',
        'disgusted': 'اشمئزاز'
    };

    return emotions[emotion] || emotion;
}

// الحصول على أيقونة المشاعر
function getEmotionIcon(emotion) {
    const icons = {
        'happy': 'fa-smile',
        'sad': 'fa-sad-tear',
        'angry': 'fa-angry',
        'surprised': 'fa-surprise',
        'neutral': 'fa-meh',
        'fearful': 'fa-grimace',
        'disgusted': 'fa-tired'
    };

    return icons[emotion] || 'fa-meh';
}

// الحصول على اسم الميزة بالعربية
function getFeatureArabicName(feature) {
    const features = {
        'glasses': 'نظارات',
        'beard': 'لحية',
        'mustache': 'شارب',
        'smile': 'ابتسامة',
        'hat': 'قبعة',
        'makeup': 'مكياج'
    };

    return features[feature] || feature;
}

// الحصول على أيقونة الميزة
function getFeatureIcon(feature) {
    const icons = {
        'glasses': 'fa-glasses',
        'beard': 'fa-cut',
        'mustache': 'fa-cut',
        'smile': 'fa-smile',
        'hat': 'fa-hat-cowboy',
        'makeup': 'fa-palette'
    };

    return icons[feature] || 'fa-check';
}

// الحصول على اسم التعبير بالعربية
function getExpressionArabicName(expression) {
    const expressions = {
        'smiling': 'يبتسم',
        'frowning': 'يحدق',
        'surprised': 'متفاجئ',
        'winking': 'ينظر بوميض',
        'neutral': 'محايد',
        'laughing': 'يضحك',
        'crying': 'يبكي'
    };

    return expressions[expression] || expression;
}

// الحصول على أيقونة التعبير
function getExpressionIcon(expression) {
    const icons = {
        'smiling': 'fa-smile',
        'frowning': 'fa-frown',
        'surprised': 'fa-surprise',
        'winking': 'fa-wink',
        'neutral': 'fa-meh',
        'laughing': 'fa-laugh',
        'crying': 'fa-sad-tear'
    };

    return icons[expression] || 'fa-meh';
}

// دالة مساعدة لتحليل الاستجابة من OpenAI
function parseFacesResponse(response) {
    try {
        // محاولة استخراج JSON من النص
        const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[1]);
        }

        // محاولة البحث عن JSON مباشرة
        const jsonStart = response.indexOf('{');
        const jsonEnd = response.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
            const jsonStr = response.substring(jsonStart, jsonEnd + 1);
            return JSON.parse(jsonStr);
        }

        // إذا لم يتم العثور على JSON، إرجاع null
        return null;
    } catch (e) {
        console.error('Error parsing faces response:', e);
        return null;
    }
}

// دالة للتحقق من وجود مفتاح API
function checkApiKey() {
    if (typeof apiKey !== 'undefined' && apiKey) {
        return true;
    }

    showNotification('الرجاء إدخال مفتاح OpenAI API أولاً', 'warning');
    return false;
}

// دالة لإرسال طلبات API
async function makeAPIRequest(endpoint, payload) {
    if (typeof window.makeAPIRequest === 'function') {
        return window.makeAPIRequest(endpoint, payload);
    }

    showLoading();

    try {
        const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        hideLoading();
        throw error;
    }
}

// دالة لعرض الإشعارات
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notification-text');

    if (notification && notificationText) {
        notificationText.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.add('show');

        // إخفاء الإشعار تلقائيًا بعد 5 ثوانٍ
        setTimeout(() => {
            notification.classList.remove('show');
        }, 5000);
    }
}

// دالة لعرض شاشة التحميل
function showLoading() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
    }
}

// دالة لإخفاء شاشة التحميل
function hideLoading() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

// دالة لحفظ مفتاح API
function setupApiKeyHandler() {
    const apiKeyInput = document.getElementById('api-key-input');
    const saveApiKeyBtn = document.getElementById('save-api-key-btn');
    
    // تعيين قيمة مفتاح API الحالي إذا كان موجوداً
    if (apiKey) {
        apiKeyInput.value = apiKey;
    }
    
    // حفظ مفتاح API عند الضغط على الزر
    if (saveApiKeyBtn) {
        saveApiKeyBtn.addEventListener('click', () => {
            const newApiKey = apiKeyInput.value.trim();
            if (newApiKey) {
                apiKey = newApiKey;
                localStorage.setItem('openai_api_key', apiKey);
                showNotification('تم حفظ مفتاح API بنجاح', 'success');
            } else {
                showNotification('الرجاء إدخال مفتاح API صالح', 'warning');
            }
        });
    }
}

// دالة لتحليل الصور عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    // التأكد من أن عناصر DOM موجودة
    const imageUpload = document.getElementById('image-upload');
    const analyzeBtn = document.getElementById('analyze-btn');
    const analysisResult = document.getElementById('analysis-result');

    if (!imageUpload || !analyzeBtn || !analysisResult) {
        console.error('Required DOM elements not found');
        return;
    }

    // إعداد معالج مفتاح API
    setupApiKeyHandler();
    
    // إضافة مستمعي الأحداث
    initializeFaceDetection();
});
