# app/api/v1/endpoints/highlight.py

from fastapi import APIRouter

router = APIRouter()

@router.post("/")
async def run_highlight():
    return {"message": "Highlight endpoint placeholder — ready for POST requests."}
