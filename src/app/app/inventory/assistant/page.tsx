"use client";

import { useState, useRef, useEffect } from "react";
import type { ChatMessage } from "@/lib/ollama-client";

const SUGGESTIONS = [
  "Which materials are at critical stock levels?",
  "Show me all duplicate purchase orders",
  "What should we reorder this week?",
  "Any unusual consumption patterns this month?",
  "What's our total inventory value exposure?",
];

function Bubble({ msg }: { msg: ChatMessage & { typing?: boolean } }) {
  const isUser = msg.role === "user";
  return (
    <div style={{
      display: "flex",
      justifyContent: isUser ? "flex-end" : "flex-start",
      marginBottom: 14,
    }}>
      {!isUser && (
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #0070f2, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", marginRight: 10, flexShrink: 0, marginTop: 4, fontSize: 14 }}>
          🤖
        </div>
      )}
      <div style={{
        maxWidth: "72%",
        padding: "12px 16px",
        borderRadius: isUser ? "16px 16px 4px 16px" : "4px 16px 16px 16px",
        background: isUser ? "#0070f2" : "#fff",
        color: isUser ? "#fff" : "#1e293b",
        border: isUser ? "none" : "1px solid #e2e8f0",
        fontSize: 14,
        lineHeight: 1.6,
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        whiteSpace: "pre-wrap",
      }}>
        {msg.typing ? (
          <span style={{ display: "flex", gap: 4, alignItems: "center" }}>
            {[0, 1, 2].map(i => (
              <span key={i} style={{
                width: 6, height: 6, borderRadius: "50%", background: "#94a3b8",
                animation: `bounce 1.2s ease ${i * 0.2}s infinite`,
              }} />
            ))}
          </span>
        ) : msg.content}
      </div>
    </div>
  );
}

type UIMessage = ChatMessage & { typing?: boolean };

export default function AssistantPage() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  const [messages, setMessages] = useState<UIMessage[]>([
    {
      role: "assistant",
      content: "Hello! I'm your Inventory Intelligence assistant, powered by on-prem AI with live access to your SAP data.\n\nYou can ask me about stock levels, purchase orders, consumption anomalies, or reorder recommendations. What would you like to know?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput("");

    const userMsg: UIMessage = { role: "user", content };
    const typingMsg: UIMessage = { role: "assistant", content: "", typing: true };

    setMessages(prev => [...prev, userMsg, typingMsg]);
    setLoading(true);

    const history: ChatMessage[] = [...messages.filter(m => !m.typing), userMsg].map(m => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch("/api/inventory/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      const data = await res.json() as { reply: string; live: boolean };
      setMessages(prev => [...prev.filter(m => !m.typing), { role: "assistant" as const, content: data.reply }]);
    } catch {
      setMessages(prev => [...prev.filter(m => !m.typing), { role: "assistant" as const, content: "Sorry, I couldn't reach the AI service. Please check that Ollama is running." }]);
    }
    setLoading(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 56px - 48px)", padding: isMobile ? "0 4px" : undefined }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: 0 }}>AI Inventory Assistant</h1>
          <span style={{ padding: "3px 10px", borderRadius: 20, background: "#fffbeb", color: "#d97706", fontSize: 11, fontWeight: 600, border: "1px solid #fde68a" }}>
            Demo Mode — set OLLAMA_BASE_URL for live inference
          </span>
        </div>
        <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>Ask anything about your inventory · Powered by on-prem Ollama (Llama 3.1 by default)</p>
      </div>

      {/* Suggestions */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {SUGGESTIONS.map(s => (
          <button
            key={s}
            onClick={() => send(s)}
            disabled={loading}
            style={{
              padding: "5px 12px", borderRadius: 20, border: "1px solid #e2e8f0",
              background: "#fff", color: "#475569", fontSize: 12, cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#f0f7ff"; (e.currentTarget as HTMLElement).style.borderColor = "#0070f2"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#fff"; (e.currentTarget as HTMLElement).style.borderColor = "#e2e8f0"; }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Chat window */}
      <div style={{ flex: 1, background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0", padding: "20px", overflowY: "auto", marginBottom: 16 }}>
        <style>{`@keyframes bounce { 0%, 80%, 100% { transform: translateY(0) } 40% { transform: translateY(-6px) } }`}</style>
        {messages.map((msg, i) => <Bubble key={i} msg={msg} />)}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ display: "flex", gap: 10 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Ask about your inventory data..."
          disabled={loading}
          style={{
            flex: 1, padding: "12px 16px", borderRadius: 10, border: "1px solid #e2e8f0",
            fontSize: 14, background: "#fff", outline: "none",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}
        />
        <button
          onClick={() => send()}
          disabled={loading || !input.trim()}
          style={{
            padding: "12px 24px", borderRadius: 10, border: "none", cursor: "pointer",
            background: loading || !input.trim() ? "#e2e8f0" : "#0070f2",
            color: loading || !input.trim() ? "#94a3b8" : "#fff",
            fontWeight: 600, fontSize: 14, transition: "background 0.15s",
          }}
        >
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}
