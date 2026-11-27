from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: str = "development"
    log_level: str = "INFO"
    ai_service_key: str = Field(min_length=8)
    ollama_base_url: str = "http://127.0.0.1:11434"
    ollama_model: str = "llama3.2:3b"
    embedding_model: str = "nomic-embed-text"
    vector_store_path: str = "./ml_data/vector_store"
    ollama_status_timeout_seconds: float = 3.0
    ollama_generate_timeout_seconds: float = 120.0


@lru_cache
def get_settings() -> Settings:
    return Settings()
