
// تحليل المشاعر المتكامل
// يحلل المشاعر من النصوص والوجوه والصوت

// Cache for storing analysis results
const emotionAnalysisCache = new Map();

// Initialize the emotion analysis module
function initEmotionAnalysis() {
    try {
        console.log('Initializing emotion analysis module');

        // Check if API_KEY is available from the parent scope
        if (typeof API_KEY === 'undefined' && window.API_KEY) {
            window.emotionAnalysisAPI_KEY = window.API_KEY;
        } else if (typeof API_KEY !== 'undefined') {
            window.emotionAnalysisAPI_KEY = API_KEY;
        } else if (typeof localStorage !== 'undefined' && localStorage.getItem('openai_api_key')) {
            window.emotionAnalysisAPI_KEY = localStorage.getItem('openai_api_key');
        } else {
            console.warn('API_KEY not found. Emotion analysis may not work properly.');
        }
    } catch (error) {
        console.error('Error initializing emotion analysis:', error);
    }
}

// Analyze emotion from text
async function analyzeTextEmotion(text) {
    try {
        // Generate cache key
        const cacheKey = `text-${text.substring(0, 50)}-${Date.now()}`;

        // Check cache first
        if (emotionAnalysisCache.has(cacheKey)) {
            return emotionAnalysisCache.get(cacheKey);
        }

        // Get API key
        const apiKey = localStorage.getItem('openai_api_key');
        if (!apiKey) {
            throw new Error('مفتاح API غير متاح');
        }

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
    } catch (error) {
        console.error('Error analyzing text emotion:', error);
        throw error;
    }
}

// Analyze emotion from face
async function analyzeFaceEmotion(imageElement) {
    try {
        // Generate cache key
        const cacheKey = `face-${imageElement.src}-${Date.now()}`;

        // Check cache first
        if (emotionAnalysisCache.has(cacheKey)) {
            return emotionAnalysisCache.get(cacheKey);
        }

        // Get API key
        const apiKey = localStorage.getItem('openai_api_key');
        if (!apiKey) {
            throw new Error('مفتاح API غير متاح');
        }

        // Convert image to base64
        const base64Image = await imageToBase64(imageElement);

        // Call API for face emotion analysis
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
                        content: "أنت محلل متخصص للمشاعر في الوجوه. قم بتحليل المشاعر في الصورة المقدمة وحدد المشاعر الرئيسية (سعادة، حزن، غضب، خوف، مفاجأة، اشمئزاز، محايد) مع نسب مئوية دقيقة. يجب أن يكون مجموع النسب 100%. قدم شرحًا للنتائج."
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
            throw new Error(data.error?.message || 'فشل في تحليل مشاعر الوجه');
        }

        // Parse emotion response
        let emotionResponse;
        try {
            emotionResponse = JSON.parse(data.choices[0].message.content);
        } catch (parseError) {
            console.error('Error parsing emotion response:', data.choices[0].message.content);
            throw new Error('فشل في تحليل استجابة مشاعر الوجه: ' + parseError.message);
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
    } catch (error) {
        console.error('Error analyzing face emotion:', error);
        throw error;
    }
}

// Analyze emotion from audio
async function analyzeAudioEmotion(audioElement) {
    try {
        // Generate cache key
        const cacheKey = `audio-${audioElement.src}-${Date.now()}`;

        // Check cache first
        if (emotionAnalysisCache.has(cacheKey)) {
            return emotionAnalysisCache.get(cacheKey);
        }

        // Get API key
        const apiKey = localStorage.getItem('openai_api_key');
        if (!apiKey) {
            throw new Error('مفتاح API غير متاح');
        }

        // Convert audio to base64
        const base64Audio = await audioToBase64(audioElement);

        // Call API for audio emotion analysis
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
                        content: "أنت محلل متخصص للمشاعر في الصوت. قم بتحليل المشاعر في الصوت المقدم وحدد المشاعر الرئيسية (سعادة، حزن، غضب، خوف، مفاجأة، اشمئزاز، محايد) مع نسب مئوية دقيقة. يجب أن يكون مجموع النسب 100%. قدم شرحًا للنتائج."
                    },
                    {
                        role: "user",
                        content: `حلل مشاعر هذا الصوت: ${base64Audio.substring(0, 100)}...`
                    }
                ],
                response_format: { type: "json_object" },
                temperature: 0.1
            })
        });

        const data = await response.json();

        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error(data.error?.message || 'فشل في تحليل مشاعر الصوت');
        }

        // Parse emotion response
        let emotionResponse;
        try {
            emotionResponse = JSON.parse(data.choices[0].message.content);
        } catch (parseError) {
            console.error('Error parsing emotion response:', data.choices[0].message.content);
            throw new Error('فشل في تحليل استجابة مشاعر الصوت: ' + parseError.message);
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
    } catch (error) {
        console.error('Error analyzing audio emotion:', error);
        throw error;
    }
}

// Convert image to base64
async function imageToBase64(img) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        ctx.drawImage(img, 0, 0);

        const dataURL = canvas.toDataURL('image/jpeg', 0.8);
        const base64 = dataURL.split(',')[1];

        resolve(base64);
    });
}

// Convert audio to base64
async function audioToBase64(audio) {
    return new Promise((resolve) => {
        const reader = new FileReader();

        reader.onload = function() {
            const result = reader.result.split(',')[1];
            resolve(result);
        };

        reader.readAsDataURL(audio.src);
    });
}

// Export functions
window.emotionAnalysis = {
    init: initEmotionAnalysis,
    analyzeText: analyzeTextEmotion,
    analyzeFace: analyzeFaceEmotion,
    analyzeAudio: analyzeAudioEmotion
};

// Initialize when the script loads
initEmotionAnalysis();

// Log initialization
console.log('Emotion Analysis module initialized');
