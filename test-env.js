// ملف لاختبار قراءة متغيرات البيئة

// اختبار تحميل متغيرات البيئة
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Testing environment variable loading...');
    
    // تحميل متغيرات البيئة
    if (window.loadEnv) {
        await window.loadEnv();
        
        // التحقق من متغير OPENAI_API_KEY
        if (window.getEnvVar) {
            const apiKey = window.getEnvVar('OPENAI_API_KEY');
            if (apiKey) {
                console.log('API key found:', apiKey.substring(0, 10) + '...');
            } else {
                console.error('API key not found in environment variables');
            }
        }
    } else {
        console.error('loadEnv function not available');
    }
});