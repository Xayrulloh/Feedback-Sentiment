export function generateSentimentPrompt(feedback: string): string { // TODO: make it smaller (less tokens) but understandable (double check for summary part)
  return `You are a sentiment and topic classifier. Your response must be strictly valid JSON only, with no additional text, explanations, or formatting outside the JSON object.

  Output format:
  {
    "sentiment": "positive" | "neutral" | "negative" | "unknown",
    "confidence": number between 0 and 100 (integer),
    "summary": string in "<2-4 words, all lowercase>"
  }

  Rules:
  - Sentiment: Classify the overall sentiment strictly as one of the four options:
    - "positive": Clearly positive feedback (e.g., "great product").
    - "negative": Clearly negative feedback (e.g., "poor service").
    - "neutral": Balanced or mixed feedback with both positive and negative elements (e.g., "good quality but expensive") or feedback lacking strong sentiment.
    - "unknown": Unclear, ambiguous, or non-applicable feedback where sentiment cannot be determined.
    Never use values outside these options (e.g., "mixed" is invalid).
  - Confidence: An integer from 0 (low confidence) to 100 (high confidence) reflecting your certainty in the sentiment classification. For "neutral" or "unknown" sentiments, confidence may be lower (e.g., 50-70) due to mixed or unclear signals.
  - Summary: Condense the main topic into 3-4 words, all lowercase, in the format "{subject} {aspect}". Examples:
    - "checkout process slow"
    - "product quality excellent"
    - "delivery timing issue"
    - "customer service helpful"
    Use consistent terminology: always "checkout" (not "cart"), "delivery" (not "shipping"), "customer service" (not "support"). For mixed feedback, focus on the primary subject and a neutral aspect if possible (e.g., "product quality price" for "awesome quality but veeery expensive").
    Ensure the summary is clear and suitable for grouping similar feedback.

  Ensure the JSON is parsable: use double quotes, no trailing commas, and a valid integer for confidence.

  Feedback to classify: "${feedback}"`;
}
