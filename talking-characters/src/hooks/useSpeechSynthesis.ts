"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { VoiceConfig } from "@/lib/types";

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const speak = useCallback(
    (text: string, voiceConfig: VoiceConfig) => {
      if (!isSupported) return;

      stop();

      // Clean up text for speech (remove *burp* style annotations)
      const cleanText = text
        .replace(/\*([^*]+)\*/g, "$1")
        .replace(/shishishi/gi, "shi shi shi");

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.pitch = voiceConfig.pitch;
      utterance.rate = voiceConfig.rate;

      // Try to find a matching voice
      const voices = window.speechSynthesis.getVoices();
      if (voiceConfig.voiceName) {
        const match = voices.find((v) =>
          v.name.toLowerCase().includes(voiceConfig.voiceName!.toLowerCase())
        );
        if (match) utterance.voice = match;
      }

      // Fallback: pick an English voice
      if (!utterance.voice && voices.length > 0) {
        const englishVoice = voices.find((v) => v.lang.startsWith("en"));
        if (englishVoice) utterance.voice = englishVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [isSupported, stop]
  );

  return { speak, stop, isSpeaking, isSupported };
}
