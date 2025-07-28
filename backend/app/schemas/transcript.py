from pydantic import BaseModel

class TranscriptUpdateRequest(BaseModel):
    text: str
    provider: str = "manual"