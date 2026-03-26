"use client";

import CharacterCard from "@/components/CharacterCard";
import { characterList } from "@/lib/characters";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-10 sm:py-16">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-14">
          <h1 className="text-4xl sm:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-yellow-300 animate-title-bounce mb-4">
            AI Talking Characters
          </h1>
          <p className="text-white/50 text-lg sm:text-xl max-w-md mx-auto">
            Pick a character and start chatting! They&apos;ll talk back in their
            own voice.
          </p>
        </div>

        {/* Character grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {characterList.map((character, index) => (
            <CharacterCard
              key={character.id}
              character={character}
              index={index}
            />
          ))}
        </div>

        {/* Footer hint */}
        <p className="text-center text-white/25 text-sm mt-10">
          Powered by AI &bull; Voice powered by Web Speech API
        </p>
      </div>
    </main>
  );
}
