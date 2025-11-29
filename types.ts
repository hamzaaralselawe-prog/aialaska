export enum MessageRole {
  USER = 'user',
  MODEL = 'model'
}

export interface Attachment {
  file: File;
  previewUrl: string;
  type: 'image' | 'pdf';
  base64?: string;
}

export interface Message {
  id: string;
  role: MessageRole;
  text: string;
  attachments?: Attachment[];
  timestamp: Date;
  isAudioPlaying?: boolean; // To track if this specific message is currently speaking
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  isRecording: boolean;
}

export type Language = 'ar' | 'en';