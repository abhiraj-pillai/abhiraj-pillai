import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getCharacter } from "@/lib/characters";
import { ChatRequest } from "@/lib/types";

const anthropic = new Anthropic();

export async function POST(req: NextRequest) {
  try {
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

    const messages = [
      ...recentHistory.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      { role: "user" as const, content: message },
    ];

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 150,
      system: character.personality,
      messages,
    });

    const textContent = response.content.find((block) => block.type === "text");
    const responseText = textContent ? textContent.text : "...";

    return NextResponse.json({ response: responseText });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}
