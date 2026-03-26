"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getCharacter } from "@/lib/characters";
import { Message } from "@/lib/types";
import CharacterAvatar from "@/components/CharacterAvatar";
import ChatBubble from "@/components/ChatBubble";
import MessageInput from "@/components/MessageInput";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

type AppState = "idle" | "listening" | "processing" | "speaking";

export default function PlayPage() {
  const params = useParams();
  const router = useRouter();
  const characterId = params.characterId as string;
  const character = getCharacter(characterId);

  const [appState, setAppState] = useState<AppState>("idle");
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentBubble, setCurrentBubble] = useState("");
  const [bubbleKey, setBubbleKey] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const messagesRef = useRef<Message[]>([]);

  const { speak, stop: stopSpeaking, isSpeaking, isSupported: ttsSupported } = useSpeechSynthesis();
  const {
    startListening,
    stopListening,
    transcript,
    isListening,
    isSupported: sttSupported,
  } = useSpeechRecognition();

  // Keep ref in sync
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Show greeting on mount
  useEffect(() => {
    if (character) {
      setCurrentBubble(character.greeting);
      setBubbleKey((k) => k + 1);

      // Speak greeting after a short delay (voices need time to load)
      const timer = setTimeout(() => {
        if (ttsSupported) {
          speak(character.greeting, character.voiceConfig);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [character]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync speaking state
  useEffect(() => {
    if (appState === "speaking" && !isSpeaking) {
      setAppState("idle");
    }
  }, [isSpeaking, appState]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!character || appState === "processing" || appState === "speaking") return;

      setAppState("processing");
      stopSpeaking();

      const newUserMessage: Message = { role: "user", content: text };
      const updatedHistory = [...messagesRef.current, newUserMessage];
      setMessages(updatedHistory);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            characterId: character.id,
            message: text,
            history: messagesRef.current.slice(-10),
          }),
        });

        if (!res.ok) throw new Error("API error");

        const data = await res.json();
        const assistantMessage: Message = {
          role: "assistant",
          content: data.response,
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setCurrentBubble(data.response);
        setBubbleKey((k) => k + 1);

        if (voiceEnabled && ttsSupported) {
          setAppState("speaking");
          speak(data.response, character.voiceConfig);
        } else {
          setAppState("idle");
        }
      } catch {
        setCurrentBubble("*static noises* ...something went wrong. Try again!");
        setBubbleKey((k) => k + 1);
        setAppState("idle");
      }
    },
    [character, appState, voiceEnabled, ttsSupported, speak, stopSpeaking]
  );

  const handleVoiceToggle = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening((finalText) => {
        if (finalText.trim()) {
          sendMessage(finalText.trim());
        }
      });
    }
  }, [isListening, stopListening, startListening, sendMessage]);

  if (!character) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <div className="text-center text-white">
          <p className="text-6xl mb-4">🤔</p>
          <p className="text-xl mb-4">Character not found!</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
          >
            Go Back
          </button>
        </div>
      </main>
    );
  }

  return (
    <main
      className={`min-h-screen ${character.bgGradient} relative overflow-hidden flex flex-col`}
    >
      {/* Background ambient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute top-20 right-10 w-72 h-72 bg-gradient-to-r ${character.color} opacity-5 rounded-full blur-3xl`}
        />
        <div
          className={`absolute bottom-40 left-10 w-60 h-60 bg-gradient-to-r ${character.color} opacity-5 rounded-full blur-3xl`}
        />
      </div>

      {/* Top bar */}
      <div className="relative z-20 flex items-center justify-between px-4 py-3 bg-black/20 backdrop-blur-sm border-b border-white/5">
        <button
          onClick={() => {
            stopSpeaking();
            router.push("/");
          }}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
          <span className="text-sm font-medium">Back</span>
        </button>

        <h2 className="text-white font-bold text-lg">{character.name}</h2>

        {/* Voice toggle */}
        <button
          onClick={() => {
            setVoiceEnabled(!voiceEnabled);
            if (isSpeaking) stopSpeaking();
          }}
          className="text-white/70 hover:text-white transition-colors cursor-pointer"
          title={voiceEnabled ? "Mute voice" : "Unmute voice"}
        >
          {voiceEnabled ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
            </svg>
          )}
        </button>
      </div>

      {/* Character display area */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-6 gap-4 min-h-0">
        <CharacterAvatar
          character={character}
          isSpeaking={isSpeaking}
          isProcessing={appState === "processing"}
        />

        {/* Chat bubble */}
        <div className="w-full max-w-sm mt-2">
          <ChatBubble
            key={bubbleKey}
            message={currentBubble}
            isNew={true}
          />
        </div>

        {/* Conversation history (scrollable, compact) */}
        {messages.length > 0 && (
          <div className="w-full max-w-sm max-h-32 overflow-y-auto mt-2 space-y-1.5">
            {messages.slice(-6).map((msg, i) => (
              <div
                key={i}
                className={`text-xs px-3 py-1.5 rounded-lg ${
                  msg.role === "user"
                    ? "bg-white/10 text-white/70 ml-auto max-w-[80%] text-right"
                    : "bg-white/5 text-white/50 mr-auto max-w-[80%]"
                }`}
              >
                {msg.role === "user" ? "You: " : `${character.name}: `}
                {msg.content.length > 80
                  ? msg.content.slice(0, 80) + "..."
                  : msg.content}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="relative z-20 px-4 py-4 bg-black/20 backdrop-blur-sm border-t border-white/5">
        <MessageInput
          onSend={sendMessage}
          disabled={appState === "processing" || appState === "speaking"}
          isListening={isListening}
          voiceSupported={sttSupported}
          onVoiceToggle={handleVoiceToggle}
          transcript={transcript}
        />

        {/* Status indicator */}
        <div className="text-center mt-2">
          <span className="text-white/30 text-xs">
            {appState === "processing" && `${character.name} is thinking...`}
            {appState === "speaking" && `${character.name} is talking...`}
            {appState === "listening" || isListening
              ? "Listening..."
              : ""}
            {appState === "idle" && !isListening && "Ready to chat!"}
          </span>
        </div>
      </div>
    </main>
  );
}
