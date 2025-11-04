
// تحليل مشاعر النصوص
// يحلل المشاعر في النصوص باستخدام API

// Cache for storing analysis results
const emotionAnalysisCache = new Map();

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Initialize API key
    initApiKey();

    // Initialize text input
    initTextInput();

    // Initialize analyze button
    initAnalyzeButton();
});

// Initialize API key
function initApiKey() {
    const apiKeyInput = document.getElementById('apiKeyInput');
    const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');

    // Check if API key is already saved
    const savedApiKey = localStorage.getItem('openai_api_key');
    if (savedApiKey) {
        apiKeyInput.placeholder = 'تم حفظ المفتاح في المتصفح';
        apiKeyInput.value = '';
    }

    // Save API key when button is clicked
    saveApiKeyBtn.addEventListener('click', function() {
        const apiKey = apiKeyInput.value.trim();
        if (apiKey) {
            localStorage.setItem('openai_api_key', apiKey);
            apiKeyInput.value = '';
            apiKeyInput.placeholder = 'تم حفظ المفتاح في المتصفح';
            showNotification('تم حفظ مفتاح API بنجاح', 'success');
        } else {
            showNotification('الرجاء إدخال مفتاح API صحيح', 'error');
        }
    });
}

// Initialize text input
function initTextInput() {
    const textInput = document.getElementById('textInput');
    const charCount = document.getElementById('charCount');
    const wordCount = document.getElementById('wordCount');

    // Update character and word count when text changes
    textInput.addEventListener('input', function() {
        const text = textInput.value;
        const chars = text.length;
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;

        charCount.textContent = `${chars} / 5000 حرف`;
        wordCount.textContent = `${words} كلمة`;
    });
}

// Initialize analyze button
function initAnalyzeButton() {
    const analyzeBtn = document.getElementById('analyzeBtn');
    const textInput = document.getElementById('textInput');

    // Analyze text when button is clicked
    analyzeBtn.addEventListener('click', async function() {
        const text = textInput.value.trim();

        if (!text) {
            showNotification('الرجاء إدخال نص للتحليل', 'warning');
            return;
        }

        // Check if API key is available
        const apiKey = localStorage.getItem('openai_api_key');
        if (!apiKey) {
            showNotification('الرجاء إدخال مفتاح OpenAI API أولاً', 'warning');
            return;
        }

        // Disable button while analyzing
        analyzeBtn.disabled = true;
        analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>جاري التحليل...</span>';

        try {
            // Analyze text emotion
            const result = await analyzeTextEmotion(text);

            // Display results
            displayResults(result);

            showNotification('تم تحليل مشاعر النص بنجاح', 'success');
        } catch (error) {
            console.error('Error analyzing text emotion:', error);
            showNotification('فشل تحليل مشاعر النص: ' + error.message, 'error');
        } finally {
            // Enable button
            analyzeBtn.disabled = false;
            analyzeBtn.innerHTML = '<i class="fas fa-search"></i> <span>تحليل المشاعر</span>';
        }
    });
}

// Analyze emotion from text
async function analyzeTextEmotion(text) {
    // Generate cache key
    const cacheKey = `text-${text.substring(0, 50)}-${Date.now()}`;

    // Check cache first
    if (emotionAnalysisCache.has(cacheKey)) {
        return emotionAnalysisCache.get(cacheKey);
    }

    // Get API key
    const apiKey = localStorage.getItem('openai_api_key');

    // Call API for text emotion analysis
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
                    content: "أنت محلل متخصص للمشاعر في النصوص. قم بتحليل المشاعر في النص المقدم وحدد المشاعر الرئيسية (سعادة، حزن، غضب، خوف، مفاجأة، اشمئزاز، محايد) مع نسب مئوية دقيقة. يجب أن يكون مجموع النسب 100%. قدم شرحًا للنتائج."
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

    // Parse emotion response
    let emotionResponse;
    try {
        emotionResponse = JSON.parse(data.choices[0].message.content);
    } catch (parseError) {
        console.error('Error parsing emotion response:', data.choices[0].message.content);
        throw new Error('فشل في تحليل استجابة مشاعر النص: ' + parseError.message);
    }

    // Create analysis result
    const result = {
        emotion: emotionResponse.emotion || 'neutral',
        confidence: emotionResponse.confidence || 0.7,
        scores: emotionResponse.scores || {},
        explanation: emotionResponse.explanation || '',
        timestamp: Date.now()
    };

    // Cache the result
    emotionAnalysisCache.set(cacheKey, result);

    return result;
}

// Display analysis results
function displayResults(result) {
    const resultsSection = document.getElementById('resultsSection');
    const emotionValue = document.getElementById('emotionValue');
    const emotionLabel = document.getElementById('emotionLabel');
    const positiveMeter = document.getElementById('positiveMeter');
    const negativeMeter = document.getElementById('negativeMeter');
    const explanationText = document.getElementById('explanationText');
    const emotionBars = document.getElementById('emotionBars');

    // Show results section
    resultsSection.classList.add('active');

    // Update emotion summary
    let mainEmotion, emotionPercentage;
    if (result.scores.positive > result.scores.negative && result.scores.positive > result.scores.neutral) {
        mainEmotion = 'إيجابي';
        emotionPercentage = result.scores.positive;
    } else if (result.scores.negative > result.scores.positive && result.scores.negative > result.scores.neutral) {
        mainEmotion = 'سلبي';
        emotionPercentage = result.scores.negative;
    } else {
        mainEmotion = 'محايد';
        emotionPercentage = result.scores.neutral;
    }

    emotionValue.textContent = `${emotionPercentage}%`;
    emotionLabel.textContent = mainEmotion;

    // Update meters
    positiveMeter.style.width = `${result.scores.positive || 0}%`;
    negativeMeter.style.width = `${result.scores.negative || 0}%`;

    // Update explanation
    explanationText.textContent = result.explanation || 'لا يوجد شرح متاح';

    // Update emotion bars
    emotionBars.innerHTML = '';

    for (const [emotion, value] of Object.entries(result.scores)) {
        if (emotion !== 'explanation' && typeof value === 'number') {
            const barContainer = document.createElement('div');
            barContainer.className = 'emotion-bar-container';

            const barLabel = document.createElement('div');
            barLabel.className = 'emotion-label';
            barLabel.innerHTML = `<span class="emotion-icon fas ${getEmotionIcon(emotion)}"></span>${getEmotionNameInArabic(emotion)}`;

            const bar = document.createElement('div');
            bar.className = 'emotion-fill';

            const barFill = document.createElement('div');
            barFill.className = 'emotion-fill-inner';
            barFill.style.width = `${value}%`;

            const barValue = document.createElement('span');
            barValue.className = 'emotion-value';
            barValue.textContent = `${value}%`;

            bar.appendChild(barFill);
            bar.appendChild(barValue);

            barContainer.appendChild(barLabel);
            barContainer.appendChild(bar);

            emotionBars.appendChild(barContainer);
        }
    }
}

// Get emotion icon
function getEmotionIcon(emotion) {
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

    return iconMap[emotion] || 'fa-meh';
}

// Get emotion name in Arabic
function getEmotionNameInArabic(emotion) {
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

    return nameMap[emotion] || emotion;
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
