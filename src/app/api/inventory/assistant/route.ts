import { NextRequest, NextResponse } from "next/server";
import { ollamaChat, ollamaLive, type ChatMessage } from "@/lib/ollama-client";

const SYSTEM_PROMPT = `You are an inventory intelligence assistant for a manufacturing company using SAP S/4HANA.
You have access to real-time material stock levels, purchase orders, goods movements, and consumption data.
Answer concisely and use markdown formatting. Include specific numbers from the data when available.
Focus on actionable insights: what needs immediate attention, what can wait, what can be optimized.`;

export async function POST(req: NextRequest) {
  const body = await req.json() as { messages: ChatMessage[] };
  if (!body.messages?.length) {
    return NextResponse.json({ error: "No messages provided" }, { status: 400 });
  }
  const reply = await ollamaChat(body.messages, SYSTEM_PROMPT);
  return NextResponse.json({ reply, live: ollamaLive() });
}
