from typing import Optional, List

class Settings:
    # Database
    DATABASE_URL: str = "postgresql+psycopg://postgres:postgres123@localhost:5432/itrc_cc_db"
    
    # JWT Settings
    SECRET_KEY: str = "itrc-cc-platform-secret-key-change-in-production-2024"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # File Upload
    MAX_FILE_SIZE: int = 50 * 1024 * 1024  # 50MB
    UPLOAD_DIR: str = "uploads"
    ALLOWED_EXTENSIONS: List[str] = [".pdf", ".doc", ".docx", ".txt", ".zip"]
    
    # Redis (for caching and session management)
    REDIS_URL: str = "redis://localhost:6379"
    
    # Email settings (for notifications)
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: Optional[int] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None

settings = Settings() 