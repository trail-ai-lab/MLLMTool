from fastapi import APIRouter, Depends
from app.core.firebase_auth import verify_firebase_token
from app.schemas.upload import (
    UploadUrlRequest,
    DownloadUrlRequest,
    FileMetadata,
)
from app.services.upload_service import (
    create_signed_upload_url,
    create_signed_download_url,
    save_file_metadata,
)

router = APIRouter()

@router.post("/upload-url")
def upload_url(request: UploadUrlRequest, user=Depends(verify_firebase_token)):
    return create_signed_upload_url(user["uid"], request.contentType)

@router.post("/download-url")
def download_url(request: DownloadUrlRequest, user=Depends(verify_firebase_token)):
    return create_signed_download_url(request.path, user["uid"])

@router.post("/upload-metadata")
def upload_metadata(meta: FileMetadata, user=Depends(verify_firebase_token)):
    return save_file_metadata(user["uid"], meta.dict())
