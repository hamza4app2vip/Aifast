
// محلل المشاعر
// يحلل المشاعر في النصوص والصور

// Cache for storing analysis results
const sentimentAnalysisCache = new Map();

// Initialize the sentiment analysis module
function initSentimentAnalysis() {
    console.log('Initializing sentiment analysis module');

    // Initialize event listeners
    initEventListeners();
}

// Initialize event listeners
function initEventListeners() {
    const analyzeTextBtn = document.getElementById('analyzeTextBtn');
    const analyzeImageBtn = document.getElementById('analyzeImageBtn');
    const textInput = document.getElementById('textInput');
    const imageInput = document.getElementById('imageInput');
    const imagePreview = document.getElementById('imagePreview');

    if (analyzeTextBtn) {
        analyzeTextBtn.addEventListener('click', () => {
            const text = textInput.value.trim();
            if (text) {
                analyzeTextSentiment(text);
            } else {
                showNotification('الرجاء إدخال نص للتحليل', 'warning');
            }
        });
    }

    if (analyzeImageBtn) {
        analyzeImageBtn.addEventListener('click', () => {
            const file = imageInput.files[0];
            if (file) {
                analyzeImageSentiment(file);
            } else {
                showNotification('الرجاء اختيار صورة للتحليل', 'warning');
            }
        });
    }

    if (imageInput) {
        imageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    imagePreview.innerHTML = `<img src="${e.target.result}" alt="معاينة الصورة">`;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (textInput) {
        textInput.addEventListener('input', () => {
            const text = textInput.value;
            const charCount = document.getElementById('charCount');
            const wordCount = document.getElementById('wordCount');

            if (charCount) {
                charCount.textContent = `${text.length} / 5000 حرف`;
            }

            if (wordCount) {
                const words = text.trim() ? text.trim().split(/\s+/).length : 0;
                wordCount.textContent = `${words} كلمة`;
            }
        });
    }
}

// Analyze text sentiment
async function analyzeTextSentiment(text) {
    try {
        // Show loading
        showLoading();

        // Generate cache key
        const cacheKey = `text-${text.substring(0, 50)}-${Date.now()}`;

        // Check cache first
        if (sentimentAnalysisCache.has(cacheKey)) {
            const result = sentimentAnalysisCache.get(cacheKey);
            hideLoading();
            displaySentimentResults(result);
            return;
        }

        // Get API key
        const apiKey = localStorage.getItem('openai_api_key');
        if (!apiKey) {
            hideLoading();
            showNotification('الرجاء إدخال مفتاح OpenAI API', 'warning');
            return;
        }

        // Call API for text sentiment analysis
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: "أنت محلل متخصص للمشاعر في النصوص. قم بتحليل المشاعر في النص المقدم وحدد المشاعر الرئيسية (سعادة، حزن، غضب، خوف، مفاجأة، اشمئزاز، محايد) مع نسب مئوية دقيقة. يجب أن يكون مجموع النسب 100%. قدم شرحًا للنتائج. أرجع النتائج في صيغة json."
                    },
                    {
                        role: "user",
                        content: text
                    }
                ],
                response_format: { type: "json_object" },
                temperature: 0.1
            })
        });

        const data = await response.json();

        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error(data.error?.message || 'فشل في تحليل مشاعر النص');
        }

        // Parse sentiment response
        let sentimentResponse;
        try {
            sentimentResponse = JSON.parse(data.choices[0].message.content);
        } catch (parseError) {
            console.error('Error parsing sentiment response:', data.choices[0].message.content);
            throw new Error('فشل في تحليل استجابة مشاعر النص: ' + parseError.message);
        }

        // Create analysis result
        const result = {
            type: 'text',
            sentiment: sentimentResponse.sentiment || 'neutral',
            confidence: sentimentResponse.confidence || 0.7,
            scores: sentimentResponse.scores || {},
            explanation: sentimentResponse.explanation || '',
            timestamp: Date.now()
        };

        // Cache the result
        sentimentAnalysisCache.set(cacheKey, result);

        // Hide loading and display results
        hideLoading();
        displaySentimentResults(result);

        showNotification('تم تحليل مشاعر النص بنجاح', 'success');
    } catch (error) {
        console.error('Error analyzing text sentiment:', error);
        hideLoading();
        showNotification('فشل تحليل مشاعر النص: ' + error.message, 'error');
    }
}

