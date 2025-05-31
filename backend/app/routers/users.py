from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from ..models import User, UserRole, ProductType
from ..schemas import User as UserSchema, UserUpdate, ProductType as ProductTypeSchema
from ..core.auth import get_current_active_user, require_role

router = APIRouter()

@router.get("/me", response_model=UserSchema)
async def get_current_user_profile(current_user: User = Depends(get_current_active_user)):
    """Get current user profile."""
    return current_user

@router.put("/me", response_model=UserSchema)
async def update_current_user_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update current user profile."""
    # Update fields
    update_data = user_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        if field != "is_active":  # Users can't change their own active status
            setattr(current_user, field, value)
    
    from datetime import datetime
    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)
    
    return current_user

@router.get("/evaluators", response_model=List[UserSchema])
async def get_evaluators(
    current_user: User = Depends(require_role([UserRole.GOVERNANCE, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """Get list of evaluators (Governance and Admin only)."""
    evaluators = db.query(User).filter(
        User.role == UserRole.EVALUATOR,
        User.is_active == True
    ).all()
    return evaluators

@router.get("/product-types", response_model=List[ProductTypeSchema])
async def get_product_types(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get list of available product types."""
    product_types = db.query(ProductType).filter(ProductType.is_active == True).all()
    return product_types 