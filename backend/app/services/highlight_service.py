# app/services/highlight_service.py

from datetime import datetime
from app.core.firebase_client import db as _db
from app.services.model_registry import ModelRegistry

DEFAULT_TOOL = "slai"

def generate_highlight(user_id: str, source_id: str, prompt: str, provider: str = "groq_highlight", tool: str = DEFAULT_TOOL):
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

    transcript = doc.to_dict().get("transcript", {}).get("text")
    if not transcript:
        raise ValueError("Transcript missing")

    pipeline = ModelRegistry().get_pipeline(provider)
    response = pipeline.run(transcript, prompt)  # must return { answer, sentence }

    highlight_doc = {
        "prompt": prompt,
        "highlightedSentence": response["sentence"],
        "answer": response["answer"],
        "created_at": datetime.utcnow(),
    }

    # Save to subcollection
    _db.collection("tools")\
        .document(tool)\
        .collection("users")\
        .document(user_id)\
        .collection("sources")\
        .document(source_id)\
        .collection("highlights")\
        .add(highlight_doc)

    return highlight_doc
