# app/api/v1/api.py

from fastapi import APIRouter, Depends
from app.api.v1.endpoints import highlight, health, onboard, upload
from app.core.firebase_auth import verify_firebase_token

api_router = APIRouter()

# 🔓 Unprotected routes
api_router.include_router(health.router, prefix="/health", tags=["health"])

# 🔐 Protected routes (require Firebase token)
protected_router = APIRouter(dependencies=[Depends(verify_firebase_token)])
protected_router.include_router(highlight.router, prefix="/highlight", tags=["highlight"])
protected_router.include_router(onboard.router, prefix="/onboard", tags=["onboard"])
protected_router.include_router(upload.router, prefix="/upload", tags=["audio"])


api_router.include_router(protected_router)
