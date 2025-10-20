// Safe Gemini wrapper — never crash if no key, lazy-load SDK only when key exists
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

export const GEMINI_ENABLED = !!KEY;
