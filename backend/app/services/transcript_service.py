from google.cloud import firestore
from datetime import datetime
from app.core.firebase_client import db as _db

DEFAULT_TOOL = "slai"

def get_transcript(user_id: str, source_id: str, tool: str = DEFAULT_TOOL):
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
    transcript = data.get("transcript")
    if not transcript:
        raise ValueError("Transcript not found")
    return transcript


def update_transcript(user_id: str, source_id: str, text: str, provider: str, tool: str = DEFAULT_TOOL):
    ref = (
        _db.collection("tools")
        .document(tool)
        .collection("users")
        .document(user_id)
        .collection("sources")
        .document(source_id)
    )
    if not ref.get().exists:
        raise ValueError("Source not found")

    ref.update({
        "transcript": {
            "text": text,
            "provider": provider,
            "created_at": datetime.utcnow()
        }
    })


def delete_transcript(user_id: str, source_id: str, tool: str = DEFAULT_TOOL):
    ref = (
        _db.collection("tools")
        .document(tool)
        .collection("users")
        .document(user_id)
        .collection("sources")
        .document(source_id)
    )
    if not ref.get().exists:
        raise ValueError("Source not found")

    ref.update({"transcript": firestore.DELETE_FIELD})
