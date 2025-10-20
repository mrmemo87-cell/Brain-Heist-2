// src/services/geminiService.ts
// Safe Gemini wrapper — OK with no API key

type GenResult = { text(): string };
const KEY = import.meta.env.VITE_GEMINI_API_KEY?.trim();

async function getClient() {
  if (!KEY) return null;
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  return new GoogleGenerativeAI(KEY);
}

export async function geminiAsk(prompt: string): Promise<GenResult> {
  try {
    const client = await getClient();
    if (!client) return { text: () => "" }; // no key = safe no-op
    const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });
    const res = await model.generateContent(prompt);
    const out = await res.response.text();
    return { text: () => out ?? "" };
  } catch (e) {
    console.error("geminiAsk failed:", e);
    return { text: () => "" };
  }
}

// ✅ Named export generateMCQ used by Play.tsx
export async function generateMCQ(topic: string) {
  const prompt = `Create one multiple-choice question about "${topic}" with 4 options A-D and mark the correct answer letter. Format:
Q: <question>
A) ...
B) ...
C) ...
D) ...
Answer: <A|B|C|D>`;
  const res = await geminiAsk(prompt);
  const text = res.text();

  if (!text) {
    return {
      question: "Which batch is yours in Brain Heist?",
      options: ["8A", "8B", "8C", "None"],
      answer: "8A",
    };
  }

  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const qLine = lines.find(l => l.startsWith("Q:")) ?? "Q: ???";
  const optA = lines.find(l => l.startsWith("A)")) ?? "A) ???";
  const optB = lines.find(l => l.startsWith("B)")) ?? "B) ???";
  const optC = lines.find(l => l.startsWith("C)")) ?? "C) ???";
  const optD = lines.find(l => l.startsWith("D)")) ?? "D) ???";
  const ansLine = lines.find(l => l.toLowerCase().startsWith("answer")) ?? "Answer: A";

  const question = qLine.replace(/^Q:\s*/i, "");
  const options = [optA.slice(3).trim(), optB.slice(3).trim(), optC.slice(3).trim(), optD.slice(3).trim()];
  const letter = (ansLine.split(":")[1] || "A").trim().toUpperCase();
  const idx = { A: 0, B: 1, C: 2, D: 3 }[letter as "A" | "B" | "C" | "D"] ?? 0;

  return { question, options, answer: options[idx] ?? options[0] };
}

export const GEMINI_ENABLED = !!KEY;

// also export default so any default imports won't break
export default { geminiAsk, generateMCQ, GEMINI_ENABLED };
