from app.pipelines.groq_whisper_pipeline import GroqWhisperPipeline
from app.pipelines.groq_summarization_pipeline import GroqSummarizationPipeline

class ModelRegistry:
    def __init__(self):
        self._registry = {}

        # 🧠 Register transcription pipeline
        self.register("groq", GroqWhisperPipeline)

        # 🧠 Register summarization pipeline
        self.register("groq_summarizer", GroqSummarizationPipeline)

    def register(self, provider_name: str, pipeline_cls):
        self._registry[provider_name] = pipeline_cls

    def get_pipeline(self, provider_name: str):
        pipeline_cls = self._registry.get(provider_name)
        if not pipeline_cls:
            raise ValueError(f"Provider '{provider_name}' is not registered.")
        return pipeline_cls()
