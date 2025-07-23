# app/services/audio_service.py
from google.cloud import storage
# from firebase_admin import firestore
from datetime import timedelta
import uuid
import os

GCS_AUDIO_BUCKET = os.getenv("GCS_AUDIO_BUCKET")

# # Clients
# firestore_client = firestore.client()
# storage_client = storage.Client()

def create_signed_upload_url(user_id: str):
    client = storage.Client()
    bucket = client.bucket(GCS_AUDIO_BUCKET)

    object_name = f"{user_id}/{uuid.uuid4()}.webm"  # or .mp3, .wav based on frontend
    blob = bucket.blob(object_name)

    url = blob.generate_signed_url(
        version="v4",
        expiration=timedelta(minutes=15),
        method="PUT",
        content_type="audio/webm",
    )

    return {
        "uploadUrl": url,
        "path": object_name
    }

def create_signed_download_url(file_path: str, user_id: str):
    """
    Creates a signed download URL for a GCS file
    """
    client = storage.Client()
    bucket = client.bucket(GCS_AUDIO_BUCKET)
    
    # Verify the file belongs to the user (security check)
    if not file_path.startswith(f"{user_id}/"):
        raise ValueError("Access denied: File does not belong to user")
    
    blob = bucket.blob(file_path)
    
    # Check if file exists
    if not blob.exists():
        raise FileNotFoundError(f"File not found: {file_path}")
    
    url = blob.generate_signed_url(
        version="v4",
        expiration=timedelta(hours=1),
        method="GET",
    )
    
    return {
        "downloadUrl": url
    }

# def save_audio_metadata(uid: str, file_path: str, title: str = None):
#     """
#     Saves metadata for an uploaded audio file to Firestore under tools/slai/users/{uid}/audio_sources/{audio_id}
#     """
#     if not GCS_AUDIO_BUCKET:
#         raise ValueError("GCS_AUDIO_BUCKET not configured")

#     bucket = storage_client.bucket(GCS_AUDIO_BUCKET)
#     blob = bucket.blob(file_path)

#     if not blob.exists():
#         raise FileNotFoundError(f"File not found in GCS: {file_path}")

#     blob.reload()  # fetch latest metadata
#     metadata = blob._properties  # raw metadata dict

#     audio_id = str(uuid.uuid4())
    
#     doc_ref = firestore_client.collection("tools").document("slai") \
#         .collection("users").document(uid) \
#         .collection("audio_sources").document(audio_id)

#     doc_ref.set({
#         "id": audio_id,
#         "userId": uid,
#         "title": title or blob.name.split("/")[-1],
#         "fileName": blob.name,
#         "bucket": GCS_AUDIO_BUCKET,
#         "size": int(metadata.get("size", 0)),
#         "contentType": metadata.get("contentType", "unknown"),
#         "createdAt": metadata.get("timeCreated", datetime.utcnow().isoformat()),
#     })

#     return {"id": audio_id, "message": "Audio metadata saved"}
