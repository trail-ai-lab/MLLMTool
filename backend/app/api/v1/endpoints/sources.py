from fastapi import APIRouter, Depends, HTTPException
from app.core.firebase_auth import verify_firebase_token
from app.schemas.sources import (
    UploadUrlRequest,
    DownloadUrlRequest,
    SourceMetadata,
)
from app.services.source_service import (
    create_signed_upload_url,
    create_signed_download_url,
    save_source_metadata,
    get_all_sources,
    delete_source,
)

router = APIRouter()

@router.post("/upload-url")
def upload_url(request: UploadUrlRequest, user=Depends(verify_firebase_token)):
    return create_signed_upload_url(user["uid"], request.contentType)

@router.post("/download-url")
def download_url(request: DownloadUrlRequest, user=Depends(verify_firebase_token)):
    return create_signed_download_url(request.path, user["uid"])

@router.post("/upload-metadata")
def upload_metadata(meta: SourceMetadata, user=Depends(verify_firebase_token)):
    return save_source_metadata(user["uid"], meta.dict())

@router.get("")
def list_sources(user=Depends(verify_firebase_token)):
    try:
        return get_all_sources(user["uid"])
    except Exception as e:
        print(f"[error] Failed to list sources: {e}")
        return []

@router.delete("/{source_id}")
def delete_source_endpoint(source_id: str, user=Depends(verify_firebase_token)):
    try:
        return delete_source(user["uid"], source_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
