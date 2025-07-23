# app/api/v1/endpoints/audio.py
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.core.firebase_auth import verify_firebase_token
from app.services.audio_service import create_signed_upload_url

router = APIRouter()

class DownloadUrlRequest(BaseModel):
    path: str

@router.post("/upload-url")
def upload_url(user=Depends(verify_firebase_token)):
    return create_signed_upload_url(user["uid"])


@router.post("/download-url")
def download_url(request: DownloadUrlRequest, user=Depends(verify_firebase_token)):
    from app.services.audio_service import create_signed_download_url
    return create_signed_download_url(request.path, user["uid"])
