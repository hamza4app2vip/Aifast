
// تحليل مشاعر الصوت المبسط
// يحلل المشاعر من الصوت باستخدام API

// تحليل مشاعر الصوت
async function analyzeAudioEmotion(audioElement) {
    try {
        // التحقق من وجود مفتاح API
        const apiKey = window.getApiKey();
        if (!apiKey) {
            throw new Error('مفتاح API غير متاح');
        }

        // عرض شاشة التحميل
        showLoading();

        // تحويل الصوت إلى base64
        const audioBase64 = await getAudioBase64(audioElement);

        // استدعاء API لتحليل مشاعر الصوت
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('openai_api_key')}`
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
                        content: `حلل مشاعر هذا الصوت: ${audioBase64.substring(0, 100)}...`
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

        // تحليل الاستجابة
        let emotionResponse;
        try {
            emotionResponse = JSON.parse(data.choices[0].message.content);
        } catch (parseError) {
            console.error('Error parsing emotion response:', data.choices[0].message.content);
            throw new Error('فشل في تحليل استجابة مشاعر الصوت: ' + parseError.message);
        }

        // إنشاء نتيجة التحليل
        const result = {
            emotion: emotionResponse.emotion || 'neutral',
            confidence: emotionResponse.confidence || 0.7,
            scores: emotionResponse.scores || {},
            explanation: emotionResponse.explanation || '',
            timestamp: Date.now()
        };

        // إخفاء شاشة التحميل
        hideLoading();

        return result;
    } catch (error) {
        console.error('Error analyzing audio emotion:', error);
        hideLoading();
        throw error;
    }
}

// تحويل الصوت إلى base64
async function getAudioBase64(audioElement) {
    return new Promise((resolve, reject) => {
        // إنشاء سياق صوتي
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // إنشاء مصدر الصوت
        const source = audioContext.createMediaElementSource(audioElement);

        // إنشاء محلل الصوت
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;

        // ربط المصدر بالمحلل
        source.connect(analyser);
        analyser.connect(audioContext.destination);

        // إنشاء مخزن مؤقت للبيانات
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        // جمع البيانات
        analyser.getByteFrequencyData(dataArray);

        // تحويل البيانات إلى base64
        const base64 = btoa(String.fromCharCode.apply(null, dataArray));

        resolve(base64);
    });
}

// تصدير الدوال للاستخدام في الملفات الأخرى
window.audioEmotionAnalysis = {
    analyze: analyzeAudioEmotion
};
