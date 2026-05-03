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

  // Prompt verbatim from PRD §"If You Collaborated".
  const prompt = `
Two designers are blending their taste profiles.
Designer 1: ${a.title} — ${a.description}
Designer 2: ${b.title} — ${b.description}

Write ONE sentence (max 8 words, poetic, specific) describing 
what their collaboration would produce. Not generic. 
Examples of good outputs:
- "A rigorous system with a human pulse"
- "Structure that forgets it was ever planned"
- "Brutality made warm enough to live inside"
Return ONLY the sentence, no quotes.
  `;

  try {
    // Note: PRD references "Gemini 1.5 Flash"; the Replit AI Integrations
    // proxy currently exposes the 2.5 family. 2.5-flash is the closest
    // analog (low-latency, low-cost, same prompt contract).
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
    // PRD: max 8 words. Hard-cap, then re-add a period if we trimmed.
    const words = cleaned.replace(/[.!?]+$/, "").split(/\s+/);
    if (words.length > 8) return words.slice(0, 8).join(" ") + ".";
    return cleaned.endsWith(".") ? cleaned : cleaned + ".";
  } catch (err) {
    console.warn("[gemini] collaboration line failed:", (err as Error).message);
    return FALLBACK(a, b);
  }
}
