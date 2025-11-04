// إصلاح بنية الكود
document.addEventListener('DOMContentLoaded', function() {
    // التعامل مع زر محادثة جديدة
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
