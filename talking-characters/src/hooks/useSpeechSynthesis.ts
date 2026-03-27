"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { VoiceConfig } from "@/lib/types";

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setIsSupported(typeof window !== "undefined" && "speechSynthesis" in window);

    // Preload voices
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const findBestVoice = useCallback(
    (voiceConfig: VoiceConfig): SpeechSynthesisVoice | null => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) return null;

      // Try to find by specific voice name first
      if (voiceConfig.voiceName) {
        const nameMatch = voices.find(
          (v) =>
            v.name.toLowerCase().includes(voiceConfig.voiceName!.toLowerCase()) &&
            v.lang.startsWith("en")
        );
        if (nameMatch) return nameMatch;
      }

      // Filter English voices
      const englishVoices = voices.filter((v) => v.lang.startsWith("en"));
      if (englishVoices.length === 0) return voices[0] || null;

      // Try to match gender by voice name heuristics
      const maleHints = ["male", "daniel", "james", "david", "mark", "alex", "tom", "george", "fred"];
      const femaleHints = ["female", "samantha", "karen", "victoria", "fiona", "moira", "tessa"];
      const hints = voiceConfig.voiceGender === "male" ? maleHints : femaleHints;

      const genderMatch = englishVoices.find((v) =>
        hints.some((h) => v.name.toLowerCase().includes(h))
      );

      // Prefer British voices for low-pitch characters, American for high-pitch
      if (!genderMatch) {
        const britishVoice = englishVoices.find(
          (v) => v.lang === "en-GB" || v.name.toLowerCase().includes("british")
        );
        const americanVoice = englishVoices.find(
          (v) => v.lang === "en-US" || v.name.toLowerCase().includes("american")
        );

        if (voiceConfig.pitch < 0.8 && britishVoice) return britishVoice;
        if (americanVoice) return americanVoice;
      }

      return genderMatch || englishVoices[0];
    },
    []
  );

  const speak = useCallback(
    (text: string, voiceConfig: VoiceConfig) => {
      if (!isSupported) return;

      stop();

      // Preprocess text for more natural speech
      const cleanText = text
        // Convert *burp* to a pause + sound
        .replace(/\*bu+r+p\*/gi, "... burrp ...")
        // Convert *action* markers to pauses
        .replace(/\*([^*]+)\*/g, "... $1 ...")
        // Make "shishishi" more laugh-like
        .replace(/shishishi/gi, "shi shi shi")
        // Add pauses for dramatic effect on ellipsis
        .replace(/\.\.\./g, ",,, ")
        // Emphasize caps words by adding slight pauses
        .replace(/\b([A-Z]{2,})\b/g, "... $1 ...");

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.pitch = voiceConfig.pitch;
      utterance.rate = voiceConfig.rate;
      utterance.volume = voiceConfig.volume;

      const voice = findBestVoice(voiceConfig);
      if (voice) utterance.voice = voice;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      utteranceRef.current = utterance;

      // Chrome bug workaround: long utterances stop after ~15 seconds
      // Resume periodically to prevent this
      const resumeInterval = setInterval(() => {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        } else {
          clearInterval(resumeInterval);
        }
      }, 10000);

      utterance.onend = () => {
        clearInterval(resumeInterval);
        setIsSpeaking(false);
      };
      utterance.onerror = () => {
        clearInterval(resumeInterval);
        setIsSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
    },
    [isSupported, stop, findBestVoice]
  );

  return { speak, stop, isSpeaking, isSupported };
}
