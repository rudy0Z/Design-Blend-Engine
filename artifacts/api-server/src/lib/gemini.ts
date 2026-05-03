import { GoogleGenAI } from "@google/genai";

let cached: GoogleGenAI | null = null;

export function getGemini(): GoogleGenAI | null {
  if (cached) return cached;
  const baseUrl = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
  if (!baseUrl || !apiKey) return null;
  cached = new GoogleGenAI({
    apiKey,
    httpOptions: { apiVersion: "", baseUrl },
  });
  return cached;
}

export interface ArchetypeInput {
  title: string;
  description: string;
}

const FALLBACK = (a: ArchetypeInput, b: ArchetypeInput) =>
  `${a.title} meets ${b.title} — a collaboration of friction and finish.`;

/**
 * Generate the "If you collaborated…" line for the blend card.
 * Returns ONE sentence, max ~8 words, poetic and specific. Falls back gracefully on any error.
 */
export async function generateCollaborationLine(
  a: ArchetypeInput,
  b: ArchetypeInput,
): Promise<string> {
  const client = getGemini();
  if (!client) return FALLBACK(a, b);

  const prompt = [
    "Two designers are collaborating. Describe the creative chemistry of their pairing in ONE sentence, MAX 8 words.",
    "Be poetic and specific. No quotes. No trailing punctuation other than a period. No emojis.",
    "",
    `Designer A — ${a.title}: ${a.description}`,
    `Designer B — ${b.title}: ${b.description}`,
    "",
    "Sentence:",
  ].join("\n");

  try {
    const call = client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { temperature: 0.9 },
    });
    const result = await Promise.race([
      call,
      new Promise<never>((_, rej) =>
        setTimeout(() => rej(new Error("Gemini timeout")), 8000),
      ),
    ]);
    const raw = result.text?.trim() ?? "";
    const cleaned = raw
      .replace(/^["'`]+|["'`]+$/g, "")
      .replace(/\n+/g, " ")
      .trim();
    if (!cleaned) return FALLBACK(a, b);
    // Cap at 12 words just in case the model overshoots.
    const words = cleaned.split(/\s+/);
    return words.length > 12 ? words.slice(0, 12).join(" ") : cleaned;
  } catch (err) {
    console.warn("[gemini] collaboration line failed:", (err as Error).message);
    return FALLBACK(a, b);
  }
}
