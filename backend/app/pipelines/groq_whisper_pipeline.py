# backend/app/pipelines/groq_whisper_pipeline.py

import os
import requests
from app.utils.gcs_utils import fetch_audio_from_gcs

GROQ_API_URL = "https://api.groq.com/openai/v1/audio/transcriptions"
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

class GroqWhisperPipeline:
    def run(self, gcs_path: str, user_id: str):
        # Fetch audio file from GCS
        audio_bytes = fetch_audio_from_gcs(gcs_path, user_id)

        # Prepare file upload
        files = {
            "file": ("audio.webm", audio_bytes, "audio/webm"),
        }
        data = {
            "model": "whisper-large-v3",
            "response_format": "json",
            "language": "en",
        }
        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
        }

        # Call Groq Whisper API
        response = requests.post(GROQ_API_URL, headers=headers, files=files, data=data)
        response.raise_for_status()

        result = response.json()
        return {
            "transcript": result.get("text", ""),
            "provider": "groq",
        }
