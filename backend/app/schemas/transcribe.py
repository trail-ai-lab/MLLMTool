from pydantic import BaseModel

class TranscribeRequest(BaseModel):
    path: str
    provider: str = "groq"  # Default to groq