"use client";

import { useState, FormEvent } from "react";
import VoiceButton from "./VoiceButton";

interface Props {
  onSend: (message: string) => void;
  disabled?: boolean;
  isListening: boolean;
  voiceSupported: boolean;
  onVoiceToggle: () => void;
  transcript: string;
}

export default function MessageInput({
  onSend,
  disabled,
  isListening,
  voiceSupported,
  onVoiceToggle,
  transcript,
}: Props) {
  const [text, setText] = useState("");

  const displayText = isListening ? transcript : text;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const message = displayText.trim();
    if (!message || disabled) return;
    onSend(message);
    setText("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full">
      {/* Voice button */}
      <VoiceButton
        isListening={isListening}
        isSupported={voiceSupported}
        onClick={onVoiceToggle}
        disabled={disabled}
      />

      {/* Text input */}
      <div className="flex-1 relative">
        <input
          type="text"
          value={displayText}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            isListening ? "Listening..." : "Type a message..."
          }
          disabled={disabled || isListening}
          className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 focus:bg-white/15 transition-all disabled:opacity-40"
        />
        {isListening && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          </div>
        )}
      </div>

      {/* Send button */}
      <button
        type="submit"
        disabled={disabled || !displayText.trim()}
        className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center justify-center hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
        </svg>
      </button>
    </form>
  );
}
