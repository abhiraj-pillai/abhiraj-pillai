"use client";

import Link from "next/link";
import { Character } from "@/lib/types";

interface Props {
  character: Character;
  index: number;
}

export default function CharacterCard({ character, index }: Props) {
  return (
    <Link href={`/play/${character.id}`}>
      <div
        className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 cursor-pointer transition-all duration-300 hover:scale-105 hover:border-white/25 animate-glow"
        style={{ animationDelay: `${index * 0.2}s` }}
      >
        {/* Gradient overlay */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${character.color} opacity-10 group-hover:opacity-20 transition-opacity duration-300`}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center gap-3">
          {/* Emoji avatar */}
          <div className="text-7xl transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-1">
            {character.emoji}
          </div>

          {/* Name */}
          <h3 className="text-xl font-bold text-white tracking-wide">
            {character.name}
          </h3>

          {/* Description */}
          <p className="text-sm text-white/60 italic leading-relaxed">
            &ldquo;{character.description}&rdquo;
          </p>

          {/* Talk button */}
          <div
            className={`mt-2 px-6 py-2 rounded-full bg-gradient-to-r ${character.color} text-white font-bold text-sm uppercase tracking-wider opacity-80 group-hover:opacity-100 transition-all duration-300 group-hover:shadow-lg`}
          >
            Talk!
          </div>
        </div>
      </div>
    </Link>
  );
}
