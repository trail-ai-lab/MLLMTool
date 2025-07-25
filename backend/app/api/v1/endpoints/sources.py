from fastapi import APIRouter, Depends
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
    return get_all_sources(user["uid"])
