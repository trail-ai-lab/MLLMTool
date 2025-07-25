# backend/app/utils/gcs_utils.py

import os
from google.cloud import storage

GCS_AUDIO_BUCKET = os.getenv("GCS_AUDIO_BUCKET")

def fetch_audio_from_gcs(gcs_path: str, user_id: str) -> bytes:
    if not gcs_path.startswith(f"{user_id}/"):
        raise PermissionError("Access denied to file")

    client = storage.Client()
    bucket = client.bucket(GCS_AUDIO_BUCKET)
    blob = bucket.blob(gcs_path)

    if not blob.exists():
        raise FileNotFoundError("Audio file not found")

    return blob.download_as_bytes()
