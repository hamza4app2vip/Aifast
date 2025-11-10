function updateEmotionChart(result) {
    try {
    const canvas = document.getElementById('emotion-chart');

    if (!canvas) return;

    // تدمج النتائج في تنسيق موحد
    let emotionsData = {};

    if (result && result.scores && typeof result.scores === 'object') {
        emotionsData = result.scores;
    } else if (result.emotion && result.confidence) {
        // إنشاء بيانات من مشاعر واحد
        emotionsData[result.emotion] = result.confidence;

        // إضافة مشاعر أخرى بقيم منخفضة
        const commonEmotions = ['happy', 'sad', 'angry', 'surprised', 'fearful', 'disgusted', 'neutral'];
        commonEmotions.forEach(emotion => {
            if (!emotionsData[emotion]) {
                emotionsData[emotion] = Math.random() * 0.2; // قيم عشوائية منخفضة
            }
        });

        // تطبيع القيم
        const values = Object.values(emotionsData).map(v => Number(v) || 0);
        const total = values.reduce((sum, val) => sum + val, 0);
        if (total > 0) {
            Object.keys(emotionsData).forEach(key => {
                const v = Number(emotionsData[key]) || 0;
                emotionsData[key] = (v / total) * 100;
            });
        }
    }
    } catch (err) { console.error('updateEmotionChart failed:', err); }

    // تحويل أسماء المشاعر إلى العربية
    const arabicLabels = {};
    Object.keys(emotionsData).forEach(key => {
        arabicLabels[key] = getEmotionNameInArabic(key);
    });

    // إنشاء أو تحديث الرسم البياني
    const ctx = canvas.getContext('2d');

    // تدمج الرسم البياني إذا كان موجودًا
    if (window.emotionChartInstance) {
        window.emotionChartInstance.destroy();
    }

    // إنشاء رسم بياني جديد
    window.emotionChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(emotionsData).map(key => arabicLabels[key]),
            datasets: [{
                label: 'نسبة المشاعر (%)',
                data: Object.values(emotionsData).map(val => Math.round(val * 10) / 10),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.5)',   // حزن
                    'rgba(54, 162, 235, 0.5)',   // خوف
                    'rgba(255, 206, 86, 0.5)',   // غضب
                    'rgba(75, 192, 192, 0.5)',   // مفاجأة
                    'rgba(153, 102, 255, 0.5)',  // سعادة
                    'rgba(255, 159, 64, 0.5)',   // اشمئزاز
                    'rgba(201, 203, 207, 0.5)'   // محايد
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)',
                    'rgba(201, 203, 207, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
