# app/core/firebase_auth.py

import os
import json
from fastapi import Request, HTTPException, status
import firebase_admin
from firebase_admin import credentials, auth
from dotenv import load_dotenv

load_dotenv()

# Initialize Firebase Admin
if not firebase_admin._apps:
    creds = credentials.Certificate(
        json.loads(os.environ["GOOGLE_APPLICATION_CREDENTIALS_JSON"])
    )
    firebase_admin.initialize_app(creds)

def verify_firebase_token(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing Authorization Header")

    token = auth_header.split("Bearer ")[-1]
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid token: {str(e)}")
