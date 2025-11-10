// ===== وظائف تحليل الوجوه والمشاعر المتقدمة =====

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

                        let analysisOptions = [];
                        if (detectEmotions) analysisOptions.push('المشاعر');
                        if (detectAge) analysisOptions.push('العمر التقريبي');
                        if (detectGender) analysisOptions.push('الجنس');

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
                                "smile": true
                              }
                            }
                          ],
                          "statistics": {
                            "totalFaces": 1,
                            "averageAge": "30",
                            "genderDistribution": {"male": 1, "female": 0},
                            "emotionDistribution": {"happy": 0.1, "sad": 0.2, "angry": 0.05, "surprised": 0.1, "neutral": 0.5, "fearful": 0.05, "disgusted": 0.0}
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
            ctx.font = 'bold 18px Arial';
            ctx.fillText(face.id.toString(), x + 8, y - 8);

            // رسم المشاعر إذا كانت متاحة
            if (face.emotion) {
                // تحديد المشاعر الرئيسية
                const emotions = Object.entries(face.emotion);
                emotions.sort((a, b) => b[1] - a[1]);
                const dominantEmotion = emotions[0][0];

                // رسم أيقونة المشاعر
                const emotionIcon = getEmotionIcon(dominantEmotion);
                ctx.font = '20px FontAwesome';
                ctx.fillStyle = emotionColors[dominantEmotion] || '#ffffff';
                ctx.fillText(emotionIcon, x + width - 30, y - 8);
            }
        });

        // تحديث عرض الصورة
        canvas.style.width = previewImage.clientWidth + 'px';
        canvas.style.height = previewImage.clientHeight + 'px';
        previewImage.style.display = 'none';
    }

    // إنشاء ملخص إحصائي
    let statisticsHTML = '';
    if (facesData.statistics) {
        statisticsHTML = '<div class="statistics-card">';
        statisticsHTML += '<h3><i class="fas fa-chart-pie"></i> إحصائيات تحليل الوجوه</h3>';

        // عدد الوجوه
        statisticsHTML += `<div class="stat-item"><span class="stat-label">عدد الوجوه:</span><span class="stat-value">${facesData.statistics.totalFaces || facesData.faces.length}</span></div>`;

        // متوسط العمر
        if (facesData.statistics.averageAge) {
            statisticsHTML += `<div class="stat-item"><span class="stat-label">متوسط العمر:</span><span class="stat-value">${facesData.statistics.averageAge}</span></div>`;
        }

        // توزيع الجنس
        if (facesData.statistics.genderDistribution) {
            const genderDist = facesData.statistics.genderDistribution;
            const totalFaces = genderDist.male + genderDist.female;
            const malePercentage = totalFaces > 0 ? Math.round((genderDist.male / totalFaces) * 100) : 0;
            const femalePercentage = totalFaces > 0 ? Math.round((genderDist.female / totalFaces) * 100) : 0;

            statisticsHTML += '<div class="stat-item"><span class="stat-label">توزيع الجنس:</span>';
            statisticsHTML += `<div class="gender-distribution">`;
            statisticsHTML += `<div class="gender-bar male" style="width: ${malePercentage}%">${malePercentage}% ذكور</div>`;
            statisticsHTML += `<div class="gender-bar female" style="width: ${femalePercentage}%">${femalePercentage}% إناث</div>`;
            statisticsHTML += `</div></div>`;
        }

        // توزيع المشاعر
        if (facesData.statistics.emotionDistribution) {
            const emotions = Object.entries(facesData.statistics.emotionDistribution);
            emotions.sort((a, b) => b[1] - a[1]);

            statisticsHTML += '<div class="stat-item"><span class="stat-label">المشاعر العامة:</span>';
            statisticsHTML += '<div class="emotion-distribution">';

            emotions.forEach(([emotion, value]) => {
                const percentage = Math.round(value * 100);
                const emotionArabic = getEmotionArabicName(emotion);
                const emotionColor = emotionColors[emotion] || '#ffffff';

                statisticsHTML += `<div class="emotion-stat">`;
                statisticsHTML += `<div class="emotion-name">${emotionArabic}</div>`;
                statisticsHTML += `<div class="emotion-bar-container">`;
                statisticsHTML += `<div class="emotion-bar" style="width: ${percentage}%; background: ${emotionColor}"></div>`;
                statisticsHTML += `</div>`;
                statisticsHTML += `<div class="emotion-value">${percentage}%</div>`;
                statisticsHTML += `</div>`;
            });

            statisticsHTML += '</div></div>';
        }

        statisticsHTML += '</div>';
    }

    // إنشاء HTML لعرض تفاصيل الوجوه
    let facesHTML = '';

    if (statisticsHTML) {
        facesHTML += statisticsHTML;
    }

    facesHTML += '<div class="faces-summary">';
    facesHTML += `<div class="result-message success-message"><i class="fas fa-user-check"></i><h3>تم تحديد ${facesData.faces.length} وجه</h3></div>`;
    facesHTML += '</div>';

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
                const emotionArabic = getEmotionArabicName(emotion);
                const emotionClass = `emotion-${emotion}`;
                const percentage = Math.round(value * 100);

                facesHTML += `<div class="emotion-item">`;
                facesHTML += `<div class="emotion-name">`;
                facesHTML += `<span>${emotionArabic}</span>`;
                facesHTML += `<span class="emotion-percentage">${percentage}%</span>`;
                facesHTML += `</div>`;
                facesHTML += `<div class="emotion-bar">`;
                facesHTML += `<div class="emotion-fill ${emotionClass}" data-width="${percentage}%" style="width: 0%"></div>`;
                facesHTML += `</div>`;
                facesHTML += `</div>`;
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

        // الميزات الإضافية
        if (face.features) {
            facesHTML += '<div class="face-features">';
            facesHTML += '<h5>الميزات المميزة:</h5>';
            facesHTML += '<div class="features-list">';

            Object.entries(face.features).forEach(([feature, value]) => {
                if (value === true) {
                    const featureName = getFeatureArabicName(feature);
                    const featureIcon = getFeatureIcon(feature);
                    facesHTML += `<div class="feature-tag"><i class="fas ${featureIcon}"></i> ${featureName}</div>`;
                }
            });

            facesHTML += '</div>';
            facesHTML += '</div>';
        }

        facesHTML += '</div>';
    });

    facesHTML += '</div>';

    analysisResult.innerHTML = facesHTML;

    // تحريك أشرطة المشاعر
    setTimeout(() => {
        document.querySelectorAll('.emotion-fill').forEach(bar => {
            const width = bar.getAttribute('data-width');
            if (width) {
                bar.style.width = width;
            }
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
        'happy': '\uf118', // fa-smile
        'sad': '\uf5b4', // fa-sad-tear
        'angry': '\uf556', // fa-angry
        'surprised': '\uf2c2', // fa-surprise
        'neutral': '\uf11a', // fa-meh
        'fearful': '\uf57f', // fa-grimace
        'disgusted': '\uf5c4' // fa-tired
    };

    return icons[emotion] || '\uf11a';
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

    // إضافة مستمعي الأحداث
    initializeFaceDetection();
});

// دالة تهيئة تحليل الوجوه
function initializeFaceAnalysis() {
    // التأكد من وجود مفتاح API
    if (!apiKey) {
        showNotification('الرجاء إدخال مفتاح OpenAI API أولاً', 'warning');
    }

    // تعيين نوع التحليل الافتراضي
    const optionCards = document.querySelectorAll('.option-card');
    if (optionCards.length > 0) {
        optionCards[0].click();
    }
}
