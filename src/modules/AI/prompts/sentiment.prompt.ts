export function generateSentimentPrompt(feedback: string): string {
  return `Analyze the sentiment of the following feedback and respond with a JSON object only.

Feedback: "${feedback}"

Respond with exactly this JSON structure:
{
  "sentiment": "positive" | "neutral" | "negative" | "unknown",
  "confidence": <number between 0-100>,
  "summary": "<brief summary of the feedback>"
}

Important: 
- Only respond with valid JSON
- Do not include any text before or after the JSON
- The sentiment must be one of: positive, neutral, negative, unknown
- Confidence should be a number between 0 and 100
- Summary should be a brief description of the main points`;
}
