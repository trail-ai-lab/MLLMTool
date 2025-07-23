import axios from "axios";

const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function summarizeTranscript(transcript: string): Promise<string> {
    try {
        console.log("Sending transcript to Groq API for summarization...");

        // Check if API key is configured
        if (!GROQ_API_KEY) {
            console.error("Missing Groq API key in environment variables");
            return "Error: Groq API key is not configured. Please check your environment variables.";
        }

        // Check transcript length
        if (!transcript || transcript.trim().length < 10) {
            console.error("Transcript too short or empty");
            return "Error: Transcript is too short or empty. Cannot generate a summary.";
        }

        const truncatedTranscript = transcript.length > 15000 
            ? transcript.substring(0, 15000) + "..." 
            : transcript;

        console.log(`Summarizing transcript (${transcript.length} characters, truncated to ${truncatedTranscript.length})`);

        const response = await axios.post(
            GROQ_API_URL,
            {
                model: "llama-3.3-70b-versatile", // Ensure correct model
                messages: [
                    { role: "system", content: "You are an AI assistant specializing in summarizing conversations and transcripts." },
                    { role: "user", content: `Summarize this transcript concisely:\n\n${truncatedTranscript}` },
                ],
                max_tokens: 300, // Adjust summary length
                temperature: 0.5, // More deterministic output
            },
            {
                headers: {
                    Authorization: `Bearer ${GROQ_API_KEY}`,
                    "Content-Type": "application/json",
                },
                timeout: 120000, // 2 minute timeout
            }
        );

        console.log("Summary generated successfully");

        if (!response.data?.choices?.[0]?.message?.content) {
            console.error("Empty response from summarization API", response.data);
            return "Error: Failed to generate summary - empty response from API";
        }

        return response.data.choices[0].message.content;
    } catch (error: any) {
        console.error("Error summarizing transcript:", error.response?.data || error.message);
        
        // Enhanced error handling with more specific messages
        if (error.code === 'ECONNABORTED') {
            return "Error: Request timed out while generating summary. Please try again later.";
        } else if (error.response?.status === 401) {
            return "Error: Authentication failed. Please check your API key.";
        } else if (error.response?.status === 429) {
            return "Error: Rate limit exceeded. Please try again later.";
        } else if (error.response?.data?.error?.message) {
            return `Error: ${error.response.data.error.message}`;
        } else if (error.message) {
            return `Error: ${error.message}`;
        }
        
        return "Error: Failed to generate summary due to an unknown error";
    }
}
