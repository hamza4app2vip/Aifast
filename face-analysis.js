// ===== وظائف تحليل الوجوه والمشاعر =====

// عناصر DOM
const imageUpload = document.getElementById('image-upload');
const fileName = document.getElementById('file-name');
const previewImage = document.getElementById('preview-image');
const imageQuestion = document.getElementById('image-question');
const analyzeBtn = document.getElementById('analyze-btn');
const analysisResult = document.getElementById('analysis-result');
const faceDetectionCanvas = document.getElementById('face-detection-canvas');
const ctx = faceDetectionCanvas ? faceDetectionCanvas.getContext('2d') : null;

// خيارات التحليل
const optionCards = document.querySelectorAll('.option-card');
const generalQuestion = document.getElementById('general-question');
const facesQuestion = document.getElementById('faces-question');
let currentAnalysisType = 'general';

// تبديل نوع التحليل
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
if (imageUpload) {
    imageUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            fileName.textContent = file.name;

            const reader = new FileReader();
            reader.onload = (e) => {
                previewImage.src = e.target.result;
                previewImage.style.display = 'block';

                // إعداد قماش الكشف عن الوجوه
                if (previewImage && faceDetectionCanvas && ctx) {
                    previewImage.onload = () => {
                        faceDetectionCanvas.width = previewImage.naturalWidth;
                        faceDetectionCanvas.height = previewImage.naturalHeight;
                        faceDetectionCanvas.style.display = 'block';
                        ctx.clearRect(0, 0, faceDetectionCanvas.width, faceDetectionCanvas.height);
                    };
                }
            };
            reader.readAsDataURL(file);
        }
    });
}

