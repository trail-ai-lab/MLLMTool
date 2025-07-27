import os
import requests

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

class GroqSummarizationPipeline:
    def run(self, transcript_text: str) -> str:
        if not transcript_text:
            raise ValueError("Transcript is empty")

        prompt = f"Summarize the following transcript:\n\n{transcript_text}"

        response = requests.post(
            GROQ_API_URL,
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "mixtral-8x7b-32768",
                "messages": [
                    {"role": "system", "content": "You are a helpful assistant."},
                    {"role": "user", "content": prompt}
                ],
                "max_tokens": 300,
                "temperature": 0.5,
            }
        )

        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"].strip()
