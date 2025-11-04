
// معالج أحداث تحليل مشاعر النص
// يتعامل مع زر تحليل مشاعر النص

document.addEventListener('DOMContentLoaded', function() {
    // تهيئة أحداث تحليل النصوص
    initTextEmotionEvents();
});

// تهيئة أحداث تحليل النصوص
function initTextEmotionEvents() {
    const analyzeBtn = document.getElementById('analyze-text-emotion-btn');

    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', async function() {
            const textInput = document.getElementById('sentiment-text');
            const text = textInput.value.trim();

            if (!text) {
                showNotification('الرجاء إدخال نص للتحليل', 'warning');
                return;
            }

            if (!window.checkApiKey()) return;

            // عرض شاشة التحميل
            showLoading();

            try {
                // تحليل المشاعر من النص
                if (window.emotionAnalysis && window.emotionAnalysis.analyzeText) {
                    // تعيين مفتاح API
                    window.emotionAnalysisAPI_KEY = localStorage.getItem('openai_api_key');
                    const result = await window.emotionAnalysis.analyzeText(text);

                    // عرض النتائج
                    displayEmotionResults(result, 'text');

                    // إخفاء شاشة التحميل
                    hideLoading();

                    // عرض إشعار النجاح
                    showNotification('تم تحليل مشاعر النص بنجاح', 'success');
                } else {
                    // استخدام دالة تحليل النصوص الموجودة في ai-assistant-new.js
                    const originalAnalyzeBtn = document.getElementById('analyze-sentiment-btn');
                    if (originalAnalyzeBtn) {
                        originalAnalyzeBtn.click();
                    }
                }
            } catch (error) {
                console.error('Error analyzing text emotion:', error);
                hideLoading();
                showNotification('فشل تحليل مشاعر النص: ' + error.message, 'error');
            }
        });
    }
}
