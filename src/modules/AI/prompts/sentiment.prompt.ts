export function generateSentimentPrompt(feedback: string): string {
  return `Return JSON only:

{
  "sentiment": "positive" | "neutral" | "negative" | "unknown",
  "confidence": 0-100,
  "summary": "2-4 words"
}

Rules:
- positive = clear praise
- negative = clear complaint
- neutral = mixed/balanced
- unknown = unclear
- confidence: 0-40=neg, 41-60=neu, 61-100=pos
- summary = key topic (e.g., shipping, quality, service, product, etc.)

Important: You must return only JSON (don't add anything else (eg. comments, explanations, etc)).
Feedback: "${feedback}"`;
}
