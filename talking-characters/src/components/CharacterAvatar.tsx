"use client";

import { useState, useCallback } from "react";
import { Character } from "@/lib/types";

interface Props {
  character: Character;
  isSpeaking: boolean;
  isProcessing: boolean;
}

export default function CharacterAvatar({
  character,
  isSpeaking,
  isProcessing,
}: Props) {
  const [isPoked, setIsPoked] = useState(false);

  const handlePoke = useCallback(() => {
    setIsPoked(true);
    setTimeout(() => setIsPoked(false), 500);
  }, []);

  const getAnimationClass = () => {
    if (isPoked) return "animate-poke";
    if (isSpeaking) return "animate-talking";
    return "animate-idle";
  };

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      {/* Ambient particles */}
      <div className="relative">
        {/* Glow ring behind character */}
        <div
          className={`absolute inset-0 rounded-full bg-gradient-to-r ${character.color} opacity-20 blur-2xl scale-150`}
        />

        {/* Character emoji */}
        <div
          className={`relative text-[120px] sm:text-[150px] cursor-pointer select-none ${getAnimationClass()} transition-all`}
          onClick={handlePoke}
          role="button"
          aria-label={`Poke ${character.name}`}
        >
          {character.emoji}
        </div>
      </div>

      {/* Stage shadow */}
      <div className="stage-shadow" />

      {/* Processing indicator */}
      {isProcessing && (
        <div className="flex items-center gap-1.5 mt-2">
          <div className="thinking-dot w-2.5 h-2.5 rounded-full bg-white/70" />
          <div className="thinking-dot w-2.5 h-2.5 rounded-full bg-white/70" />
          <div className="thinking-dot w-2.5 h-2.5 rounded-full bg-white/70" />
        </div>
      )}

      {/* Character name */}
      <p className="text-white/40 text-sm font-medium mt-1">
        {isPoked
          ? character.catchphrases[
              Math.floor(Math.random() * character.catchphrases.length)
            ]
          : `Tap ${character.name} to poke!`}
      </p>
    </div>
  );
}
