import axios from "axios";

// API configuration
const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

/**
 * Use Groq API to enhance highlighting by identifying relevant sentences
 */
export async function getGroqHighlights(
  question: string,
  context: string
): Promise<number[]> {
  try {
    console.log("Asking Groq to identify relevant sentences...");
    
    // Split the context into sentences for reference
    const sentences = context.split(/(?<=[.!?])\s+/);
    const truncatedContext = context.substring(0, Math.min(4000, context.length));
    
    const prompt = `
You are an information retrieval expert specializing in identifying relevant information.

QUESTION: ${question}

CONTEXT:
${truncatedContext}

TASK:
Analyze the context and identify the sentence indices (0-based) that are most relevant to answering the question.
The context has been split into sentences, and you need to return the indices of the 3-5 most relevant sentences.

Return ONLY a comma-separated list of sentence indices with NO additional explanations.
Example: 0,4,10,15
`;

    const response = await axios.post(
      GROQ_API_URL,
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You are an AI assistant specializing in information retrieval." },
          { role: "user", content: prompt }
        ],
        max_tokens: 100,
        temperature: 0.2,
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const responseContent = response.data.choices[0].message.content.trim();
    
    // Extract indices from response
    const indices = responseContent
      .split(',')
      .map(idx => parseInt(idx.trim()))
      .filter(idx => !isNaN(idx) && idx >= 0 && idx < sentences.length);
    
    console.log("Groq identified relevant sentence indices:", indices);
    return indices;
  } catch (error: any) {
    console.error("Error getting Groq highlights:", error.response?.data || error.message);
    return []; // Return empty array on error
  }
}

/**
 * Combine highlights from Groq with existing backend highlights
 */
export function combineHighlights(
  groqHighlights: number[],
  backendHighlights: any[]
): any[] {
  // Create a set from Groq highlights for quick lookup
  const groqSet = new Set(groqHighlights);
  
  // Create a map from backend highlights
  const highlightMap = new Map();
  
  // Add backend highlights to the map
  backendHighlights.forEach(highlight => {
    highlightMap.set(highlight.index, highlight);
  });
  
  // Add Groq highlights to the map (with a default score if needed)
  groqHighlights.forEach(index => {
    if (!highlightMap.has(index)) {
      highlightMap.set(index, {
        index: index,
        score: 0.8, // Default score for Groq highlights
        text: "" // Will be filled in later
      });
    }
  });
  
  // Convert the map back to an array
  return Array.from(highlightMap.values());
}