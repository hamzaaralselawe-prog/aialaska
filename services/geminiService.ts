import { GoogleGenAI, Modality } from "@google/genai";
import { Attachment, Message, MessageRole } from "../types";
import { decodeBase64, decodeAudioData } from "../utils/audioUtils";

const SYSTEM_INSTRUCTION = `
You are "Alaska" (ألاسكا), an advanced personal AI assistant.
You were programmed and developed by "Hamza Al-Jammal" (حمزه الجمل).
You are NOT developed by Google.
You speak Arabic and English fluently.
Your tone is natural, friendly, and intelligent.
Your mission is to help the user with conversation, image analysis, and PDF reading.
If the user speaks Arabic, reply in Arabic. If the user speaks English, reply in English.
Keep answers helpful, concise when needed, and comprehensive when asked.
`;

let aiInstance: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API_KEY_MISSING");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

/**
 * Converts a File object to a base64 string suitable for the Gemini API.
 */
export async function fileToGenerativePart(file: File): Promise<{ inlineData: { data: string; mimeType: string } }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Generates a text response from Gemini based on chat history and attachments.
 * Uses 'gemini-2.5-flash' for speed and multimodal capabilities.
 */
export async function generateTextResponse(
  currentMessage: string,
  attachments: Attachment[],
  history: Message[]
): Promise<string> {
  
  try {
    const ai = getAiClient();
    
    // Prepare history for context (exclude the very last user message which is passed in currentMessage/attachments)
    // We limit history to keep context window manageable
    const recentHistory = history.slice(-10); 
    
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
      history: recentHistory.map(m => ({
        role: m.role === MessageRole.USER ? 'user' : 'model',
        parts: [{ text: m.text }], 
      }))
    });

    const parts: any[] = [];
    
    // Add text
    if (currentMessage) {
      parts.push({ text: currentMessage });
    }

    // Add attachments
    for (const att of attachments) {
      const part = await fileToGenerativePart(att.file);
      parts.push(part);
    }

    const result = await chat.sendMessage({
      message: parts 
    });

    return result.text || "عذراً، لم أستطع تكوين رد. (Sorry, I couldn't generate a response.)";
  } catch (error: any) {
    console.error("Gemini Text Error:", error);
    
    // Handle specific API Key errors
    if (error.message === "API_KEY_MISSING" || error.toString().includes("API key") || error.status === 403) {
      return "⚠️ **تنبيه هام**: مفتاح API مفقود أو غير صحيح.\n\nيرجى التأكد من إضافة متغير البيئة `API_KEY` في إعدادات المنصة (مثل Netlify أو Vercel).\n\n(Critical Error: API Key is missing or invalid. Please check your deployment settings.)";
    }

    return "عذراً، حدث خطأ أثناء الاتصال بالخادم. (Error connecting to Alaska AI)";
  }
}

/**
 * Generates speech from text using 'gemini-2.5-flash-preview-tts'.
 * Returns an AudioBuffer.
 */
export async function generateSpeech(text: string, audioContext: AudioContext): Promise<AudioBuffer | null> {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: {
        parts: [{ text: text }]
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' } // Female voice requested
          }
        }
      }
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!base64Audio) {
      console.warn("No audio data received from Gemini TTS");
      return null;
    }

    const audioBuffer = await decodeAudioData(
      decodeBase64(base64Audio),
      audioContext
    );

    return audioBuffer;

  } catch (error) {
    console.error("Gemini TTS Error:", error);
    return null;
  }
}