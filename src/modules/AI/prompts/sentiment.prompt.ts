export function generateSentimentPrompt(feedback: string): string {
  return `Output strictly JSON:

  {
    "sentiment": "positive" | "neutral" | "negative" | "unknown",
    "confidence": 0-100,
    "summary": "2-4 words, lowercase, category + brief descriptor"
  }

  Rules:
  - sentiment: positive=praise, negative=complaint, neutral=mixed, unknown=unclear
  - confidence: AI certainty in sentiment (0=low, 100=high)
  - summary: combine one category (shipping, quality, service, product, pricing, usability, staff, support, other) with a short descriptor (e.g., "shipping delay", "product quality", "service speed")
  - summary must be consistent, lowercase, no punctuation
  - Return JSON only, no extra text before and after

  Customer feedback:
  """${feedback}"""`;
}
