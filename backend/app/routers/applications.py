from fastapi import APIRouter, Depends, HTTPException, status, Query, Form, UploadFile, File
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime, timedelta
import uuid
import os
from pathlib import Path

from ..database import get_db
from ..models import Application, User, UserRole, ApplicationStatus, ProductType
from ..schemas import (
    ApplicationCreate, ApplicationUpdate, Application as ApplicationSchema,
    ApplicationSummary, ApplicationDetail, DashboardStats
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
    product_name: str = Form(...),
    product_type: str = Form("Antimalware Software"),  # Default to antimalware
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
    print(f"📝 Form data received:")
    print(f"   - product_name: {product_name}")
    print(f"   - product_type: {product_type}")
    print(f"   - description: {description}")
    print(f"   - evaluation_level: {evaluation_level}")
    print(f"   - company_name: {company_name}")
    print(f"   - contact_person: {contact_person}")
    print(f"   - contact_email: {contact_email}")
    print(f"   - contact_phone: {contact_phone}")
    
    # Check if user is applicant
    if current_user.role != UserRole.APPLICANT:
        print(f"❌ User role {current_user.role} is not APPLICANT for create application")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"فقط متقاضیان می‌توانند درخواست جدید ایجاد کنند. نقش فعلی: {current_user.role}"
        )
    
    # Find product type by name (either English or Persian)
    product_type_obj = db.query(ProductType).filter(
        (ProductType.name_en == product_type) | (ProductType.name_fa == product_type)
    ).first()
    
    if not product_type_obj:
        # Try to find antimalware as default
        product_type_obj = db.query(ProductType).filter(
            ProductType.name_en == "Antimalware Software"
        ).first()
        print(f"⚠️  Product type '{product_type}' not found, using antimalware default")
    
    if not product_type_obj:
        # Create default if none exists
        print("⚠️  No product types found, creating default antimalware type")
        product_type_obj = ProductType(
            name_en="Antimalware Software",
            name_fa="نرم‌افزار ضد بدافزار",
            protection_profile="PP_AV_V1.0",
            description_en="Antimalware software products",
            description_fa="محصولات نرم‌افزاری ضد بدافزار",
            estimated_days=120,
            estimated_cost=50000000.0,
            required_documents=["ST", "ALC", "AGD", "ASE", "ADV", "ATE", "AVA"],
            is_active=True
        )
        db.add(product_type_obj)
        db.commit()
        db.refresh(product_type_obj)
    
    print(f"✅ Using product type: {product_type_obj.name_fa} (ID: {product_type_obj.id})")
    
    # Use company_name from form, or fallback to user's company
    final_company_name = company_name if company_name.strip() else current_user.company or "شرکت نامشخص"
    final_contact_person = contact_person if contact_person.strip() else current_user.full_name
    final_contact_email = contact_email if contact_email.strip() else current_user.email
    final_contact_phone = contact_phone if contact_phone.strip() else current_user.phone or ""
    
    # Create application
    db_application = Application(
        application_number=generate_application_number(),
        applicant_id=current_user.id,
        product_name=product_name,
        product_type_id=product_type_obj.id,
        description=description,
        evaluation_level=evaluation_level,
        company_name=final_company_name,
        contact_person=final_contact_person,
        contact_email=final_contact_email,
        contact_phone=final_contact_phone,
        status=ApplicationStatus.SUBMITTED,  # Set to submitted immediately
        submission_date=datetime.utcnow()
    )
    
    print(f"💾 Saving application:")
    print(f"   - applicant_id: {db_application.applicant_id}")
    print(f"   - company_name: {db_application.company_name}")
    print(f"   - status: {db_application.status}")
    print(f"   - submission_date: {db_application.submission_date}")
    
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
    
    # Convert to summary format with proper field mapping
    summaries = []
    for app in applications:
        # Safe product type name extraction
        product_type_name = "نامشخص"
        if app.product_type:
            product_type_name = app.product_type.name_fa
        elif app.product_type_id:
            product_type = db.query(ProductType).filter(ProductType.id == app.product_type_id).first()
            if product_type:
                product_type_name = product_type.name_fa
        
        # Safe applicant name for all users (show company name)
        applicant_name = app.company_name or (app.applicant.company if app.applicant else "نامشخص")
        
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
    
    return summaries

