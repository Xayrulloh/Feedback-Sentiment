export function generateSentimentPrompt(feedback: string): string {
  return `You are a JSON sentiment analyzer. Your output must be ONLY valid JSON with no additional text whatsoever.

CRITICAL REQUIREMENTS:
- Output ONLY the JSON object below
- NO explanatory text before, after, or around the JSON
- NO markdown code blocks or formatting
- NO comments or additional fields
- Ensure valid JSON syntax (proper quotes, no trailing commas)

REQUIRED JSON FORMAT:
{
  "sentiment": "positive" | "neutral" | "negative" | "unknown",
  "confidence": number,
  "summary": string
}

FIELD SPECIFICATIONS:

sentiment (required):
- "positive": Clear praise, satisfaction, compliments, recommendations
- "negative": Clear complaints, dissatisfaction, problems, criticism
- "neutral": Mixed feedback, balanced pros/cons, factual statements
- "unknown": Unclear, insufficient, or incomprehensible feedback

confidence (required):
- Integer from 0-100 representing certainty level
- 90-100: Very clear sentiment indicators
- 70-89: Clear but with some ambiguity
- 50-69: Moderate confidence, mixed signals
- 30-49: Low confidence, unclear context
- 0-29: Very uncertain, insufficient information

summary (required - CRITICAL FOR GROUPING):
- Format: "category descriptor" or "category descriptor adjective"
- Always lowercase, no punctuation
- Use ONLY these categories: shipping, quality, service, product, pricing, usability, staff, support, website, other
- Examples of good summaries:
  * "shipping speed" (category + descriptor)
  * "product quality poor" (category + descriptor + adjective)
  * "service response slow" (category + descriptor + adjective)
  * "pricing value" (category + descriptor)
  * "staff behavior rude" (category + descriptor + adjective)
- Be consistent: same issues should have identical summaries
- Prioritize the most prominent issue mentioned

VALIDATION CHECKLIST:
✓ Output is pure JSON only
✓ All three fields present and correctly typed
✓ Summary follows exact format requirements
✓ No syntax errors or trailing commas

Customer Feedback: """${feedback}"""`;
}