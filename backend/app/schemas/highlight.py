from pydantic import BaseModel

class HighlightRequest(BaseModel):
    prompt: str
