from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    app_name: str = "V.A.L.A.R."
    app_version: str = "0.1.0"
    environment: str = "development"
    database_url: str
    cors_origins: str = "http://localhost:5173"
    bedrock_region: str = "us-east-1"
    bedrock_model_id: str = "global.anthropic.claude-sonnet-4-5-20250929-v1:0"

    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def allowed_origins(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.cors_origins.split(",")
            if origin.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    return Settings()
