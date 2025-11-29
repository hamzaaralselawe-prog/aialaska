import React, { useRef, useState, ChangeEvent } from 'react';
import { Send, Mic, Paperclip, X, StopCircle, FileText } from 'lucide-react';
import { Attachment, Language } from '../types';
import { getTranslation } from '../utils/translations';

interface InputAreaProps {
  onSendMessage: (text: string, attachments: Attachment[]) => void;
  isLoading: boolean;
  isRecording: boolean;
  onToggleRecording: () => void;
  language: Language;
}

const InputArea: React.FC<InputAreaProps> = ({ 
  onSendMessage, 
  isLoading, 
  isRecording, 
  onToggleRecording,
  language
}) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = getTranslation(language);

  const handleSend = () => {
    if ((!text.trim() && attachments.length === 0) || isLoading) return;
    onSendMessage(text, attachments);
    setText('');
    setAttachments([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const type = file.type.startsWith('image/') ? 'image' : 'pdf';
      
      // Simple validation
      if (type === 'pdf' && file.type !== 'application/pdf') return;

      const previewUrl = URL.createObjectURL(file);
      setAttachments(prev => [...prev, { file, previewUrl, type }]);
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
      <div className="max-w-3xl mx-auto flex flex-col gap-2">
        
        {/* Attachment Previews */}
        {attachments.length > 0 && (
          <div className="flex gap-2 overflow-x-auto py-2 px-1">
            {attachments.map((att, idx) => (
              <div key={idx} className="relative flex-shrink-0 bg-slate-50 border border-slate-200 rounded-lg p-1 w-16 h-16 flex items-center justify-center">
                {att.type === 'image' ? (
                  <img src={att.previewUrl} className="w-full h-full object-cover rounded" alt="preview" />
                ) : (
                  <FileText className="text-red-500" size={24} />
                )}
                <button 
                  onClick={() => removeAttachment(idx)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:bg-red-600 transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Controls */}
        <div className="flex items-end gap-2">
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            accept="image/*,application/pdf" 
            className="hidden" 
          />
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors flex-shrink-0"
            title={t.attachment_tooltip}
            disabled={isLoading || isRecording}
          >
            <Paperclip size={22} />
          </button>

          <div className="flex-1 bg-slate-100 rounded-2xl flex items-center px-4 py-2 focus-within:ring-2 focus-within:ring-blue-200 transition-shadow">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isRecording ? t.listening : t.input_placeholder}
              className="w-full bg-transparent border-none focus:ring-0 resize-none text-slate-700 placeholder-slate-400 max-h-32 py-2"
              rows={1}
              style={{ minHeight: '44px' }}
              disabled={isLoading || isRecording}
            />
          </div>

          {text.trim() || attachments.length > 0 ? (
            <button 
              onClick={handleSend}
              disabled={isLoading}
              className={`p-3 rounded-full text-white shadow-lg transition-all transform hover:scale-105 active:scale-95 ${
                isLoading ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <Send size={22} className={isLoading ? 'opacity-50' : ''} />
            </button>
          ) : (
            <button 
              onClick={onToggleRecording}
              className={`p-3 rounded-full shadow-lg transition-all transform hover:scale-105 active:scale-95 flex-shrink-0 relative ${
                isRecording 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
              }`}
            >
               {isRecording ? <StopCircle size={22} /> : <Mic size={22} />}
               {/* Pulse Ring for recording */}
               {isRecording && (
                 <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping top-0 left-0"></span>
               )}
            </button>
          )}

        </div>
        
        <div className="text-center text-[10px] text-slate-400 mt-1">
          {t.developed_by}
        </div>
      </div>
    </div>
  );
};

export default InputArea;