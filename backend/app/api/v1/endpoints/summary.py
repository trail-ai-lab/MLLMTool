from fastapi import APIRouter, Depends, HTTPException
from app.core.firebase_auth import verify_firebase_token
from app.services.summary_service import get_summary, summarize_and_save

router = APIRouter()

@router.get("/{source_id}")
def get_summary_api(source_id: str, user=Depends(verify_firebase_token)):
    try:
        return get_summary(user["uid"], source_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/{source_id}/generate")
def generate_summary_api(source_id: str, user=Depends(verify_firebase_token)):
    try:
        summary = summarize_and_save(user["uid"], source_id)
        return {"message": "Summary saved", "summary": summary}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
