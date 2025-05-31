from fastapi import APIRouter, Depends, HTTPException, status, Query, Form, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import uuid
import os
from pathlib import Path

from ..database import get_db
from ..models import Application, User, UserRole, ApplicationStatus, ProductType
from ..schemas import (
    ApplicationCreate, ApplicationUpdate, Application as ApplicationSchema,
    ApplicationSummary, DashboardStats
)
from ..core.auth import get_current_active_user, require_role

router = APIRouter()

def generate_application_number() -> str:
    """Generate unique application number."""
    year = datetime.now().year
    timestamp = int(datetime.now().timestamp())
    return f"ITRC-{year}-{timestamp}"

@router.post("/", response_model=ApplicationSchema)
async def create_application(
    product_name: str = Form("نام محصول"),  # Default: "Product Name" in Persian
    product_type: str = Form("Software"),
    description: str = Form(""),
    evaluation_level: str = Form("EAL1"),
    company_name: str = Form(""),
    contact_person: str = Form(""),
    contact_email: str = Form(""),
    contact_phone: str = Form(""),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create new application (Applicants only)."""
    print(f"🚀 Creating application for user ID: {current_user.id}, email: {current_user.email}")
    print(f"📝 Application details: product={product_name}, type={product_type}, company={company_name}")
    
    # Check if user is applicant
    if current_user.role != UserRole.APPLICANT:
        print(f"❌ User role {current_user.role} is not APPLICANT for create application")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"فقط متقاضیان می‌توانند درخواست جدید ایجاد کنند. نقش فعلی: {current_user.role}"
        )
    
    # Find product type by name
    product_type_obj = db.query(ProductType).filter(ProductType.name_en == product_type).first()
    if not product_type_obj:
        # If not found by English name, try to find by ID or create a default one
        product_type_obj = db.query(ProductType).first()  # Get any product type for now
        print(f"⚠️  Product type '{product_type}' not found, using default: {product_type_obj.name_en if product_type_obj else 'None'}")
    else:
        print(f"✅ Found product type: {product_type_obj.name_en}")
    
    # Create application
    db_application = Application(
        application_number=generate_application_number(),
        applicant_id=current_user.id,
        product_name=product_name,
        product_type_id=product_type_obj.id if product_type_obj else 1,
        description=description,
        evaluation_level=evaluation_level,
        company_name=company_name,
        contact_person=contact_person,
        contact_email=contact_email,
        contact_phone=contact_phone,
        status=ApplicationStatus.SUBMITTED,
        submission_date=datetime.utcnow()
    )
    
    print(f"💾 Saving application with applicant_id: {db_application.applicant_id}")
    
    db.add(db_application)
    db.commit()
    db.refresh(db_application)
    
    print(f"✅ Application created successfully with ID: {db_application.id}, Number: {db_application.application_number}")
    
    return db_application

@router.get("/", response_model=List[ApplicationSummary])
async def get_applications(
    status: Optional[ApplicationStatus] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get applications list based on user role."""
    query = db.query(Application)
    
    # Filter based on user role
    if current_user.role == UserRole.APPLICANT:
        query = query.filter(Application.applicant_id == current_user.id)
    elif current_user.role == UserRole.EVALUATOR:
        # Evaluators see applications assigned to them or available for assignment
        query = query.filter(
            Application.status.in_([ApplicationStatus.SUBMITTED, ApplicationStatus.IN_EVALUATION])
        )
    # Governance and Admin see all applications
    
    if status:
        query = query.filter(Application.status == status)
    
    applications = query.offset(skip).limit(limit).all()
    
    # Convert to summary format
    summaries = []
    for app in applications:
        summaries.append(ApplicationSummary(
            id=app.id,
            application_number=app.application_number,
            product_name=app.product_name,
            status=app.status,
            submission_date=app.submission_date,
            product_type_name=app.product_type.name_fa
        ))
    
    return summaries

@router.get("/{application_id}", response_model=ApplicationSchema)
async def get_application(
    application_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get specific application details."""
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="درخواست مورد نظر یافت نشد"
        )
    
    # Check access permissions
    if current_user.role == UserRole.APPLICANT and application.applicant_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="دسترسی غیرمجاز"
        )
    
    return application

@router.put("/{application_id}", response_model=ApplicationSchema)
async def update_application(
    application_id: int,
    application_update: ApplicationUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update application."""
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="درخواست مورد نظر یافت نشد"
        )
    
    # Check permissions
    can_update = False
    if current_user.role == UserRole.APPLICANT and application.applicant_id == current_user.id:
        # Applicants can only update their own applications in DRAFT status
        if application.status != ApplicationStatus.DRAFT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="امکان ویرایش درخواست ارسال شده وجود ندارد"
            )
        can_update = True
    elif current_user.role in [UserRole.EVALUATOR, UserRole.GOVERNANCE, UserRole.ADMIN]:
        can_update = True
    
    if not can_update:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="دسترسی غیرمجاز"
        )
    
    # Update fields
    update_data = application_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(application, field, value)
    
    application.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(application)
    
    return application

