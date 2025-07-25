from pydantic import BaseModel

class TranscriptionRequest(BaseModel):
    path: str
    provider: str = "groq"  # Default to groq