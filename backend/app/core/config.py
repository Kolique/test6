from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Mistral
    mistral_api_key: str = ""
    mistral_chat_model: str = "mistral-large-latest"
    mistral_embed_model: str = "mistral-embed"

    # Supabase
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    database_url: str = ""

    # Security
    jwt_secret: str = ""
    jwt_expiration_minutes: int = 480

    # CORS
    cors_origins: str = "http://localhost:3000"

    # App
    environment: str = "development"

    # RAG
    chunk_size: int = 1000
    chunk_overlap: int = 200
    rag_top_k: int = 5
    rag_similarity_threshold: float = 0.3

    # Upload
    max_upload_size_mb: int = 20

    # RGPD
    log_conversations: bool = False
    log_level: str = "INFO"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
