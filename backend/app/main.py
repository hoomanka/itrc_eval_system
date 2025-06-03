from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPBearer
import uvicorn
from pathlib import Path
import os

from .routers import auth, users, applications, evaluations, documents, reports, admin, security_targets
from .database import engine, Base
from .core.config import settings

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ITRC Common Criteria Evaluation Platform",
    description="سامانه ارزیابی معیارهای مشترک مرکز تحقیقات فناوری اطلاعات",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for uploaded documents
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(applications.router, prefix="/api/applications", tags=["Applications"])
app.include_router(evaluations.router, prefix="/api/evaluations", tags=["Evaluations"])
app.include_router(documents.router, prefix="/api/documents", tags=["Documents"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(security_targets.router, prefix="/api/security-targets", tags=["Security Targets"])

print('Including reports router')

# Add handler for AI tool requests to prevent 404 logs
@app.get("/v1/models")
async def models_endpoint():
    """Handle AI tool requests - return empty models list"""
    return {"object": "list", "data": []}

@app.get("/")
async def root():
    return {
        "message": "سامانه ارزیابی معیارهای مشترک ITRC",
        "version": "1.0.0",
        "docs": "/api/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "سامانه در حال اجرا است"}

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"}
    )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 