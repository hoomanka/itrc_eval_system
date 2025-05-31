from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import User, UserRole, ProductType
from ..schemas import (
    User as UserSchema, UserCreate, UserUpdate,
    ProductType as ProductTypeSchema, ProductTypeCreate,
    MessageResponse
)
from ..core.auth import get_current_active_user, require_role, get_password_hash

router = APIRouter()

@router.get("/users", response_model=List[UserSchema])
async def get_all_users(
    current_user: User = Depends(require_role([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """Get all users (Admin only)."""
    users = db.query(User).all()
    return users

@router.post("/users", response_model=UserSchema)
async def create_user(
    user_data: UserCreate,
    current_user: User = Depends(require_role([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """Create new user (Admin only)."""
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="کاربری با این ایمیل قبلاً وجود دارد"
        )
    
    # Create user
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
        role=user_data.role,
        company=user_data.company,
        phone=user_data.phone
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user

@router.put("/users/{user_id}", response_model=UserSchema)
async def update_user(
    user_id: int,
    user_update: UserUpdate,
    current_user: User = Depends(require_role([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """Update user (Admin only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="کاربر مورد نظر یافت نشد"
        )
    
    # Update fields
    update_data = user_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    
    from datetime import datetime
    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    
    return user

@router.delete("/users/{user_id}", response_model=MessageResponse)
async def delete_user(
    user_id: int,
    current_user: User = Depends(require_role([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """Delete user (Admin only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="کاربر مورد نظر یافت نشد"
        )
    
    # Can't delete self
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="امکان حذف خود وجود ندارد"
        )
    
    # Deactivate instead of delete to maintain referential integrity
    user.is_active = False
    db.commit()
    
    return MessageResponse(message="کاربر غیرفعال شد")

@router.get("/product-types", response_model=List[ProductTypeSchema])
async def get_all_product_types(
    current_user: User = Depends(require_role([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """Get all product types (Admin only)."""
    product_types = db.query(ProductType).all()
    return product_types

@router.post("/product-types", response_model=ProductTypeSchema)
async def create_product_type(
    product_type_data: ProductTypeCreate,
    current_user: User = Depends(require_role([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """Create new product type (Admin only)."""
    db_product_type = ProductType(**product_type_data.dict())
    db.add(db_product_type)
    db.commit()
    db.refresh(db_product_type)
    
    return db_product_type 