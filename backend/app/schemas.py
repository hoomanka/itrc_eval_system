from pydantic import BaseModel, EmailStr, validator, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
from .models import UserRole, ApplicationStatus, DocumentType, ReportType, ReportStatus

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

class ApplicationDetail(BaseModel):
    """Simplified application detail response for frontend"""
    id: int
    application_number: str
    product_name: str
    product_type: str  # Product type name as string
    description: Optional[str] = None
    evaluation_level: Optional[str] = "EAL1"
    company_name: Optional[str] = None
    contact_person: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    status: str
    submission_date: Optional[str] = None
    created_at: str
    updated_at: str

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
    total_applications: int = 0
    pending_applications: int = 0
    in_evaluation: int = 0
    completed_applications: int = 0
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

class ProductSubclassSchema(BaseModel):
    id: int
    name_en: str
    name_fa: str
    code: str
    description_en: Optional[str] = None
    description_fa: Optional[str] = None
    order: int = 0
    
    class Config:
        from_attributes = True

class ProductClassSchema(BaseModel):
    id: int
    product_type_id: int
    name_en: str
    name_fa: str
    code: str
    description_en: Optional[str] = None
    description_fa: Optional[str] = None
    order: int = 0
    subclasses: List[ProductSubclassSchema] = []
    
    class Config:
        from_attributes = True

class STClassSelectionCreate(BaseModel):
    product_class_id: int
    product_subclass_id: Optional[int] = None
    description: str
    justification: Optional[str] = None
    test_approach: Optional[str] = None

class STClassSelectionSchema(BaseModel):
    id: int
    security_target_id: int
    product_class_id: int
    product_subclass_id: Optional[int] = None
    description: str
    justification: Optional[str] = None
    test_approach: Optional[str] = None
    evaluator_notes: Optional[str] = None
    evaluation_status: str = "pending"
    evaluation_score: Optional[float] = None
    product_class: ProductClassSchema
    product_subclass: Optional[ProductSubclassSchema] = None
    
    class Config:
        from_attributes = True

class SecurityTargetCreate(BaseModel):
    product_description: Optional[str] = None
    toe_description: Optional[str] = None

class SecurityTargetUpdate(BaseModel):
    product_description: Optional[str] = None
    toe_description: Optional[str] = None
    status: Optional[str] = None

class SecurityTarget(BaseModel):
    id: int
    application_id: int
    version: str = "1.0"
    status: str = "draft"
    product_description: Optional[str] = None
    toe_description: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    submitted_at: Optional[datetime] = None
    class_selections: List[STClassSelectionSchema] = []
    
    class Config:
        from_attributes = True

class EvaluationHelpSchema(BaseModel):
    id: int
    product_class_id: int
    product_subclass_id: Optional[int] = None
    help_text_en: str
    help_text_fa: str
    evaluation_criteria: Optional[dict] = None
    examples: Optional[dict] = None
    
    class Config:
        from_attributes = True

# Technical Report Schemas
class TechnicalReportBase(BaseModel):
    title: str
    report_type: ReportType = ReportType.ETR
    executive_summary: Optional[str] = None
    evaluation_methodology: Optional[str] = None
    findings_summary: Optional[str] = None
    conclusions: Optional[str] = None

class TechnicalReportCreate(TechnicalReportBase):
    evaluation_id: int

class TechnicalReportUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[ReportStatus] = None
    executive_summary: Optional[str] = None
    evaluation_methodology: Optional[str] = None
    findings_summary: Optional[str] = None
    conclusions: Optional[str] = None
    supervisor_comments: Optional[str] = None

class EvaluatorInfo(BaseModel):
    id: int
    full_name: str
    email: str
    company: Optional[str] = None

    class Config:
        from_attributes = True

class SupervisorInfo(BaseModel):
    id: int
    full_name: str
    email: str
    company: Optional[str] = None

    class Config:
        from_attributes = True

class EvaluationBasicInfo(BaseModel):
    id: int
    start_date: datetime
    end_date: Optional[datetime] = None
    status: str
    overall_score: Optional[float] = None

    class Config:
        from_attributes = True

