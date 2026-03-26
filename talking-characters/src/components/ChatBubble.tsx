"use client";

interface Props {
  message: string;
  isNew?: boolean;
}

export default function ChatBubble({ message, isNew = false }: Props) {
  if (!message) return null;

  return (
    <div
      className={`relative max-w-sm mx-auto ${isNew ? "animate-bubble-pop" : ""}`}
    >
      {/* Bubble */}
      <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl rounded-bl-sm px-5 py-3.5 text-white text-base leading-relaxed shadow-xl">
        {message}
      </div>

      {/* Tail */}
      <div className="absolute -bottom-1.5 left-6 w-4 h-4 bg-white/10 border-b border-l border-white/15 transform rotate-[-35deg] skew-x-[20deg]" />
    </div>
  );
}