// Analyze image sentiment
async function analyzeImageSentiment(file) {
    try {
        // Show loading
        showLoading();

        // Generate cache key
        const cacheKey = `image-${file.name}-${Date.now()}`;

        // Check cache first
        if (sentimentAnalysisCache.has(cacheKey)) {
            const result = sentimentAnalysisCache.get(cacheKey);
            hideLoading();
            displaySentimentResults(result);
            return;
        }

        // Get API key
        const apiKey = localStorage.getItem('openai_api_key');
        if (!apiKey) {
            hideLoading();
            showNotification('الرجاء إدخال مفتاح OpenAI API', 'warning');
            return;
        }

        // Convert image to base64
        const base64Image = await imageToBase64(file);

        // Call API for image sentiment analysis
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: "أنت محلل متخصص للمشاعر في الصور. قم بتحليل المشاعر في الصورة المقدمة وحدد المشاعر الرئيسية (سعادة، حزن، غضب، خوف، مفاجأة، اشمئزاز، محايد) مع نسب مئوية دقيقة. يجب أن يكون مجموع النسب 100%. قدم شرحًا للنتائج. أرجع النتائج في صيغة json."
                    },
                    {
                        role: "user",
                        content: [
                            {
                                type: 'text',
                                text: 'حلل مشاعر الوجه في هذه الصورة'
                            },
                            {
                                type: 'image_url',
                                image_url: `data:image/jpeg;base64,${base64Image}`
                            }
                        ]
                    }
                ],
                response_format: { type: "json_object" },
                temperature: 0.1
            })
        });

        const data = await response.json();

        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error(data.error?.message || 'فشل في تحليل مشاعر الصورة');
        }

        // Parse sentiment response
        let sentimentResponse;
        try {
            sentimentResponse = JSON.parse(data.choices[0].message.content);
        } catch (parseError) {
            console.error('Error parsing sentiment response:', data.choices[0].message.content);
            throw new Error('فشل في تحليل استجابة مشاعر الصورة: ' + parseError.message);
        }

        // Create analysis result
        const result = {
            type: 'image',
            sentiment: sentimentResponse.sentiment || 'neutral',
            confidence: sentimentResponse.confidence || 0.7,
            scores: sentimentResponse.scores || {},
            explanation: sentimentResponse.explanation || '',
            timestamp: Date.now()
        };

        // Cache the result
        sentimentAnalysisCache.set(cacheKey, result);

        // Hide loading and display results
        hideLoading();
        displaySentimentResults(result);

        showNotification('تم تحليل مشاعر الصورة بنجاح', 'success');
    } catch (error) {
        console.error('Error analyzing image sentiment:', error);
        hideLoading();
        showNotification('فشل تحليل مشاعر الصورة: ' + error.message, 'error');
    }
}

// Convert image to base64
function imageToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

