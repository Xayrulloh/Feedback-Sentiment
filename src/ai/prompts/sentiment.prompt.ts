// src/ai/prompts/sentiment.prompt.ts

export function generateSentimentPrompt(feedback: string) {
      return `
    You are a sentiment analysis assistant.
    
    For the following user feedback, respond **strictly** in this format:
    
    Sentiment: [positive | negative | neutral | unknown]  
    Confidence: [0–100]  
    Summary: [1-sentence summary of what the feedback is about]
    
    Feedback:
    "${feedback}"
    `.trim();
    }
    