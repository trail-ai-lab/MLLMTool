# app/api/v1/endpoints/highlight.py

from fastapi import APIRouter, Depends, HTTPException
from app.core.firebase_auth import verify_firebase_token
from app.schemas.highlight import HighlightRequest
from app.services.highlight_service import generate_highlight, get_highlight_history

router = APIRouter()


@router.post("/{source_id}")
def highlight_prompt(source_id: str, request: HighlightRequest, user=Depends(verify_firebase_token)):
    try:
        return generate_highlight(user["uid"], source_id, request.prompt)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{source_id}/history")
def get_highlight_chat_history(source_id: str, user=Depends(verify_firebase_token)):
    try:
        return get_highlight_history(user["uid"], source_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