@router.get("/{application_id}", response_model=ApplicationDetail)
async def get_application(
    application_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get specific application details."""
    print(f"🔍 Getting application {application_id} for user {current_user.id}")
    
    # Use eager loading to include related objects
    application = db.query(Application).options(
        joinedload(Application.applicant),
        joinedload(Application.product_type)
    ).filter(Application.id == application_id).first()
    
    if not application:
        print(f"❌ Application {application_id} not found")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="درخواست مورد نظر یافت نشد"
        )
    
    # Check access permissions
    if current_user.role == UserRole.APPLICANT and application.applicant_id != current_user.id:
        print(f"❌ Access denied: applicant {current_user.id} trying to access application owned by {application.applicant_id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="دسترسی غیرمجاز"
        )
    
    print(f"✅ Returning application details:")
    print(f"   - ID: {application.id}")
    print(f"   - Product: {application.product_name}")
    print(f"   - Company: {application.company_name}")
    print(f"   - Status: {application.status}")
    
    # Create response data in the format expected by frontend
    return ApplicationDetail(
        id=application.id,
        application_number=application.application_number,
        product_name=application.product_name,
        product_type=application.product_type.name_fa if application.product_type else "نامشخص",
        description=application.description or "",
        evaluation_level=application.evaluation_level or "EAL1",
        company_name=application.company_name or "",
        contact_person=application.contact_person or "",
        contact_email=application.contact_email or "",
        contact_phone=application.contact_phone or "",
        status=application.status.value,
        submission_date=application.submission_date.isoformat() if application.submission_date else None,
        created_at=application.created_at.isoformat(),
        updated_at=application.updated_at.isoformat()
    )

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
    
    # Submit application (skip document check for now)
    application.status = ApplicationStatus.SUBMITTED
    application.submission_date = datetime.utcnow()
    
    # Calculate estimated completion date
    estimated_days = application.product_type.estimated_days if application.product_type else 90
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
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"این صفحه فقط برای متقاضیان در دسترس است. نقش فعلی: {current_user.role}"
        )
    
    print(f"✅ User role check passed - proceeding to get applications")
    
    applications = db.query(Application).filter(
        Application.applicant_id == current_user.id
    ).order_by(Application.created_at.desc()).all()
    
    print(f"📊 Found {len(applications)} applications for user ID {current_user.id}")
    
    # Convert to summary format with proper field mapping
    summaries = []
    for app in applications:
        print(f"🔍 Processing application: {app.id}, product: {app.product_name}, status: {app.status}")
        
        # Safe product type name extraction
        product_type_name = "نامشخص"
        if app.product_type:
            product_type_name = app.product_type.name_fa
        elif app.product_type_id:
            product_type = db.query(ProductType).filter(ProductType.id == app.product_type_id).first()
            if product_type:
                product_type_name = product_type.name_fa
        
        # Safe applicant name for all users (show company name)
        applicant_name = app.company_name or (app.applicant.company if app.applicant else "نامشخص")
        
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
        ).order_by(Application.created_at.desc()).all()
        print(f"📋 Applicant dashboard: Found {len(applications)} applications")
        
    elif current_user.role == UserRole.EVALUATOR:
        # Evaluators see submitted applications available for evaluation
        applications = db.query(Application).filter(
            Application.status.in_([ApplicationStatus.SUBMITTED, ApplicationStatus.IN_EVALUATION])
        ).order_by(Application.submission_date.desc()).all()
        print(f"📋 Evaluator dashboard: Found {len(applications)} applications")
        
    elif current_user.role in [UserRole.GOVERNANCE, UserRole.ADMIN]:
        # Governance and Admin see all applications
        applications = db.query(Application).order_by(Application.created_at.desc()).all()
        print(f"📋 Admin/Governance dashboard: Found {len(applications)} applications")
    
    # Convert to summary format with proper field mapping
    summaries = []
    for app in applications:
        print(f"🔍 Processing application: {app.id}, status: {app.status}, company: {app.company_name}")
        
        # Safe product type name extraction
        product_type_name = "نامشخص"
        if app.product_type:
            product_type_name = app.product_type.name_fa
        elif app.product_type_id:
            product_type = db.query(ProductType).filter(ProductType.id == app.product_type_id).first()
            if product_type:
                product_type_name = product_type.name_fa
        
        # Safe applicant name for all users (show company name)
        applicant_name = app.company_name or (app.applicant.company if app.applicant else "نامشخص")
        
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
    ).order_by(Application.submission_date.desc()).all()
    
    print(f"📊 Found {len(applications)} available applications")
    
    # Convert to summary format with proper field mapping
    summaries = []
    for app in applications:
        print(f"🔍 Processing application: {app.id}, product: {app.product_name}, company: {app.company_name}")
        
        # Safe product type name extraction
        product_type_name = "نامشخص"
        if app.product_type:
            product_type_name = app.product_type.name_fa
        elif app.product_type_id:
            product_type = db.query(ProductType).filter(ProductType.id == app.product_type_id).first()
            if product_type:
                product_type_name = product_type.name_fa

        # Add applicant name for evaluators
        applicant_name = app.company_name or (app.applicant.company if app.applicant else "نامشخص")
        
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