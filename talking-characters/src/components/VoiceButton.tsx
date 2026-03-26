"use client";

interface Props {
  isListening: boolean;
  isSupported: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export default function VoiceButton({
  isListening,
  isSupported,
  onClick,
  disabled,
}: Props) {
  if (!isSupported) return null;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
        isListening
          ? "bg-red-500 text-white scale-110"
          : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
      } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
      title={isListening ? "Stop listening" : "Start voice input"}
    >
      {/* Pulse ring when listening */}
      {isListening && (
        <div className="absolute inset-0 rounded-full bg-red-500 animate-pulse-ring" />
      )}

      {/* Mic icon */}
      <svg
        className="w-5 h-5 relative z-10"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5z" />
        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
      </svg>
    </button>
  );
}
