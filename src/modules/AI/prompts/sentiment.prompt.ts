export function generateSentimentPrompt(feedback: string): string {
  return `Classify sentiment. Return valid JSON only:

  {
    "sentiment": "positive" | "neutral" | "negative" | "unknown",
    "confidence": 0-100 (integer),
    "summary": "2-4 words, lowercase"
  }

  Sentiment rules:
  - positive: clearly positive (e.g., "great product")
  - negative: clearly negative (e.g., "poor service") 
  - neutral: mixed/balanced feedback
  - unknown: unclear/ambiguous

  Summary format: "{subject} {aspect}" (e.g., "checkout process slow", "product quality excellent"). Use: "checkout" not "cart", "delivery" not "shipping", "customer service" not "support".

  Feedback: "${feedback}"`;
}
