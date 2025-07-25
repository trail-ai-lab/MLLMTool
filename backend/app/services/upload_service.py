from google.cloud import storage
from datetime import timedelta, datetime
from app.core.firebase_client import db as _db
import uuid
import os

GCS_AUDIO_BUCKET = os.getenv("GCS_AUDIO_BUCKET")

def create_signed_upload_url(user_id: str, content_type: str):
    client = storage.Client()
    bucket = client.bucket(GCS_AUDIO_BUCKET)

    EXTENSION_MAP = {
        "audio/webm": ".webm",
        "audio/mpeg": ".mp3",
        "audio/wav": ".wav",
        "application/pdf": ".pdf"
    }

    extension = EXTENSION_MAP.get(content_type)
    if not extension:
        raise ValueError("Unsupported content type")

    object_name = f"{user_id}/{uuid.uuid4()}{extension}"
    blob = bucket.blob(object_name)

    url = blob.generate_signed_url(
        version="v4",
        expiration=timedelta(minutes=15),
        method="PUT",
        content_type=content_type,
    )

    return {
        "uploadUrl": url,
        "path": object_name
    }

def create_signed_download_url(file_path: str, user_id: str):
    client = storage.Client()
    bucket = client.bucket(GCS_AUDIO_BUCKET)

    if not file_path.startswith(f"{user_id}/"):
        raise ValueError("Access denied")

    blob = bucket.blob(file_path)
    if not blob.exists():
        raise FileNotFoundError("File not found")

    url = blob.generate_signed_url(
        version="v4",
        expiration=timedelta(hours=1),
        method="GET",
    )

    return {"downloadUrl": url}

def save_file_metadata(user_id: str, meta: dict):
    session_id = meta.get("sessionId") or str(uuid.uuid4())
    ref = _db.collection("users").document(user_id).collection("sessions").document(session_id)
    meta["created_at"] = datetime.utcnow()
    ref.set(meta)
    return {"message": "Metadata saved", "sessionId": session_id}
