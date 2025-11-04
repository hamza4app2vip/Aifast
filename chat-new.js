// التعامل مع زر محادثة جديدة
document.addEventListener('DOMContentLoaded', function() {
    const newChatBtn = document.getElementById('new-chat-btn');
    if (newChatBtn) {
        newChatBtn.addEventListener('click', function() {
            const chatMessages = document.getElementById('chat-messages');

            // إظهار رسالة تأكيد قبل مسح المحادثة
            if (chatMessages && chatMessages.children.length > 1) {
                if (confirm('هل أنت متأكد من أنك تريد بدء محادثة جديدة؟ سيتم حذف المحادثة الحالية.')) {
                    // مسح جميع الرسائل ما عدا رسالة الترحيب
                    while (chatMessages.children.length > 1) {
                        chatMessages.removeChild(chatMessages.lastChild);
                    }

                    // إظهار إشعار للمستخدم
                    if (typeof showNotification === 'function') {
                        showNotification('تم بدء محادثة جديدة', 'success');
                    }
                }
            } else {
                if (typeof showNotification === 'function') {
                    showNotification('أنت بالفعل في محادثة جديدة', 'info');
                }
            }
        });
    }
});

// دالة لإظهار مؤشر الكتابة
function showTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.style.display = 'flex';

        // التمرير إلى أسفل المحادثة
        const chatMessages = document.getElementById('chat-messages');
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// دالة لإخفاء مؤشر الكتابة
function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.style.display = 'none';
    }
}

// ربط دالة إرسال الرسالة مع مؤشر الكتابة
document.addEventListener('DOMContentLoaded', function() {
    const sendButton = document.getElementById('send-message');
    const chatInput = document.getElementById('chat-input');

    if (sendButton && chatInput) {
        // تعديل دالة إرسال الرسالة لإظهار مؤشر الكتابة
        const originalSendFunction = window.sendMessage || function() {};

        window.sendMessage = function() {
            // إظهار مؤشر الكتابة
            showTypingIndicator();

            // استدعاء الدالة الأصلية
            originalSendFunction();

            // إخفاء مؤشر الكتابة بعد فترة (لأغراض العرض التوضيحي)
            setTimeout(hideTypingIndicator, 3000);
        };

        // ربط الأحداث
        sendButton.addEventListener('click', window.sendMessage);
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                window.sendMessage();
            }
        });
    }
});

// دالة لإظهار الإشعارات
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notification-text');

    if (notification && notificationText) {
        notificationText.textContent = message;

        // تعديل لون الإشعار حسب النوع
        notification.className = 'notification show';
        if (type === 'success') {
            notification.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.9), rgba(5, 150, 105, 0.9))';
        } else if (type === 'error') {
            notification.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(220, 38, 38, 0.9))';
        } else {
            notification.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(37, 99, 235, 0.9))';
        }

        // إخفاء الإشعار بعد 3 ثوانٍ
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
}

// إغلاق الإشعار عند النقر على زر الإغلاق
document.addEventListener('DOMContentLoaded', function() {
    const closeNotification = document.getElementById('close-notification');
    if (closeNotification) {
        closeNotification.addEventListener('click', function() {
            const notification = document.getElementById('notification');
            if (notification) {
                notification.classList.remove('show');
            }
        });
    }
});
