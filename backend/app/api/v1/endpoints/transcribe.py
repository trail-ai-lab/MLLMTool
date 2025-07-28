# backend/app/api/v1/endpoints/transcribe.py

from app.schemas.transcribe import TranscribeRequest
from fastapi import APIRouter, Depends

from app.core.firebase_auth import verify_firebase_token
from app.services.transcribe_service import TranscribeService

router = APIRouter()

@router.post("")
def transcribe_audio(request: TranscribeRequest, user=Depends(verify_firebase_token)):
    print("Transcribe requested", request.path)
    service = TranscribeService()
    result = service.transcribe(provider=request.provider, gcs_path=request.path, user_id=user["uid"])
    return result
