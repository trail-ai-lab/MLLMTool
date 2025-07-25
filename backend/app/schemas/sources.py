from pydantic import BaseModel
from typing import Optional

class UploadUrlRequest(BaseModel):
    contentType: str

class DownloadUrlRequest(BaseModel):
    path: str

class SourceMetadata(BaseModel):
    sessionId: str
    path: str
    fileType: str  # "audio" or "pdf"
    name: str
    size: int
    groupId: Optional[str] = None
    topic: Optional[str] = None
    status: Optional[str] = "uploaded"
