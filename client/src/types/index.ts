export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type: 'text' | 'voice';
  audioUrl?: string;
}

export interface ChatRequest {
  message: string;
  conversationHistory?: Message[];
}

export interface ChatResponse {
  reply: string;
  audioUrl?: string;
}

export interface TranscribeResponse {
  text: string;
}

export interface SummarizeResponse {
  transcript: string;
  summary: string;
}

export interface TakeawaysResponse {
  takeaways: string[];
}

export interface LoginResponse {
  token: string;
  username?: string;
}

export interface VoiceRecorderState {
  isRecording: boolean;
  time: number;
  transcript: string;
  isProcessing: boolean;
}

export interface LoadingState {
  chat: boolean;
  transcript: boolean;
  takeaways: boolean;
  auth: boolean;
}

export interface AppState {
  isAuthenticated: boolean;
  messages: Message[];
  inputMode: 'text' | 'voice';
  theme: 'light' | 'dark';
  loading: LoadingState;
}
