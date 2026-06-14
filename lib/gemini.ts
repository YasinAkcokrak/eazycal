import Anthropic from "@anthropic-ai/sdk"

export interface NutritionResult {
  meal_name: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  confidence: "high" | "medium" | "low"
  notes: string
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const PROMPT = `Analyze this meal image and return ONLY a JSON object with no markdown, no code fences, and no extra text.

Required format:
{
  "meal_name": "string",
  "calories": number,
  "protein_g": number,
  "carbs_g": number,
  "fat_g": number,
  "confidence": "high" | "medium" | "low",
  "notes": "string"
}

Rules:
- calories, protein_g, carbs_g, fat_g must be numbers (no strings)
- confidence is "high" if ingredients are clearly visible, "medium" if partially visible, "low" if unclear
- notes should mention estimation assumptions or missing details
- Return ONLY the JSON object, nothing else`

export async function analyzeImage(
  imageBase64: string,
  mimeType: string,
): Promise<NutritionResult> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
              data: imageBase64,
            },
          },
          { type: "text", text: PROMPT },
        ],
      },
    ],
  })

  const block = response.content[0]
  const text = (block.type === "text" ? block.text : "").trim().replace(/^```json\n?/, "").replace(/\n?```$/, "")
  return JSON.parse(text) as NutritionResult
}
