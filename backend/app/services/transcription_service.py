# backend/app/services/transcription_service.py

from app.services.model_registry import ModelRegistry

class TranscriptionService:
    def __init__(self):
        self.registry = ModelRegistry()

    def transcribe(self, provider: str, gcs_path: str, user_id: str):
        pipeline = self.registry.get_pipeline(provider)
        return pipeline.run(gcs_path, user_id)
