import { GoogleGenerativeAI } from "@google/generative-ai";
import { isGeminiConfigured } from "../config";

let cached: GoogleGenerativeAI | null = null;

function client(): GoogleGenerativeAI | null {
  if (!isGeminiConfigured) return null;
  if (cached) return cached;
  cached = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  return cached;
}

export type GeminiModel = "gemini-2.5-pro" | "gemini-2.5-flash";

interface GenerateOpts {
  model?: GeminiModel;
  temperature?: number;
  maxOutputTokens?: number;
  systemInstruction?: string;
}

export async function generate(
  prompt: string,
  opts: GenerateOpts = {},
): Promise<string> {
  const ai = client();
  if (!ai) throw new Error("Gemini not configured");
  const model = ai.getGenerativeModel({
    model: opts.model ?? "gemini-2.5-flash",
    systemInstruction: opts.systemInstruction,
    generationConfig: {
      temperature: opts.temperature ?? 0.7,
      maxOutputTokens: opts.maxOutputTokens ?? 2048,
    },
  });
  const res = await model.generateContent(prompt);
  return res.response.text().trim();
}
