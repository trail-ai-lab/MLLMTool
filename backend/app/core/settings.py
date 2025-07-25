import os
import json
import tempfile
from typing import List

class Settings:
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]
    GCS_AUDIO_BUCKET: str = os.getenv("GCS_AUDIO_BUCKET", "")

    def __init__(self):
        frontend_url = os.getenv("FRONTEND_URL")
        if frontend_url:
            self.CORS_ORIGINS.append(frontend_url)

        extra = os.getenv("ADDITIONAL_CORS_ORIGINS", "")
        if extra:
            self.CORS_ORIGINS.extend([origin.strip() for origin in extra.split(",")])

        # ✅ Write credentials JSON to a temp file
        raw_json = os.getenv("GOOGLE_APPLICATION_CREDENTIALS_JSON")
        if raw_json:
            try:
                creds_dict = json.loads(raw_json.strip(" '\""))
                with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as temp_file:
                    json.dump(creds_dict, temp_file)
                    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = temp_file.name
                    print("✅ GOOGLE_APPLICATION_CREDENTIALS written to:", temp_file.name)
            except Exception as e:
                print("❌ Failed to load GOOGLE_APPLICATION_CREDENTIALS_JSON:", e)

settings = Settings()
