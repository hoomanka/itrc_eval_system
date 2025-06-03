from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime

from ..database import get_db
from ..models import (
    SecurityTarget, STClassSelection, ProductClass, ProductSubclass, 
    EvaluationHelp, Application, User, UserRole, ProductType, ApplicationStatus
)
from ..schemas import (
    SecurityTargetCreate, SecurityTargetUpdate, SecurityTarget as SecurityTargetSchema,
    ProductClassSchema, STClassSelectionCreate, EvaluationHelpSchema
)
from ..core.auth import get_current_active_user

router = APIRouter()

@router.get("/product-types/{product_type_id}/classes", response_model=List[ProductClassSchema])
async def get_product_classes(
    product_type_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all classes for a specific product type."""
    classes = db.query(ProductClass).filter(
        ProductClass.product_type_id == product_type_id,
        ProductClass.is_active == True
    ).order_by(ProductClass.order).all()
    
    return classes

@router.get("/applications/{application_id}/security-target")
async def get_security_target(
    application_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get security target for an application."""
    # Check application access
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    # Check permissions
    if current_user.role == UserRole.APPLICANT and application.applicant_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Get or create security target
    security_target = db.query(SecurityTarget).filter(
        SecurityTarget.application_id == application_id
    ).first()
    
    if not security_target:
        security_target = SecurityTarget(
            application_id=application_id,
            status="draft"
        )
        db.add(security_target)
        db.commit()
        db.refresh(security_target)
    
    # Load class selections with related data
    class_selections = db.query(STClassSelection).options(
        joinedload(STClassSelection.product_class),
        joinedload(STClassSelection.product_subclass)
    ).filter(
        STClassSelection.security_target_id == security_target.id
    ).all()
    
    security_target.class_selections = class_selections
    
    return security_target

@router.post("/applications/{application_id}/security-target/classes")
async def add_class_selection(
    application_id: int,
    selection: STClassSelectionCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Add or update a class selection in the security target."""
    # Check application access
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    # Only applicants can add selections to their own applications
    if current_user.role != UserRole.APPLICANT or application.applicant_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only applicants can modify their security targets"
        )
    
    # Get security target
    security_target = db.query(SecurityTarget).filter(
        SecurityTarget.application_id == application_id
    ).first()
    
    if not security_target:
        security_target = SecurityTarget(
            application_id=application_id,
            status="draft"
        )
        db.add(security_target)
        db.commit()
        db.refresh(security_target)
    
    # Check if selection already exists
    existing = db.query(STClassSelection).filter(
        STClassSelection.security_target_id == security_target.id,
        STClassSelection.product_class_id == selection.product_class_id,
        STClassSelection.product_subclass_id == selection.product_subclass_id
    ).first()
    
    if existing:
        # Update existing
        existing.description = selection.description
        existing.justification = selection.justification
        existing.test_approach = selection.test_approach
        existing.updated_at = datetime.utcnow()
    else:
        # Create new
        new_selection = STClassSelection(
            security_target_id=security_target.id,
            product_class_id=selection.product_class_id,
            product_subclass_id=selection.product_subclass_id,
            description=selection.description,
            justification=selection.justification,
            test_approach=selection.test_approach
        )
        db.add(new_selection)
    
    db.commit()
    
    return {"message": "Class selection saved successfully"}

@router.delete("/applications/{application_id}/security-target/classes/{selection_id}")
async def remove_class_selection(
    application_id: int,
    selection_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Remove a class selection from the security target."""
    # Check application access
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    # Only applicants can remove selections from their own applications
    if current_user.role != UserRole.APPLICANT or application.applicant_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only applicants can modify their security targets"
        )
    
    selection = db.query(STClassSelection).filter(
        STClassSelection.id == selection_id
    ).first()
    
    if not selection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Selection not found"
        )
    
    db.delete(selection)
    db.commit()
    
    return {"message": "Class selection removed successfully"}

@router.get("/evaluation-help/{class_id}", response_model=EvaluationHelpSchema)
async def get_evaluation_help(
    class_id: int,
    subclass_id: Optional[int] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get evaluation help for a specific class or subclass."""
    query = db.query(EvaluationHelp).filter(
        EvaluationHelp.product_class_id == class_id
    )
    
    if subclass_id:
        query = query.filter(EvaluationHelp.product_subclass_id == subclass_id)
    else:
        query = query.filter(EvaluationHelp.product_subclass_id == None)
    
    help_text = query.first()
    
    if not help_text:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evaluation help not found"
        )
    
    return help_text

@router.post("/applications/{application_id}/security-target/submit")
async def submit_security_target(
    application_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Submit security target for evaluation."""
    # Check application access
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    # Only applicants can submit their own security targets
    if current_user.role != UserRole.APPLICANT or application.applicant_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only applicants can submit their security targets"
        )
    
    security_target = db.query(SecurityTarget).filter(
        SecurityTarget.application_id == application_id
    ).first()
    
    if not security_target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Security target not found"
        )
    
    # Check if at least one class is selected
    selections = db.query(STClassSelection).filter(
        STClassSelection.security_target_id == security_target.id
    ).count()
    
    if selections == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one class must be selected"
        )
    
    # Update security target status
    security_target.status = "submitted"
    security_target.submitted_at = datetime.utcnow()
    
    # Update application status
    application.status = ApplicationStatus.SUBMITTED
    application.submission_date = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Security target submitted successfully"}

@router.post("/class-selections/{selection_id}/evaluate")
async def evaluate_class_selection(
    selection_id: int,
    evaluation_data: dict,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Evaluate a class selection (Evaluators only)."""
    # Check if user is an evaluator
    if current_user.role != UserRole.EVALUATOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only evaluators can perform evaluations"
        )
    
    # Get the class selection
    selection = db.query(STClassSelection).filter(
        STClassSelection.id == selection_id
    ).first()
    
    if not selection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class selection not found"
        )
    
    # Update evaluation data
    selection.evaluation_status = evaluation_data.get("evaluation_status", "pending")
    selection.evaluation_score = evaluation_data.get("evaluation_score")
    selection.evaluator_notes = evaluation_data.get("evaluator_notes")
    selection.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(selection)
    
    return selection 