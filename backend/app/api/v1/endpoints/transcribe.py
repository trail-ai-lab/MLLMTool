# backend/app/api/v1/endpoints/transcribe.py

from app.schemas.transcribe import TranscriptionRequest
from fastapi import APIRouter, Depends

from app.core.firebase_auth import verify_firebase_token
from app.services.transcription_service import TranscriptionService

router = APIRouter()

@router.post("")
def transcribe_audio(request: TranscriptionRequest, user=Depends(verify_firebase_token)):
    print("Transcribe requested", request.path)
    service = TranscriptionService()
    result = service.transcribe(provider=request.provider, gcs_path=request.path, user_id=user["uid"])
    return result