@router.post("/{application_id}/submit")
async def submit_application(
    application_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Submit application for evaluation."""
    print(f"🚀 Submit application {application_id} for user ID: {current_user.id}, role: {current_user.role}")
    
    # Check if user is applicant
    if current_user.role != UserRole.APPLICANT:
        print(f"❌ User role {current_user.role} is not APPLICANT for submit application")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"فقط متقاضیان می‌توانند درخواست ارسال کنند. نقش فعلی: {current_user.role}"
        )
    
    application = db.query(Application).filter(
        Application.id == application_id,
        Application.applicant_id == current_user.id
    ).first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="درخواست مورد نظر یافت نشد"
        )
    
    if application.status != ApplicationStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="این درخواست قبلاً ارسال شده است"
        )
    
    # Check if all required documents are uploaded
    required_docs = application.product_type.required_documents
    uploaded_docs = [doc.document_type.value for doc in application.documents]
    
    missing_docs = set(required_docs) - set(uploaded_docs)
    if missing_docs:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"اسناد زیر ارسال نشده است: {', '.join(missing_docs)}"
        )
    
    # Submit application
    application.status = ApplicationStatus.SUBMITTED
    application.submission_date = datetime.utcnow()
    
    # Calculate estimated completion date
    estimated_days = application.product_type.estimated_days
    application.estimated_completion_date = datetime.utcnow() + timedelta(days=estimated_days)
    
    db.commit()
    
    return {"message": "درخواست با موفقیت ارسال شد", "application_number": application.application_number}

@router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get dashboard statistics."""
    stats = DashboardStats(
        total_applications=0,
        pending_applications=0,
        in_evaluation=0,
        completed_applications=0
    )
    
    if current_user.role == UserRole.APPLICANT:
        # Stats for applicant's own applications
        user_apps = db.query(Application).filter(Application.applicant_id == current_user.id)
        stats.total_applications = user_apps.count()
        stats.pending_applications = user_apps.filter(
            Application.status.in_([ApplicationStatus.DRAFT, ApplicationStatus.SUBMITTED])
        ).count()
        stats.in_evaluation = user_apps.filter(
            Application.status == ApplicationStatus.IN_EVALUATION
        ).count()
        stats.completed_applications = user_apps.filter(
            Application.status == ApplicationStatus.COMPLETED
        ).count()
        stats.my_applications = stats.total_applications
        
    elif current_user.role == UserRole.EVALUATOR:
        # Stats for evaluator
        all_apps = db.query(Application)
        stats.total_applications = all_apps.count()
        stats.pending_applications = all_apps.filter(
            Application.status == ApplicationStatus.SUBMITTED
        ).count()
        stats.in_evaluation = all_apps.filter(
            Application.status == ApplicationStatus.IN_EVALUATION
        ).count()
        stats.completed_applications = all_apps.filter(
            Application.status == ApplicationStatus.COMPLETED
        ).count()
        
        # My evaluations
        from ..models import Evaluation
        stats.my_evaluations = db.query(Evaluation).filter(
            Evaluation.evaluator_id == current_user.id
        ).count()
        
    else:  # Governance or Admin
        all_apps = db.query(Application)
        stats.total_applications = all_apps.count()
        stats.pending_applications = all_apps.filter(
            Application.status.in_([ApplicationStatus.SUBMITTED, ApplicationStatus.IN_REVIEW])
        ).count()
        stats.in_evaluation = all_apps.filter(
            Application.status == ApplicationStatus.IN_EVALUATION
        ).count()
        stats.completed_applications = all_apps.filter(
            Application.status == ApplicationStatus.COMPLETED
        ).count()
    
    return stats

@router.get("/my", response_model=List[ApplicationSummary])
async def get_my_applications(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get current user's applications."""
    print(f"🔍 /my endpoint called - User ID: {current_user.id}, email: {current_user.email}, role: {current_user.role}")
    
    # Check if user is applicant
    if current_user.role != UserRole.APPLICANT:
        print(f"❌ User role {current_user.role} is not APPLICANT, returning 403")
        print(f"❌ Expected: {UserRole.APPLICANT}, Got: {current_user.role}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"این صفحه فقط برای متقاضیان در دسترس است. نقش فعلی: {current_user.role}"
        )
    
    print(f"✅ User role check passed - proceeding to get applications")
    
    applications = db.query(Application).filter(
        Application.applicant_id == current_user.id
    ).all()
    
    print(f"📊 Found {len(applications)} applications for user ID {current_user.id}")
    for app in applications:
        print(f"   - App ID: {app.id}, Number: {app.application_number}, Status: {app.status}")
    
    # Convert to summary format
    summaries = []
    for app in applications:
        print(f"🔍 Processing application: {app.id}, product: {app.product_name}, status: {app.status}")
        
        # Fix product_type_name to always return a string
        product_type_name = "نامشخص"  # Default: "Unknown" in Persian
        if app.product_type:
            product_type_name = app.product_type.name_fa
        elif app.product_type_id:
            # Try to fetch product type by ID if relationship failed
            product_type = db.query(ProductType).filter(ProductType.id == app.product_type_id).first()
            if product_type:
                product_type_name = product_type.name_fa
        
        summaries.append(ApplicationSummary(
            id=app.id,
            application_number=app.application_number,
            product_name=app.product_name,
            status=app.status,
            submission_date=app.submission_date,
            product_type_name=product_type_name
        ))
    
    print(f"✅ Returning {len(summaries)} application summaries")
    return summaries

@router.get("/dashboard/list", response_model=List[ApplicationSummary])
async def get_dashboard_applications(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get applications for dashboard based on user role."""
    print(f"🎛️ Dashboard request from user ID: {current_user.id}, email: {current_user.email}, role: {current_user.role}")
    
    applications = []
    
    if current_user.role == UserRole.APPLICANT:
        # Applicants see their own applications
        applications = db.query(Application).filter(
            Application.applicant_id == current_user.id
        ).all()
        print(f"📋 Applicant dashboard: Found {len(applications)} applications")
        
    elif current_user.role == UserRole.EVALUATOR:
        # Evaluators see submitted applications available for evaluation
        applications = db.query(Application).filter(
            Application.status.in_([ApplicationStatus.SUBMITTED, ApplicationStatus.IN_EVALUATION])
        ).all()
        print(f"📋 Evaluator dashboard: Found {len(applications)} applications")
        
    elif current_user.role in [UserRole.GOVERNANCE, UserRole.ADMIN]:
        # Governance and Admin see all applications
        applications = db.query(Application).all()
        print(f"📋 Admin/Governance dashboard: Found {len(applications)} applications")
    
    # Convert to summary format
    summaries = []
    for app in applications:
        print(f"🔍 Processing application: {app.id}, status: {app.status}")
        
        # Fix product_type_name to always return a string
        product_type_name = "نامشخص"  # Default: "Unknown" in Persian
        if app.product_type:
            product_type_name = app.product_type.name_fa
        elif app.product_type_id:
            # Try to fetch product type by ID if relationship failed
            product_type = db.query(ProductType).filter(ProductType.id == app.product_type_id).first()
            if product_type:
                product_type_name = product_type.name_fa
        
        # Add applicant name for non-applicant users
        applicant_name = None
        if current_user.role != UserRole.APPLICANT and app.applicant:
            applicant_name = app.applicant.company or app.applicant.full_name
        
        summaries.append(ApplicationSummary(
            id=app.id,
            application_number=app.application_number,
            product_name=app.product_name,
            status=app.status,
            submission_date=app.submission_date,
            product_type_name=product_type_name,
            applicant_name=applicant_name,
            evaluation_level=app.evaluation_level
        ))
    
    print(f"✅ Dashboard returning {len(summaries)} application summaries")
    return summaries

@router.get("/available", response_model=List[ApplicationSummary])
async def get_available_applications(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get applications available for evaluation."""
    print(f"🔍 /available endpoint called - User ID: {current_user.id}, email: {current_user.email}, role: {current_user.role}")
    
    # Check if user has evaluator, governance, or admin role
    allowed_roles = [UserRole.EVALUATOR, UserRole.GOVERNANCE, UserRole.ADMIN]
    if current_user.role not in allowed_roles:
        print(f"❌ User role {current_user.role} not in allowed roles: {allowed_roles}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"دسترسی غیرمجاز. نقش فعلی: {current_user.role}"
        )
    
    print(f"✅ User role check passed - proceeding to get available applications")
    
    applications = db.query(Application).filter(
        Application.status == ApplicationStatus.SUBMITTED
    ).all()
    
    print(f"📊 Found {len(applications)} available applications")
    
    # Convert to summary format
    summaries = []
    for app in applications:
        print(f"🔍 Processing application: {app.id}, product: {app.product_name}, status: {app.status}")
        
        # Fix product_type_name to always return a string
        product_type_name = "نامشخص"  # Default: "Unknown" in Persian
        if app.product_type:
            product_type_name = app.product_type.name_fa
        elif app.product_type_id:
            # Try to fetch product type by ID if relationship failed
            product_type = db.query(ProductType).filter(ProductType.id == app.product_type_id).first()
            if product_type:
                product_type_name = product_type.name_fa

        # Add applicant name for evaluators
        applicant_name = "نامشخص"
        if app.applicant:
            applicant_name = app.applicant.company or app.applicant.full_name
        
        summaries.append(ApplicationSummary(
            id=app.id,
            application_number=app.application_number,
            product_name=app.product_name,
            status=app.status,
            submission_date=app.submission_date,
            product_type_name=product_type_name,
            applicant_name=applicant_name,
            evaluation_level=app.evaluation_level
        ))
    
    print(f"✅ Returning {len(summaries)} application summaries for evaluator")
    return summaries 