// Display sentiment results
function displaySentimentResults(result) {
    const resultsSection = document.getElementById('resultsSection');
    const sentimentResults = document.getElementById('sentimentResults');

    if (!resultsSection || !sentimentResults) return;

    // Show results section
    resultsSection.style.display = 'block';

    // Clear existing content
    sentimentResults.innerHTML = '';

    // Create sentiment circle
    const sentimentCircle = document.createElement('div');
    sentimentCircle.className = 'sentiment-circle';

    // Create sentiment value
    const sentimentValue = document.createElement('div');
    sentimentValue.className = 'sentiment-value';
    sentimentValue.textContent = `${Math.round((result.scores.positive || 0) * 100)}%`;

    // Create sentiment label
    const sentimentLabel = document.createElement('div');
    sentimentLabel.className = 'sentiment-label';
    sentimentLabel.textContent = getSentimentLabel(result.sentiment);

    // Add elements to circle
    sentimentCircle.appendChild(sentimentValue);
    sentimentCircle.appendChild(sentimentLabel);

    // Create sentiment bars
    const sentimentBars = document.createElement('div');
    sentimentBars.className = 'sentiment-bars';

    // Add bars for each sentiment
    for (const [sentiment, score] of Object.entries(result.scores)) {
        if (sentiment !== 'explanation' && typeof score === 'number') {
            const barContainer = document.createElement('div');
            barContainer.className = 'sentiment-bar-container';

            const barLabel = document.createElement('div');
            barLabel.className = 'sentiment-bar-label';
            barLabel.innerHTML = `<span class="sentiment-icon fas ${getSentimentIcon(sentiment)}"></span>${getSentimentNameInArabic(sentiment)}`;

            const bar = document.createElement('div');
            bar.className = 'sentiment-bar';

            const barFill = document.createElement('div');
            barFill.className = 'sentiment-bar-fill';
            barFill.style.width = `${score * 100}%`;

            const barValue = document.createElement('span');
            barValue.className = 'sentiment-bar-value';
            barValue.textContent = `${Math.round(score * 100)}%`;

            bar.appendChild(barFill);
            bar.appendChild(barValue);

            barContainer.appendChild(barLabel);
            barContainer.appendChild(bar);

            sentimentBars.appendChild(barContainer);
        }
    }

    // Create explanation
    const explanation = document.createElement('div');
    explanation.className = 'sentiment-explanation';
    explanation.innerHTML = `<h4>شرح النتائج</h4><p>${result.explanation || 'لا يوجد شرح متاح'}</p>`;

    // Add all elements to results
    sentimentResults.appendChild(sentimentCircle);
    sentimentResults.appendChild(sentimentBars);
    sentimentResults.appendChild(explanation);

    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

// Get sentiment icon
function getSentimentIcon(sentiment) {
    const iconMap = {
        'happy': 'fa-smile',
        'sad': 'fa-sad-tear',
        'angry': 'fa-angry',
        'surprised': 'fa-surprise',
        'fearful': 'fa-grimace',
        'disgusted': 'fa-tired',
        'neutral': 'fa-meh',
        'positive': 'fa-smile',
        'negative': 'fa-frown'
    };

    return iconMap[sentiment] || 'fa-meh';
}

// Get sentiment name in Arabic
function getSentimentNameInArabic(sentiment) {
    const nameMap = {
        'happy': 'سعادة',
        'sad': 'حزن',
        'angry': 'غضب',
        'surprised': 'مفاجأة',
        'fearful': 'خوف',
        'disgusted': 'اشمئزاز',
        'neutral': 'محايد',
        'positive': 'إيجابي',
        'negative': 'سلبي'
    };

    return nameMap[sentiment] || sentiment;
}

// Get sentiment label
function getSentimentLabel(sentiment) {
    const labelMap = {
        'happy': 'سعيد',
        'sad': 'حزين',
        'angry': 'غاضب',
        'surprised': 'متفاجأ',
        'fearful': 'خائف',
        'disgusted': 'مشمئز',
        'neutral': 'محايد',
        'positive': 'إيجابي',
        'negative': 'سلبي'
    };

    return labelMap[sentiment] || 'محايد';
}

// Show loading
function showLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = 'flex';
    }
}

// Hide loading
function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = 'none';
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span class="notification-close">&times;</span>
        ${message}
    `;

    document.body.appendChild(notification);

    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    // Close notification when close button is clicked
    notification.querySelector('.notification-close').addEventListener('click', function() {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    });

    // Auto-hide notification after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// Export functions
window.sentimentAnalyzer = {
    init: initSentimentAnalysis,
    analyzeText: analyzeTextSentiment,
    analyzeImage: analyzeImageSentiment
};

// Initialize when the script loads
initSentimentAnalysis();
