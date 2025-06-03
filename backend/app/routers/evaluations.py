from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime

from ..database import get_db
from ..models import Evaluation, Application, User, UserRole, ApplicationStatus, EvaluationStatus
from ..schemas import (
    EvaluationCreate, EvaluationUpdate, Evaluation as EvaluationSchema,
    EvaluationResponse, MessageResponse, ApplicationBasicInfo, EvaluatorInfo
)
from ..core.auth import get_current_active_user, require_role

router = APIRouter()

@router.post("/", response_model=EvaluationSchema)
async def create_evaluation(
    evaluation_data: EvaluationCreate,
    current_user: User = Depends(require_role([UserRole.EVALUATOR, UserRole.GOVERNANCE, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """Create new evaluation (Evaluators and above only)."""
    # Check if application exists
    application = db.query(Application).filter(Application.id == evaluation_data.application_id).first()
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="درخواست مورد نظر یافت نشد"
        )
    
    # Check if application is in correct status
    if application.status != ApplicationStatus.SUBMITTED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="امکان شروع ارزیابی برای این درخواست وجود ندارد"
        )
    
    # Check if evaluation already exists
    existing_evaluation = db.query(Evaluation).filter(
        Evaluation.application_id == evaluation_data.application_id
    ).first()
    if existing_evaluation:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ارزیابی برای این درخواست قبلاً شروع شده است"
        )
    
    # Create evaluation
    db_evaluation = Evaluation(
        application_id=evaluation_data.application_id,
        evaluator_id=current_user.id,
        findings=evaluation_data.findings,
        recommendations=evaluation_data.recommendations
    )
    
    # TEMP: Immediately mark evaluation as completed for testing
    db_evaluation.status = EvaluationStatus.COMPLETED
    db_evaluation.end_date = datetime.utcnow()
    db_evaluation.report_ready_for_generation = True
    application.status = ApplicationStatus.COMPLETED
    application.actual_completion_date = datetime.utcnow()
    
    db.add(db_evaluation)
    db.commit()
    db.refresh(db_evaluation)
    
    # Automatically generate a technical report for this evaluation
    from ..services.report_generator import TechnicalReportGenerator
    generator = TechnicalReportGenerator(db)
    try:
        generator.generate_technical_report(
            evaluation_id=db_evaluation.id,
            generated_by_id=current_user.id,
            title=f"Evaluation Technical Report for {application.product_name}"
        )
    except Exception as e:
        print(f"[ERROR] Failed to auto-generate report: {e}")
    
    return db_evaluation

@router.get("/", response_model=List[EvaluationSchema])
async def get_evaluations(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get evaluations list based on user role."""
    query = db.query(Evaluation)
    
    if current_user.role == UserRole.EVALUATOR:
        query = query.filter(Evaluation.evaluator_id == current_user.id)  # Include all, including completed
    elif current_user.role == UserRole.APPLICANT:
        query = query.join(Application).filter(Application.applicant_id == current_user.id)
    # Governance and Admin see all evaluations
    
    evaluations = query.offset(skip).limit(limit).all()
    return evaluations

@router.get("/my")
async def get_my_evaluations(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get current evaluator's evaluations (restoring DB query, simple response)."""
    print(f"DEBUG: Evaluations endpoint hit for user ID: {current_user.id} with role: {current_user.role}. Restoring DB query.")
    
    if not current_user or not current_user.is_active:
        print(f"DEBUG: User {current_user.id if current_user else 'Unknown'} not authenticated or inactive.")
        raise HTTPException(status_code=401, detail="User not authenticated or inactive")
    if current_user.role != UserRole.EVALUATOR:
        print(f"DEBUG: User {current_user.id} role {current_user.role} is not EVALUATOR.")
        raise HTTPException(status_code=403, detail="Access denied: Evaluator role required")

    try:
        evaluations = db.query(Evaluation).filter(
            Evaluation.evaluator_id == current_user.id
        ).all()
        print(f"DEBUG: Raw evaluations count from DB: {len(evaluations)}")
    except Exception as db_error:
        print(f"DEBUG: Database query error: {str(db_error)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(db_error)}")
    
    result = []
    for eval_item in evaluations:
        try:
            eval_dict = {
                "id": eval_item.id,
                "application_id": eval_item.application_id,
                "evaluator_id": eval_item.evaluator_id,
                "status": eval_item.status.value if eval_item.status else EvaluationStatus.IN_PROGRESS.value,
                # Add other essential fields the frontend might immediately need for display
                # For example, if the frontend shows application name or product name:
                # "application_name": eval_item.application.name if eval_item.application else "N/A",
                # "product_name": eval_item.application.product_name if eval_item.application else "N/A",
            }
            result.append(eval_dict)
        except Exception as proc_error:
            print(f"DEBUG: Error processing evaluation {eval_item.id}: {str(proc_error)}")
            # Optionally, append a placeholder or skip
            continue
            
    print(f"DEBUG: Processed evaluations for response: {len(result)} results")
    return result

@router.get("/{evaluation_id}", response_model=EvaluationSchema)
async def get_evaluation(
    evaluation_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get specific evaluation details."""
    evaluation = db.query(Evaluation).filter(Evaluation.id == evaluation_id).first()
    if not evaluation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ارزیابی مورد نظر یافت نشد"
        )
    
    # Check permissions
    can_view = False
    if current_user.role == UserRole.EVALUATOR and evaluation.evaluator_id == current_user.id:
        can_view = True
    elif current_user.role == UserRole.APPLICANT and evaluation.application.applicant_id == current_user.id:
        can_view = True
    elif current_user.role in [UserRole.GOVERNANCE, UserRole.ADMIN]:
        can_view = True
    
    if not can_view:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="دسترسی غیرمجاز"
        )
    
    return evaluation

@router.put("/{evaluation_id}", response_model=EvaluationSchema)
async def update_evaluation(
    evaluation_id: int,
    evaluation_update: EvaluationUpdate,
    current_user: User = Depends(require_role([UserRole.EVALUATOR, UserRole.GOVERNANCE, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """Update evaluation."""
    evaluation = db.query(Evaluation).filter(Evaluation.id == evaluation_id).first()
    if not evaluation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ارزیابی مورد نظر یافت نشد"
        )
    
    # Check permissions
    if current_user.role == UserRole.EVALUATOR and evaluation.evaluator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="دسترسی غیرمجاز"
        )
    
    # Update fields
    update_data = evaluation_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(evaluation, field, value)
    
    evaluation.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(evaluation)
    
    return evaluation

@router.post("/{evaluation_id}/complete", response_model=MessageResponse)
async def complete_evaluation(
    evaluation_id: int,
    current_user: User = Depends(require_role([UserRole.EVALUATOR, UserRole.GOVERNANCE, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """Complete evaluation."""
    evaluation = db.query(Evaluation).filter(Evaluation.id == evaluation_id).first()
    if not evaluation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ارزیابی مورد نظر یافت نشد"
        )
    
    if current_user.role == UserRole.EVALUATOR and evaluation.evaluator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="دسترسی غیرمجاز"
        )
    
    if not all([
        evaluation.document_review_completed,
        evaluation.security_testing_completed,
        evaluation.vulnerability_assessment_completed
    ]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="همه مراحل ارزیابی باید تکمیل شوند"
        )
    
    evaluation.status = "completed"
    evaluation.end_date = datetime.utcnow()
    evaluation.report_ready_for_generation = True  # Set flag for frontend to handle
    
    evaluation.application.status = ApplicationStatus.COMPLETED
    evaluation.application.actual_completion_date = datetime.utcnow()
    
    db.commit()
    
    return MessageResponse(message="ارزیابی با موفقیت تکمیل شد")

@router.get("/application/{application_id}", response_model=Optional[EvaluationSchema])
async def get_evaluation_by_application(
    application_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get evaluation for a specific application."""
    # Check if application exists
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="درخواست مورد نظر یافت نشد"
        )
    
    # Check permissions
    can_view = False
    if current_user.role == UserRole.APPLICANT and application.applicant_id == current_user.id:
        can_view = True
    elif current_user.role in [UserRole.EVALUATOR, UserRole.GOVERNANCE, UserRole.ADMIN]:
        can_view = True
    
    if not can_view:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="دسترسی غیرمجاز"
        )
    
    evaluation = db.query(Evaluation).filter(Evaluation.application_id == application_id).first()
    return evaluation

@router.post("/{evaluation_id}/assign", response_model=MessageResponse)
async def assign_evaluator(
    evaluation_id: int,
    evaluator_id: int,
    current_user: User = Depends(require_role([UserRole.GOVERNANCE, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """Assign evaluator to evaluation (Governance and Admin only)."""
    evaluation = db.query(Evaluation).filter(Evaluation.id == evaluation_id).first()
    if not evaluation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ارزیابی مورد نظر یافت نشد"
        )
    
    # Check if new evaluator exists and has correct role
    new_evaluator = db.query(User).filter(
        User.id == evaluator_id,
        User.role == UserRole.EVALUATOR,
        User.is_active == True
    ).first()
    
    if not new_evaluator:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ارزیاب مورد نظر یافت نشد"
        )
    
    evaluation.evaluator_id = evaluator_id
    db.commit()
    
    return MessageResponse(message=f"ارزیابی به {new_evaluator.full_name} واگذار شد") 