# app/core/settings.py

import os
from typing import List

class Settings:
    # Default CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
    ]

    def __init__(self):
        # Optional: allow production frontend from env var
        frontend_url = os.getenv("FRONTEND_URL")
        if frontend_url:
            self.CORS_ORIGINS.append(frontend_url)

        # Optional: allow comma-separated list from ADDITIONAL_CORS_ORIGINS
        extra = os.getenv("ADDITIONAL_CORS_ORIGINS", "")
        if extra:
            self.CORS_ORIGINS.extend([origin.strip() for origin in extra.split(",")])

settings = Settings()
