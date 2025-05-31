from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from .models import UserRole, ApplicationStatus, DocumentType, ReportType

# Base schemas
class BaseSchema(BaseModel):
    class Config:
        from_attributes = True

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole
    company: Optional[str] = None
    phone: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    company: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None

class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Authentication schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class TokenData(BaseModel):
    email: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

# Product Type schemas
class ProductTypeBase(BaseModel):
    name_en: str
    name_fa: str
    protection_profile: str
    description_en: Optional[str] = None
    description_fa: Optional[str] = None
    estimated_days: int = 90
    estimated_cost: float = 0.0
    required_documents: List[str] = []

class ProductTypeCreate(ProductTypeBase):
    pass

class ProductType(ProductTypeBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Application schemas
class ApplicationBase(BaseModel):
    product_name: str
    product_version: Optional[str] = None
    product_type_id: int
    product_description: Optional[str] = None
    technical_contact: Optional[str] = None
    business_contact: Optional[str] = None
    notes: Optional[str] = None

class ApplicationCreate(ApplicationBase):
    pass

class ApplicationUpdate(BaseModel):
    product_name: Optional[str] = None
    product_version: Optional[str] = None
    product_description: Optional[str] = None
    technical_contact: Optional[str] = None
    business_contact: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[ApplicationStatus] = None

class Application(ApplicationBase):
    id: int
    application_number: str
    applicant_id: int
    status: ApplicationStatus
    submission_date: Optional[datetime] = None
    estimated_completion_date: Optional[datetime] = None
    actual_completion_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    # Related objects
    applicant: User
    product_type: ProductType

    class Config:
        from_attributes = True

class ApplicationSummary(BaseModel):
    id: int
    application_number: str
    product_name: str
    status: ApplicationStatus
    submission_date: Optional[datetime] = None
    product_type_name: str
    applicant_name: Optional[str] = None
    evaluation_level: Optional[str] = None

    class Config:
        from_attributes = True

# Document schemas
class DocumentBase(BaseModel):
    document_type: DocumentType
    version: int = 1

class DocumentUpload(DocumentBase):
    pass

class Document(DocumentBase):
    id: int
    application_id: int
    filename: str
    original_filename: str
    file_size: int
    mime_type: str
    is_approved: bool
    approval_notes: Optional[str] = None
    uploaded_at: datetime

    class Config:
        from_attributes = True

# Evaluation schemas
class EvaluationBase(BaseModel):
    findings: Optional[str] = None
    recommendations: Optional[str] = None

class EvaluationCreate(EvaluationBase):
    application_id: int

class EvaluationUpdate(BaseModel):
    status: Optional[str] = None
    document_review_completed: Optional[bool] = None
    security_testing_completed: Optional[bool] = None
    vulnerability_assessment_completed: Optional[bool] = None
    overall_score: Optional[float] = None
    findings: Optional[str] = None
    recommendations: Optional[str] = None
    end_date: Optional[datetime] = None

class Evaluation(EvaluationBase):
    id: int
    application_id: int
    evaluator_id: int
    start_date: datetime
    end_date: Optional[datetime] = None
    status: str
    document_review_completed: bool
    security_testing_completed: bool
    vulnerability_assessment_completed: bool
    overall_score: Optional[float] = None
    created_at: datetime
    updated_at: datetime

    # Related objects
    evaluator: User
    application: Application

    class Config:
        from_attributes = True

# Report schemas
class ReportBase(BaseModel):
    report_type: ReportType
    title: str
    content: Optional[str] = None

class ReportCreate(ReportBase):
    evaluation_id: int

class ReportUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    is_draft: Optional[bool] = None

class Report(ReportBase):
    id: int
    evaluation_id: int
    template_version: str
    is_draft: bool
    is_approved: bool
    approved_by: Optional[int] = None
    approval_date: Optional[datetime] = None
    file_path: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Dashboard schemas
class DashboardStats(BaseModel):
    total_applications: int
    pending_applications: int
    in_evaluation: int
    completed_applications: int
    my_applications: Optional[int] = None
    my_evaluations: Optional[int] = None

class ApplicationStatusCount(BaseModel):
    status: ApplicationStatus
    count: int

# Protection Profile schemas
class ProtectionProfileBase(BaseModel):
    name: str
    version: str
    description: Optional[str] = None
    requirements: Optional[Dict[str, Any]] = None

class ProtectionProfileCreate(ProtectionProfileBase):
    pass

class ProtectionProfile(ProtectionProfileBase):
    id: int
    file_path: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Evaluation Guidelines schemas
class EvaluationGuidelineBase(BaseModel):
    title_en: str
    title_fa: str
    content_en: Optional[str] = None
    content_fa: Optional[str] = None
    document_mapping: Optional[Dict[str, Any]] = None
    category: Optional[str] = None

class EvaluationGuidelineCreate(EvaluationGuidelineBase):
    pass

class EvaluationGuideline(EvaluationGuidelineBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Response schemas
class MessageResponse(BaseModel):
    message: str
    success: bool = True

class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
    success: bool = False 