// تحليل الصورة عند الضغط على الزر
if (analyzeBtn) {
    analyzeBtn.addEventListener('click', async () => {
        const file = imageUpload.files[0];
        if (!file) {
            analysisResult.innerHTML = '<div class="result-message error-message"><i class="fas fa-exclamation-circle"></i><h3>لا توجد صورة</h3><p>الرجاء اختيار صورة أولاً</p></div>';
            showNotification('الرجاء اختيار صورة أولاً', 'warning');
            return;
        }

        if (!checkApiKey()) return;

        // مسح قماش الكشف عن الوجوه
        if (ctx) {
            ctx.clearRect(0, 0, faceDetectionCanvas.width, faceDetectionCanvas.height);
        }

        try {
            // تحويل الصورة إلى base64
            const reader = new FileReader();
            reader.onload = async (e) => {
                const base64Image = e.target.result.split(',')[1];

                try {
                    // تحديد المحتوى بناءً على نوع التحليل
                    let prompt;
                    if (currentAnalysisType === 'general') {
                        prompt = imageQuestion.value.trim() || 'صف محتوى هذه الصورة بالتفصيل.';
                    } else if (currentAnalysisType === 'faces') {
                        const detectEmotions = document.getElementById('detect-emotions').checked;
                        const detectAge = document.getElementById('detect-age').checked;
                        const detectGender = document.getElementById('detect-gender').checked;

                        let analysisOptions = [];
                        if (detectEmotions) analysisOptions.push('المشاعر');
                        if (detectAge) analysisOptions.push('العمر التقريبي');
                        if (detectGender) analysisOptions.push('الجنس');

                        prompt = `حلل هذه الصورة وحدد عدد الوجوه فيها. لكل وجه، حدد: ${analysisOptions.join(', ')}. قدم النتائج بتنسيق JSON كالتالي:
                        {
                          "faces": [
                            {
                              "id": 1,
                              "position": {"x": 100, "y": 100, "width": 200, "height": 200},
                              "emotion": {"happy": 0.1, "sad": 0.2, "angry": 0.05, "surprised": 0.1, "neutral": 0.5, "fearful": 0.05},
                              "age": "25-35",
                              "gender": "male"
                            }
                          ]
                        }`;
                    } else if (currentAnalysisType === 'objects') {
                        prompt = 'حدد وقائمة جميع الكائنات والعناصر الموجودة في هذه الصورة مع وصف موجز لكل منها.';
                    } else if (currentAnalysisType === 'text') {
                        prompt = 'استخرج كل النصوص الموجودة في هذه الصورة وترجمها إلى العربية إذا كانت بلغة أخرى.';
                    }

                    const response = await makeAPIRequest('chat/completions', {
                        model: 'gpt-4o',
                        messages: [
                            { role: 'system', content: 'أنت مساعد ذكي متخصص في تحليل الصور.' },
                            {
                                role: 'user',
                                content: [
                                    { type: 'text', text: prompt },
                                    {
                                        type: 'image_url',
                                        image_url: {
                                            url: `data:image/jpeg;base64,${base64Image}`
                                        }
                                    }
                                ]
                            }
                        ],
                        max_tokens: 2000
                    });

                    const analysis = response.choices[0].message.content;

                    // معالجة النتائج بناءً على نوع التحليل
                    if (currentAnalysisType === 'faces') {
                        try {
                            // محاولة تحليل JSON
                            const jsonMatch = analysis.match(/```json\s*([\s\S]*?)\s*```/);
                            if (jsonMatch) {
                                const facesData = JSON.parse(jsonMatch[1]);
                                displayFacesAnalysis(facesData);
                            } else {
                                // إذا لم يتم العثور على JSON، عرض النص كاملاً
                                analysisResult.innerHTML = `<div class="result">${analysis}</div>`;
                            }
                        } catch (e) {
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
    if (!facesData.faces || facesData.faces.length === 0) {
        analysisResult.innerHTML = `<div class="result-message warning-message"><i class="fas fa-user-slash"></i><h3>لم يتم العثور على وجوه</h3><p>لم يتمكن النظام من تحديد أي وجه في الصورة</p></div>`;
        return;
    }

    // رسم إطارات حول الوجوه
    if (ctx && previewImage) {
        facesData.faces.forEach(face => {
            const { x, y, width, height } = face.position;

            // حساب النسب بناءً على أبعاد الصورة المعروضة
            const scaleX = previewImage.clientWidth / previewImage.naturalWidth;
            const scaleY = previewImage.clientHeight / previewImage.naturalHeight;

            // رسم الإطار
            ctx.strokeStyle = '#6366f1';
            ctx.lineWidth = 3;
            ctx.strokeRect(
                x * scaleX,
                y * scaleY,
                width * scaleX,
                height * scaleY
            );

            // رسم رقم الوجه
            ctx.fillStyle = '#6366f1';
            ctx.fillRect(
                x * scaleX,
                y * scaleY - 25,
                25,
                25
            );

            ctx.fillStyle = 'white';
            ctx.font = 'bold 16px Arial';
            ctx.fillText(
                face.id.toString(),
                x * scaleX + 7,
                y * scaleY - 7
            );
        });
    }

    // إنشاء HTML لعرض تفاصيل الوجوه
    let facesHTML = '<div class="faces-summary">';
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

                facesHTML += '<div class="emotion-item">';
                facesHTML += '<div class="emotion-name">';
                facesHTML += `<span>${emotionArabic}</span>`;
                facesHTML += `<span class="emotion-percentage">${percentage}%</span>`;
                facesHTML += '</div>';
                facesHTML += '<div class="emotion-bar">';
                facesHTML += `<div class="emotion-fill ${emotionClass}" style="width: 0%"></div>`;
                facesHTML += '</div>';
                facesHTML += '</div>';
            });

            // عرض المشاعر السائدة
            facesHTML += `<div class="dominant-emotion">`;
            facesHTML += `<i class="fas fa-smile"></i> المشاعر السائدة: ${getEmotionArabicName(dominantEmotion)}`;
            facesHTML += '</div>';

            facesHTML += '</div>';
        }

        facesHTML += '</div>';
    });

    facesHTML += '</div>';

    // عرض النتائج
    analysisResult.innerHTML = facesHTML;

    // تحريك أشرطة المشاعر
    setTimeout(() => {
        document.querySelectorAll('.emotion-fill').forEach(bar => {
            const width = bar.getAttribute('style').match(/width: (\d+%)/);
            if (width) {
                bar.style.width = width[1];
            }
        });
    }, 100);
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

// دالة للتحقق من وجود مفتاح API (موجودة في الملف الرئيسي)
function checkApiKey() {
    if (typeof apiKey !== 'undefined' && apiKey) {
        return true;
    }

    showNotification('الرجاء إدخال مفتاح OpenAI API أولاً', 'warning');
    return false;
}

// دالة لإرسال طلبات API (موجودة في الملف الرئيسي)
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
            const errorData = await response.json();
            throw new Error(errorData.error.message || 'حدث خطأ في الاتصال بالخادم');
        }

        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    } finally {
        hideLoading();
    }
}

// دالة عرض التحميل (موجودة في الملف الرئيسي)
function showLoading() {
    if (typeof window.showLoading === 'function') {
        window.showLoading();
        return;
    }

    const loadingOverlay = document.getElementById('loading');
    if (loadingOverlay) {
        loadingOverlay.classList.add('active');
    }
}

// دالة إخفاء التحميل (موجودة في الملف الرئيسي)
function hideLoading() {
    if (typeof window.hideLoading === 'function') {
        window.hideLoading();
        return;
    }

    const loadingOverlay = document.getElementById('loading');
    if (loadingOverlay) {
        loadingOverlay.classList.remove('active');
    }
}

// دالة عرض الإشعارات (موجودة في الملف الرئيسي)
function showNotification(message, type = 'info') {
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
        return;
    }

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