class ApplicationBasicInfo(BaseModel):
    id: int
    application_number: str
    product_name: str
    product_version: Optional[str] = None
    company_name: Optional[str] = None

    class Config:
        from_attributes = True

class TechnicalReportResponse(TechnicalReportBase):
    id: int
    report_number: str
    status: ReportStatus
    template_version: str
    
    # Relationships
    evaluation_id: int
    evaluation: Optional[EvaluationBasicInfo] = None
    
    # Workflow information
    generated_by: int
    generator: Optional[EvaluatorInfo] = None
    reviewed_by: Optional[int] = None
    reviewer: Optional[SupervisorInfo] = None
    
    # Dates
    generated_at: Optional[datetime] = None
    submitted_for_review_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
    approved_at: Optional[datetime] = None
    
    # Comments and feedback
    supervisor_comments: Optional[str] = None
    
    # File information
    word_file_path: Optional[str] = None
    pdf_file_path: Optional[str] = None
    file_size: Optional[int] = None
    
    # Report data (structured evaluation data)
    report_data: Optional[Dict[str, Any]] = None
    
    # Timestamps
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Enhanced User schemas for supervisor relationship
class UserBaseEnhanced(UserBase):
    supervisor_id: Optional[int] = None

class UserCreateEnhanced(UserBaseEnhanced):
    password: str

class UserUpdateEnhanced(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    company: Optional[str] = None
    phone: Optional[str] = None
    supervisor_id: Optional[int] = None
    is_active: Optional[bool] = None

class UserResponseEnhanced(User):
    supervisor_id: Optional[int] = None
    supervisor: Optional["User"] = None
    supervised_evaluators: Optional[List["User"]] = None

    class Config:
        from_attributes = True

# Enhanced Evaluation schemas with report generation tracking
class EvaluationCreate(BaseModel):
    application_id: int
    evaluator_id: int
    findings: Optional[str] = None
    recommendations: Optional[str] = None

class EvaluationResponse(BaseModel):
    id: int
    application_id: int
    evaluator_id: int
    start_date: datetime
    end_date: Optional[datetime] = None
    status: str = "in_progress"
    document_review_completed: bool = False
    security_testing_completed: bool = False
    vulnerability_assessment_completed: bool = False
    overall_score: Optional[float] = None
    findings: Optional[str] = ""
    recommendations: Optional[str] = ""
    report_ready_for_generation: bool = False
    report_generated_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    application: Optional[ApplicationBasicInfo] = None
    evaluator: Optional[EvaluatorInfo] = None
    reports: Optional[List[TechnicalReportResponse]] = []

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }

# Report generation request schema
class ReportGenerationRequest(BaseModel):
    title: Optional[str] = None
    notes: Optional[str] = None

# Report review request schema
class ReportReviewRequest(BaseModel):
    status: ReportStatus
    supervisor_comments: Optional[str] = None
    
    @validator('status')
    def validate_review_status(cls, v):
        from .models import ReportStatus
        valid_statuses = [ReportStatus.APPROVED, ReportStatus.NEEDS_REVISION, ReportStatus.REJECTED]
        if v not in valid_statuses:
            raise ValueError(f'Status must be one of: {[s.value for s in valid_statuses]}')
        return v

# Dashboard summary schemas
class EvaluatorDashboardSummary(BaseModel):
    total_evaluations: int
    active_evaluations: int
    completed_evaluations: int
    reports_generated: int
    reports_pending_review: int
    reports_approved: int

class SupervisorDashboardSummary(BaseModel):
    total_supervised_evaluators: int
    total_reports_to_review: int
    reports_pending_review: int
    reports_reviewed_today: int
    total_approved_reports: int

# Report statistics schema
class ReportStatistics(BaseModel):
    total_reports: int
    reports_by_status: Dict[str, int]
    reports_by_evaluator: Dict[str, int]
    average_generation_time_days: Optional[float] = None
    average_review_time_days: Optional[float] = None
    
    class Config:
        from_attributes = True 