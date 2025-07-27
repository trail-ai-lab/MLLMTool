import os
import requests
import json

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

class GroqSummarizationPipeline:
    def run(self, transcript_text: str) -> str:
        if not transcript_text:
            raise ValueError("Transcript is empty")

        prompt = f"Summarize the following transcript:\n\n{transcript_text}"

        payload = {
            "model": "llama3-70b-8192",
            "messages": [
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": prompt}
            ],
            "max_tokens": 300,
            "temperature": 0.5,
        }

        try:
            response = requests.post(
                GROQ_API_URL,
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json"
                },
                json=payload,
            )
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"].strip()
        except requests.exceptions.RequestException as e:
            print("[error] Groq summarization request failed")
            print("Payload:", json.dumps(payload, indent=2)[:1000])  # log first 1000 chars only
            print("Status code:", response.status_code)
            print("Response text:", response.text[:1000])
            raise e

