from datetime import datetime
from app.core.firebase_client import db as _db

def ensure_user_onboarded(uid: str):
    slai_user_ref = _db.collection("users").document(uid).collection("slai").document("meta")
    user_doc = slai_user_ref.get()

    if user_doc.exists:
        return {"message": "Already onboarded"}

    slai_user_ref.set({
        "onboardingComplete": True,
        "onboarded_at": datetime.utcnow()
    })

    return {"message": "SLAI onboarding complete"}
