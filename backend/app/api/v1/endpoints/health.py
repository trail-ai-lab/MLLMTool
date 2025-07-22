# app/api/v1/endpoints/health.py

from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def health_check():
    return {"status": "ok", "message": "SLAI backend is healthy ✅"}
