export interface VoiceConfig {
  pitch: number;
  rate: number;
  voiceName?: string;
}

export interface Character {
  id: string;
  name: string;
  emoji: string;
  description: string;
  color: string;
  bgGradient: string;
  personality: string;
  voiceConfig: VoiceConfig;
  greeting: string;
  catchphrases: string[];
}

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  characterId: string;
  message: string;
  history: Message[];
}

export interface ChatResponse {
  response: string;
}
