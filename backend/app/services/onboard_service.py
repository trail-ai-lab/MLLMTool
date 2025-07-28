from datetime import datetime
from app.core.firebase_client import db as _db

def ensure_user_onboarded(uid: str, tool: str = "slai"):
    user_meta_ref = (
        _db.collection("tools")
        .document(tool)
        .collection("users")
        .document(uid)
        .collection("metadata")
        .document("profile")
    )

    doc = user_meta_ref.get()

    if doc.exists:
        return {"message": f"{tool.upper()} onboarding already completed"}

    user_meta_ref.set({
        "onboardingComplete": True,
        "onboarded_at": datetime.utcnow()
    })

    return {"message": f"{tool.upper()} onboarding complete"}
