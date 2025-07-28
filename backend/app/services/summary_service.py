from app.core.firebase_client import db as _db
from app.services.model_registry import ModelRegistry
from app.core.constants import DEFAULT_TOOL
from datetime import datetime

def get_summary(user_id: str, source_id: str, tool: str = DEFAULT_TOOL) -> dict:
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

    summary = doc.to_dict().get("summary")
    if not summary:
        raise ValueError("Summary not available")

    return summary


def summarize_and_save(user_id: str, source_id: str, provider: str = "groq_summarizer", tool: str = DEFAULT_TOOL) -> str:
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
        raise ValueError("Transcript missing for this source")

    pipeline = ModelRegistry().get_pipeline(provider)
    summary_text = pipeline.run(transcript)

    ref.update({
        "summary": {
            "text": summary_text,
            "provider": provider,
            "created_at": datetime.utcnow()
        }
    })

    return summary_text
