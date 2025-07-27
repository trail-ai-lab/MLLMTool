from google.cloud import storage
from datetime import timedelta, datetime
from app.core.firebase_client import db as _db
import uuid
import os

from app.services.transcribe_service import TranscribeService
from app.services.summary_service import summarize_and_save

GCS_AUDIO_BUCKET = os.getenv("GCS_AUDIO_BUCKET")
DEFAULT_TOOL = "slai"

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


def save_source_metadata(user_id: str, meta: dict, tool: str = DEFAULT_TOOL):
    source_id = meta.get("sourceId") or str(uuid.uuid4())
    meta["created_at"] = datetime.utcnow()

    ref = (
        _db.collection("tools")
        .document(tool)
        .collection("users")
        .document(user_id)
        .collection("sources")
        .document(source_id)
    )

    ref.set(meta)

    if meta.get("fileType") == "audio":
        try:
            service = TranscribeService()
            transcript = service.transcribe(
                provider="groq",
                gcs_path=meta["path"],
                user_id=user_id
            )

            ref.update({
                "transcript": {
                    "text": transcript["transcript"],
                    "provider": transcript["provider"],
                    "created_at": datetime.utcnow()
                }
            })

            try:
                summarize_and_save(user_id=user_id, source_id=source_id)
            except Exception as e:
                print(f"[warn] Failed to summarize: {e}")

        except Exception as e:
            print(f"[warn] Failed to auto-transcribe: {e}")

    return {"message": "Metadata saved", "sourceId": source_id}


def get_all_sources(user_id: str, tool: str = DEFAULT_TOOL):
    try:
        ref = (
            _db.collection("tools")
            .document(tool)
            .collection("users")
            .document(user_id)
            .collection("sources")
        )
        docs = ref.order_by("created_at", direction="DESCENDING").stream()
        return [doc.to_dict() | {"sourceId": doc.id} for doc in docs]
    except Exception as e:
        print(f"[error] Failed to fetch sources for {user_id}: {e}")
        return []


def delete_source(user_id: str, source_id: str, tool: str = DEFAULT_TOOL):
    ref = (
        _db.collection("tools")
        .document(tool)
        .collection("users")
        .document(user_id)
        .collection("sources")
        .document(source_id)
    )

    doc = ref.get()
    if not doc.exists:
        raise ValueError("Source not found")

    data = doc.to_dict()
    path = data.get("path")
    if not path:
        raise ValueError("Missing GCS path in metadata")

    # Delete from GCS
    client = storage.Client()
    bucket = client.bucket(GCS_AUDIO_BUCKET)
    blob = bucket.blob(path)
    if blob.exists():
        blob.delete()

    # Delete from Firestore
    ref.delete()

    return {"message": "Source deleted", "sourceId": source_id}
