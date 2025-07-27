# app/api/v1/api.py

from fastapi import APIRouter, Depends
from app.api.v1.endpoints import health, onboard, sources, transcribe, transcript, summary, highlight
from app.core.firebase_auth import verify_firebase_token

api_router = APIRouter()

# 🔓 Unprotected routes
api_router.include_router(health.router, prefix="/health", tags=["health"])

# 🔐 Protected routes (require Firebase token)
protected_router = APIRouter(dependencies=[Depends(verify_firebase_token)])
protected_router.include_router(onboard.router, prefix="/onboard", tags=["onboard"])
protected_router.include_router(sources.router, prefix="/sources", tags=["sources"])
protected_router.include_router(transcribe.router, prefix="/transcribe", tags=["transcribe"])
protected_router.include_router(transcript.router, prefix="/transcript", tags=["transcript"]) 
protected_router.include_router(summary.router, prefix="/summary", tags=["summary"])
protected_router.include_router(highlight.router, prefix="/highlight", tags=["highlight"])

api_router.include_router(protected_router)
