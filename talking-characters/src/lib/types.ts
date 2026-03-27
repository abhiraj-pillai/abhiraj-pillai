export interface VoiceConfig {
  pitch: number;
  rate: number;
  volume: number;
  voiceName?: string;
  voiceGender: "male" | "female";
  effects?: {
    distortion?: number;    // 0-1, for raspy/gritty voices (Rick)
    tremolo?: number;       // 0-1, for shaky voices (Morty)
    echo?: number;          // 0-1, for deep/reverb voices (Zoro)
  };
}

export interface Character {
  id: string;
  name: string;
  emoji: string;
  image: string;
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
