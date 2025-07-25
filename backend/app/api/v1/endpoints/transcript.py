from fastapi import APIRouter, Depends, HTTPException
from app.core.firebase_auth import verify_firebase_token
from app.schemas.transcript import TranscriptUpdateRequest
from app.services.transcript_service import get_transcript, update_transcript, delete_transcript

router = APIRouter()

@router.get("/{session_id}")
def get_transcript_api(session_id: str, user=Depends(verify_firebase_token)):
    try:
        return get_transcript(user["uid"], session_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.put("/{session_id}")
def update_transcript_api(session_id: str, payload: TranscriptUpdateRequest, user=Depends(verify_firebase_token)):
    try:
        update_transcript(user["uid"], session_id, payload.text, payload.provider)
        return {"message": "Transcript updated"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.delete("/{session_id}")
def delete_transcript_api(session_id: str, user=Depends(verify_firebase_token)):
    try:
        delete_transcript(user["uid"], session_id)
        return {"message": "Transcript deleted"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
