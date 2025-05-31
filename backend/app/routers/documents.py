from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
import os
import uuid
import aiofiles
from pathlib import Path

from ..database import get_db
from ..models import Document, Application, User, UserRole, DocumentType
from ..schemas import Document as DocumentSchema, DocumentUpload, MessageResponse
from ..core.auth import get_current_active_user, require_role
from ..core.config import settings

router = APIRouter()

async def save_upload_file(upload_file: UploadFile, destination: Path) -> None:
    """Save uploaded file to disk."""
    async with aiofiles.open(destination, 'wb') as f:
        content = await upload_file.read()
        await f.write(content)

def get_file_extension(filename: str) -> str:
    """Get file extension."""
    return Path(filename).suffix.lower()

@router.post("/upload/{application_id}", response_model=DocumentSchema)
async def upload_document(
    application_id: int,
    document_type: DocumentType,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Upload document for an application."""
    # Check if application exists and user has access
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="درخواست مورد نظر یافت نشد"
        )
    
    # Check permissions
    if current_user.role == UserRole.APPLICANT and application.applicant_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="دسترسی غیرمجاز"
        )
    
    # Validate file
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="نام فایل نامعتبر است"
        )
    
    file_extension = get_file_extension(file.filename)
    if file_extension not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"فرمت فایل مجاز نیست. فرمت‌های مجاز: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )
    
    # Check file size
    file_content = await file.read()
    if len(file_content) > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="حجم فایل بیش از حد مجاز است"
        )
    
    # Reset file pointer
    await file.seek(0)
    
    # Create upload directory if it doesn't exist
    upload_dir = Path(settings.UPLOAD_DIR) / str(application_id)
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate unique filename
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = upload_dir / unique_filename
    
    # Save file
    await save_upload_file(file, file_path)
    
    # Check if document of this type already exists for this application
    existing_doc = db.query(Document).filter(
        Document.application_id == application_id,
        Document.document_type == document_type
    ).first()
    
    if existing_doc:
        # Update existing document
        # Delete old file
        old_file_path = Path(existing_doc.file_path)
        if old_file_path.exists():
            old_file_path.unlink()
        
        # Update database record
        existing_doc.filename = unique_filename
        existing_doc.original_filename = file.filename
        existing_doc.file_path = str(file_path)
        existing_doc.file_size = len(file_content)
        existing_doc.mime_type = file.content_type
        existing_doc.version += 1
        existing_doc.is_approved = False
        
        db.commit()
        db.refresh(existing_doc)
        return existing_doc
    else:
        # Create new document record
        db_document = Document(
            application_id=application_id,
            document_type=document_type,
            filename=unique_filename,
            original_filename=file.filename,
            file_path=str(file_path),
            file_size=len(file_content),
            mime_type=file.content_type,
            uploaded_by=current_user.id
        )
        
        db.add(db_document)
        db.commit()
        db.refresh(db_document)
        
        return db_document

@router.get("/application/{application_id}", response_model=List[DocumentSchema])
async def get_application_documents(
    application_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all documents for an application."""
    # Check if application exists and user has access
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="درخواست مورد نظر یافت نشد"
        )
    
    # Check permissions
    if current_user.role == UserRole.APPLICANT and application.applicant_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="دسترسی غیرمجاز"
        )
    
    documents = db.query(Document).filter(Document.application_id == application_id).all()
    return documents

@router.get("/download/{document_id}")
async def download_document(
    document_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Download a document."""
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="سند مورد نظر یافت نشد"
        )
    
    # Check permissions
    application = document.application
    if current_user.role == UserRole.APPLICANT and application.applicant_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="دسترسی غیرمجاز"
        )
    
    file_path = Path(document.file_path)
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="فایل یافت نشد"
        )
    
    return FileResponse(
        path=file_path,
        filename=document.original_filename,
        media_type=document.mime_type
    )

@router.delete("/{document_id}", response_model=MessageResponse)
async def delete_document(
    document_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a document."""
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="سند مورد نظر یافت نشد"
        )
    
    # Check permissions
    application = document.application
    if current_user.role == UserRole.APPLICANT:
        if application.applicant_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="دسترسی غیرمجاز"
            )
        # Applicants can only delete documents from draft applications
        if application.status.value != "draft":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="امکان حذف سند از درخواست ارسال شده وجود ندارد"
            )
    
    # Delete file from disk
    file_path = Path(document.file_path)
    if file_path.exists():
        file_path.unlink()
    
    # Delete from database
    db.delete(document)
    db.commit()
    
    return MessageResponse(message="سند با موفقیت حذف شد")

@router.post("/{document_id}/approve", response_model=MessageResponse)
async def approve_document(
    document_id: int,
    approval_notes: str = "",
    current_user: User = Depends(require_role([UserRole.EVALUATOR, UserRole.GOVERNANCE, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """Approve a document (Evaluators and above only)."""
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="سند مورد نظر یافت نشد"
        )
    
    document.is_approved = True
    document.approval_notes = approval_notes
    db.commit()
    
    return MessageResponse(message="سند تأیید شد")

@router.post("/{document_id}/reject", response_model=MessageResponse)
async def reject_document(
    document_id: int,
    rejection_notes: str,
    current_user: User = Depends(require_role([UserRole.EVALUATOR, UserRole.GOVERNANCE, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """Reject a document (Evaluators and above only)."""
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="سند مورد نظر یافت نشد"
        )
    
    document.is_approved = False
    document.approval_notes = rejection_notes
    db.commit()
    
    return MessageResponse(message="سند رد شد") 