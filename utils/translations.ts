import { Language } from '../types';

export const translations = {
  ar: {
    app_name: "ألاسكا (Alaska)",
    online: "متصل الآن",
    welcome_title: "مرحباً، أنا ألاسكا",
    welcome_desc: "مساعدك الذكي الشخصي. طورني حمزه الجمل لمساعدتك في التحدث، وتحليل الصور، وقراءة المستندات.",
    typing: "جاري الكتابة...",
    input_placeholder: "اكتب رسالتك هنا...",
    listening: "جاري الاستماع...",
    developed_by: "تم التطوير بواسطة حمزه الجمل (Alaska AI)",
    you: "أنت",
    bot_name: "ألاسكا",
    attachment_tooltip: "إرفاق صورة أو ملف PDF",
    error_response: "عذراً، لم أستطع تكوين رد.",
    error_connection: "عذراً، حدث خطأ أثناء الاتصال بالخادم."
  },
  en: {
    app_name: "Alaska AI",
    online: "Online",
    welcome_title: "Hello, I am Alaska",
    welcome_desc: "Your personal AI assistant. Developed by Hamza Al-Jammal to help you chat, analyze images, and read documents.",
    typing: "Typing...",
    input_placeholder: "Type your message here...",
    listening: "Listening...",
    developed_by: "Developed by Hamza Al-Jammal (Alaska AI)",
    you: "You",
    bot_name: "Alaska",
    attachment_tooltip: "Attach image or PDF",
    error_response: "Sorry, I couldn't generate a response.",
    error_connection: "Sorry, error connecting to the server."
  }
};

export const getTranslation = (lang: Language) => translations[lang];