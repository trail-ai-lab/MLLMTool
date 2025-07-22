import axios from "axios";

const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/audio/transcriptions";

export async function transcribeAudio(audioFile: File): Promise<string> {
    try {
        console.log("Uploading audio file for transcription...");
        
        // Check if API key is configured
        if (!GROQ_API_KEY) {
            console.error("Missing Groq API key in environment variables");
            return "Transcription failed: Groq API key is not configured. Please check your environment variables.";
        }
        
        // Check file size
        if (audioFile.size > 25 * 1024 * 1024) { // 25MB limit
            console.error("File too large for transcription");
            return "Transcription failed: Audio file is too large. Maximum size is 25MB.";
        }
        
        // Log file details for debugging
        console.log(`Transcribing file: ${audioFile.name}, size: ${(audioFile.size / 1024 / 1024).toFixed(2)}MB, type: ${audioFile.type}`);
        
        // Make sure the file has audio type
        const audioFileWithCorrectType = new File(
            [audioFile], 
            audioFile.name, 
            { type: audioFile.type.includes('audio') ? audioFile.type : "audio/wav" }
        );
        
        // Prepare the form data
        const formData = new FormData();
        formData.append("file", audioFileWithCorrectType);
        formData.append("model", "whisper-large-v3-turbo");
        formData.append(
            "prompt", 
            "Audio contains code-switching between English and Spanish, including potential Spanglish (hybrid expressions). Transcribe exactly as spoken - use Spanish orthography for Spanish segments, English orthography for English segments, and maintain any mid-sentence or mid-word language switches. Preserve all code-switching patterns without standardizing to either language. Also recognize the different speakers if there are multiple speakers.");
        formData.append("response_format", "json");
        
        console.log("Sending transcription request to Groq...");
        
        // Send request to Groq API with explicit transformRequest setting
        const response = await axios.post(GROQ_API_URL, formData, {
            headers: {
                Authorization: `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "multipart/form-data",
            },
            transformRequest: [function (data) {
                // Don't transform FormData
                return data;
            }],
            timeout: 300000, // 5 minute timeout
        });
        
        console.log("Transcription successful");
        
        if (!response.data || !response.data.text) {
            console.error("Empty response from transcription API", response.data);
            return "Transcription failed: API returned an empty response";
        }
        
        return response.data.text; // The transcribed text
    } catch (error: any) {
        console.error("Error transcribing audio:", error);
        
        // Enhanced error handling with more specific messages
        if (error.code === 'ECONNABORTED') {
            return "Transcription failed: Request timed out. The audio file may be too large or the service is experiencing delays.";
        } else if (error.response?.status === 401) {
            return "Transcription failed: Authentication error. Please check your API key.";
        } else if (error.response?.status === 429) {
            return "Transcription failed: Rate limit exceeded. Please try again later.";
        } else if (error.response?.data?.error) {
            return `Transcription failed: ${error.response.data.error.message || error.response.data.error}`;
        } else if (error.message) {
            return `Transcription failed: ${error.message}`;
        } else {
            return "Transcription failed: An unknown error occurred";
        }
    }
}
