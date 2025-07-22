from fastapi import APIRouter, Depends
from app.core.firebase_auth import verify_firebase_token
from app.services import onboard_service

router = APIRouter()

@router.get("")
def onboard(user=Depends(verify_firebase_token)):
    return onboard_service.ensure_user_onboarded(user["uid"])
