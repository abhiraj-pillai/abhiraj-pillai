import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getCharacter } from "@/lib/characters";
import { ChatRequest } from "@/lib/types";

function getClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY not configured. Add it to .env.local");
  }
  return new OpenAI({ apiKey, baseURL: "https://api.groq.com/openai/v1" });
}

export async function POST(req: NextRequest) {
  try {
    const client = getClient();

    const body: ChatRequest = await req.json();
    const { characterId, message, history } = body;

    const character = getCharacter(characterId);
    if (!character) {
      return NextResponse.json(
        { error: "Character not found" },
        { status: 400 }
      );
    }

    const recentHistory = history.slice(-10);

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: character.personality },
      ...recentHistory.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      { role: "user", content: message },
    ];

    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 150,
      messages,
    });

    const responseText = response.choices[0]?.message?.content || "...";

    return NextResponse.json({ response: responseText });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}
