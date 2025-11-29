import React, { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Message, MessageRole, Attachment, Language } from './types';
import ChatMessage from './components/ChatMessage';
import InputArea from './components/InputArea';
import { generateTextResponse, generateSpeech } from './services/geminiService';
import { playAudioBuffer } from './utils/audioUtils';
import { getTranslation } from './utils/translations';
import { Bot, Globe } from 'lucide-react';

// Extend window definition for webkitSpeechRecognition
declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [language, setLanguage] = useState<Language>('ar');
  
  // Audio handling refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeAudioSourceRef = useRef<{ stop: () => void } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Speech Recognition Ref
  const recognitionRef = useRef<any>(null);

  const t = getTranslation(language);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle Document Direction and Language
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  // Initialize AudioContext on user interaction
  const initAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000 // Match Gemini TTS default
      });
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  // Setup Speech Recognition
  const setupRecognition = useCallback(() => {
    // Clean up old recognition if exists
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        console.warn("Could not abort previous recognition", e);
      }
    }

    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      // Set language based on app state
      recognition.lang = language === 'ar' ? 'ar-EG' : 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        handleSendMessage(transcript, [], true); 
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    } else {
      console.warn("Speech recognition not supported in this browser.");
    }
  }, [language]);

  // Re-initialize recognition when language changes
  useEffect(() => {
    setupRecognition();
  }, [language, setupRecognition]);

  const toggleRecording = useCallback(() => {
    initAudioContext();
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      if (activeAudioSourceRef.current) {
        activeAudioSourceRef.current.stop();
        activeAudioSourceRef.current = null;
      }
      recognitionRef.current?.start();
    }
  }, [isRecording]);

  const toggleLanguage = () => {
    // Stop recording if active before switching language to avoid mismatches
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    }
    setLanguage(prev => prev === 'ar' ? 'en' : 'ar');
  };

  const playResponseAudio = async (text: string, messageId: string) => {
    if (!audioContextRef.current) return;

    try {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isAudioPlaying: true } : m));
      const audioBuffer = await generateSpeech(text, audioContextRef.current);
      
      if (audioBuffer) {
        if (activeAudioSourceRef.current) {
          activeAudioSourceRef.current.stop();
        }

        const source = playAudioBuffer(audioContextRef.current, audioBuffer, () => {
           setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isAudioPlaying: false } : m));
           activeAudioSourceRef.current = null;
        });
        
        activeAudioSourceRef.current = source;
      } else {
         setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isAudioPlaying: false } : m));
      }
    } catch (e) {
      console.error("Failed to play audio", e);
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isAudioPlaying: false } : m));
    }
  };

  const handleSendMessage = async (text: string, attachments: Attachment[] = [], isVoiceMode: boolean = false) => {
    initAudioContext();
    
    if (activeAudioSourceRef.current) {
        activeAudioSourceRef.current.stop();
        activeAudioSourceRef.current = null;
        setMessages(prev => prev.map(m => ({ ...m, isAudioPlaying: false })));
    }

    const newUserMsg: Message = {
      id: uuidv4(),
      role: MessageRole.USER,
      text: text,
      attachments: attachments,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMsg]);
    setIsLoading(true);

    try {
      const aiText = await generateTextResponse(text, attachments, messages);
      
      const newAiMsg: Message = {
        id: uuidv4(),
        role: MessageRole.MODEL,
        text: aiText,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, newAiMsg]);
      setIsLoading(false);
      
      if (isVoiceMode) {
        await playResponseAudio(aiText, newAiMsg.id);
      }

    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex flex-col h-screen bg-slate-50 font-cairo`}>
      {/* Header */}
      <header className="flex-shrink-0 bg-white/80 backdrop-blur-md border-b border-slate-100 p-4 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-200">
               <Bot size={24} />
             </div>
             <div>
               <h1 className="font-bold text-lg text-slate-800">{t.app_name}</h1>
               <div className="flex items-center gap-1">
                 <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                 <p className="text-xs text-slate-500">{t.online}</p>
               </div>
             </div>
          </div>
          
          <button 
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 transition-all active:scale-95 text-sm font-semibold border border-slate-200"
          >
            <Globe size={16} />
            {language === 'ar' ? 'English' : 'عربي'}
          </button>
        </div>
      </header>

      {/* Chat History */}
      <main className="flex-1 overflow-y-auto p-4 pb-32 no-scrollbar">
        <div className="max-w-3xl mx-auto">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center text-slate-400 opacity-60">
               <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-4 text-blue-200">
                 <Bot size={48} />
               </div>
               <h2 className="text-xl font-bold text-slate-600 mb-2">{t.welcome_title}</h2>
               <p className="max-w-xs text-sm">
                 {t.welcome_desc}
               </p>
            </div>
          )}
          
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} language={language} />
          ))}
          
          {isLoading && (
            <div className="flex w-full mb-6 justify-end">
               <div className="flex flex-row-reverse items-end gap-3 max-w-[85%]">
                 <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                 </div>
                 <div className="bg-slate-100 rounded-2xl rounded-tl-none p-4 shadow-sm">
                   <span className="text-sm text-slate-500">{t.typing}</span>
                 </div>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <InputArea 
        onSendMessage={(text, att) => handleSendMessage(text, att, false)} 
        isLoading={isLoading}
        isRecording={isRecording}
        onToggleRecording={toggleRecording}
        language={language}
      />
    </div>
  );
}

export default App;