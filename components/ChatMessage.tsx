import React from 'react';
import { Message, MessageRole, Language } from '../types';
import { Bot, User, Volume2, FileText } from 'lucide-react';
import { getTranslation } from '../utils/translations';

interface ChatMessageProps {
  message: Message;
  language: Language;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, language }) => {
  const isUser = message.role === MessageRole.USER;
  const t = getTranslation(language);

  // Determine alignment based on language direction
  // If language is AR (RTL): User starts (right), Bot ends (left)
  // If language is EN (LTR): User starts (left), Bot ends (right)
  // Actually, typical chat UX: User is always "me" (end/right in LTR, left in RTL?? No, usually User Right, Bot Left regardless of RTL)
  // Let's stick to standard chat logic: User = End (Right in LTR, Left in RTL), Bot = Start (Left in LTR, Right in RTL)
  // Tailwind `justify-start` is Left in LTR, Right in RTL.
  
  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-start' : 'justify-end'}`}>
      <div className={`flex max-w-[85%] md:max-w-[70%] ${isUser ? 'flex-row' : 'flex-row-reverse'} gap-3`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isUser ? 'bg-slate-200 text-slate-600' : 'bg-blue-600 text-white shadow-lg shadow-blue-200'}`}>
          {isUser ? <User size={20} /> : <Bot size={20} />}
        </div>

        {/* Bubble */}
        <div className={`flex flex-col ${isUser ? 'items-start' : 'items-end'}`}>
          {/* Sender Name */}
          <span className="text-xs text-slate-400 mb-1 px-1">
            {isUser ? t.you : t.bot_name}
          </span>

          <div className={`p-4 rounded-2xl shadow-sm relative ${
            isUser 
              ? 'bg-white text-slate-800 rounded-tr-none' 
              : 'bg-blue-600 text-white rounded-tl-none'
          }`}>
            
            {/* Attachments Preview */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {message.attachments.map((att, idx) => (
                  <div key={idx} className="relative group overflow-hidden rounded-lg border border-white/20">
                    {att.type === 'image' ? (
                      <img src={att.previewUrl} alt="Attachment" className="w-32 h-32 object-cover" />
                    ) : (
                      <div className="w-32 h-20 bg-slate-100/10 flex flex-col items-center justify-center p-2 text-xs">
                        <FileText size={24} className="mb-1" />
                        <span className="truncate w-full text-center">{att.file.name}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Text Content */}
            <p className="whitespace-pre-wrap leading-relaxed text-sm md:text-base text-left" style={{ textAlign: language === 'ar' && /[\u0600-\u06FF]/.test(message.text) ? 'right' : 'inherit', direction: language === 'ar' && /[\u0600-\u06FF]/.test(message.text) ? 'rtl' : 'ltr' }}>
              {message.text}
            </p>

            {/* Audio Indicator */}
            {message.isAudioPlaying && (
              <div className="absolute -left-8 top-1/2 -translate-y-1/2 p-2 bg-blue-100 rounded-full animate-pulse text-blue-600">
                <Volume2 size={16} />
              </div>
            )}
          </div>
          
          <span className="text-[10px] text-slate-300 mt-1 px-1">
            {message.timestamp.toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;