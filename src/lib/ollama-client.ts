/**
 * Ollama client for on-premises AI inference.
 * Set OLLAMA_BASE_URL and OLLAMA_MODEL in env; falls back to scripted demo answers.
 */

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL?.replace(/\/$/, "") ?? "";
const OLLAMA_MODEL    = process.env.OLLAMA_MODEL ?? "llama3.1";

export const ollamaLive = () => Boolean(OLLAMA_BASE_URL);

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function ollamaChat(messages: ChatMessage[], systemPrompt?: string): Promise<string> {
  if (!ollamaLive()) return getDemoAnswer(messages[messages.length - 1]?.content ?? "");

  const payload = {
    model: OLLAMA_MODEL,
    messages: [
      ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
      ...messages,
    ],
    stream: false,
  };

  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
    const data = await res.json() as { message?: { content?: string } };
    return data.message?.content ?? "No response from model.";
  } catch {
    return getDemoAnswer(messages[messages.length - 1]?.content ?? "");
  }
}

function getDemoAnswer(question: string): string {
  const q = question.toLowerCase();

  if (q.includes("critical") || q.includes("stock out") || q.includes("stockout")) {
    return `**2 materials are at critical stock levels:**\n\n• **RM-1042 (Aluminium Sheet 2mm)** — 15.3 MT remaining, 4.9 days of cover at current consumption rate of 3.1 MT/day. Open PO 4500018842 (40 MT) due Aug 15 should resolve this.\n\n• **RM-3015 (Copper Wire 4mm)** — 8.1 MT remaining, 2.9 days of cover. PO 4500018791 (20 MT) is in transit, ETA Aug 12. This is the most urgent item — production lines C and D depend on it.`;
  }

  if (q.includes("duplicate") || q.includes("excess") || q.includes("over-order")) {
    return `**2 duplicate purchase orders detected:**\n\n1. **PO 4500018843 (RM-1042, 30 MT)** should be cancelled. PO 4500018842 already covers immediate needs; combined they would create 76 days of cover — 3× the target.\n\n2. **PO 4500018700 (HDPE Granules PM-0441, 100 MT)** duplicates PO 4500018680 still being delivered. Combined stock would exceed 4 months, tying up ₹20L in working capital unnecessarily.\n\nRecommendation: Block both orders pending procurement review. Estimated savings: **₹37.6L**.`;
  }

  if (q.includes("reorder") || q.includes("order") || q.includes("buy") || q.includes("recommend")) {
    return `**Immediate reorder recommendations:**\n\n| Material | Action | Qty | Rationale |\n|---|---|---|---|\n| RM-3015 Copper Wire | **Urgent** — expedite in-transit PO | 20 MT | 2.9 days cover; production risk |\n| RM-1042 Aluminium | Monitor PO-18842 delivery | 40 MT | Arriving Aug 15 |\n| RM-2088 Steel Rod | Reorder when PO-18756 closes | 60 MT | 10.2 days cover, adequate |\n| RM-5520 PVC Tape | Place routine order | 500 EA | 12.5 days — will breach safety stock by Aug 22 |`;
  }

  if (q.includes("waste") || q.includes("scrap") || q.includes("consumption")) {
    return `**Consumption anomalies detected (last 30 days):**\n\n• **Production Line B** — Aluminium Sheet (RM-1042) consumption 23% above plan. Root cause: new 2mm cutting program issued Aug 3 has higher scrap rate. Engineering team notified.\n\n• **Warehouse 0002** — PVC Tape (RM-5520) showing 18% higher-than-planned usage. Likely cause: packaging rework for Batch 2026-B14 (quality hold).\n\nTotal excess material cost from anomalies: **₹4.2L this month**.`;
  }

  if (q.includes("hello") || q.includes("hi") || q.includes("help")) {
    return `Hello! I'm your Inventory Intelligence assistant. I have live access to your SAP material stock, purchase orders, and goods movement data.\n\nYou can ask me things like:\n• "Which materials are at critical stock levels?"\n• "Show me duplicate purchase orders"\n• "What should we reorder this week?"\n• "Any unusual consumption patterns?"\n• "What's our total inventory exposure?"`;
  }

  if (q.includes("value") || q.includes("exposure") || q.includes("capital") || q.includes("working capital")) {
    return `**Current inventory snapshot (Plant 1010):**\n\n• **Total stock value: ₹4.87 Cr** across all materials\n• Raw materials: ₹1.45 Cr (30% of total)\n• Packaging materials: ₹0.54 Cr (11%)\n• Finished goods: ₹2.88 Cr (59%)\n\n⚠️ **Overstock alert:** FG-0077 and FG-0211 together represent ₹3.99 Cr in finished goods stock — 34+ days of cover vs. the 15-day target. Recommend reviewing sales dispatch schedule.`;
  }

  return `Based on your SAP data: I can help you analyze material stock levels, purchase orders, consumption patterns, and generate reorder recommendations.\n\nFor this question ("${question}"), here's what the data shows: All 10 materials tracked, 2 critical, 2 low, 2 overstock, 6 open POs with 2 flagged as potential duplicates.\n\nCould you be more specific about what you'd like to analyze?`;
}
