from pydantic import BaseModel
from typing import Optional, Literal

class UploadUrlRequest(BaseModel):
    contentType: str

class DownloadUrlRequest(BaseModel):
    path: str

class SourceMetadata(BaseModel):
    sourceId: Optional[str]  # Optional, will generate if not provided
    path: str
    name: str
    fileType: Literal["audio", "pdf"]
    size: int
    groupId: Optional[str] = None
    topic: Optional[str] = None
    status: Optional[str] = None
