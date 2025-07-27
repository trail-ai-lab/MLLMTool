# app/pipelines/groq_highlight_pipeline.py

import os
import requests

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

class GroqHighlightPipeline:
    def run(self, transcript: str, prompt: str):
        if not transcript or not prompt:
            raise ValueError("Missing input")

        full_prompt = f"""
You are a classroom assistant. A teacher is asking:

    "{prompt}"

Please:
1. Find the most relevant sentence in the transcript.
2. Provide a short answer to the teacher's question.

Transcript:
{transcript}

Respond in JSON format like:
{{
  "sentence": "...exact sentence...",
  "answer": "...brief answer to the teacher..."
}}
"""

        response = requests.post(
            GROQ_API_URL,
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "llama3-70b-8192",
                "messages": [
                    {"role": "system", "content": "You are a helpful assistant."},
                    {"role": "user", "content": full_prompt}
                ],
                "temperature": 0.5,
                "max_tokens": 300
            }
        )

        response.raise_for_status()
        result = response.json()["choices"][0]["message"]["content"].strip()

        import json
        return json.loads(result)
