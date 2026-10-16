"""CareDesk backend settings - reads DATABASE_URL from the environment."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "CareDesk"
    database_url: str = "postgresql+psycopg://caredesk:caredesk@localhost:5432/caredesk"
    seed_on_startup: bool = True


settings = Settings()
