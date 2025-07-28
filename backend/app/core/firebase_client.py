import os
import firebase_admin
from firebase_admin import credentials, firestore

if not firebase_admin._apps:
    cred_json = os.getenv("GOOGLE_APPLICATION_CREDENTIALS_JSON")
    if not cred_json:
        raise Exception("Missing GOOGLE_APPLICATION_CREDENTIALS_JSON")
    cred = credentials.Certificate(eval(cred_json))
    firebase_admin.initialize_app(cred)

db = firestore.client()
