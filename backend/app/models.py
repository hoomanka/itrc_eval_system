from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey, Enum, Float, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import enum

from .database import Base

class UserRole(str, enum.Enum):
    APPLICANT = "applicant"
    EVALUATOR = "evaluator"
    GOVERNANCE = "governance"
    ADMIN = "admin"

class ApplicationStatus(str, enum.Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    IN_REVIEW = "in_review"
    IN_EVALUATION = "in_evaluation"
    COMPLETED = "completed"
    REJECTED = "rejected"

class DocumentType(str, enum.Enum):
    ST = "security_target"  # Security Target
    ALC = "assurance_life_cycle"  # Assurance Life Cycle
    AGD = "administrative_guidance"  # Administrative Guidance
    ASE = "security_target_evaluation"  # Security Target Evaluation
    ADV = "development"  # Development
    ATE = "tests"  # Tests
    AVA = "vulnerability_assessment"  # Vulnerability Assessment
    ACO = "composition"  # Composition
    AMA = "maintenance_of_assurance"  # Maintenance of Assurance
    APE = "protection_profile_evaluation"  # Protection Profile Evaluation
    OTHER = "other"

class ReportType(str, enum.Enum):
    ETR = "evaluation_technical_report"  # Evaluation Technical Report
    TRP = "test_report"  # Test Report
    VTR = "validation_test_report"  # Validation Test Report

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    company = Column(String, nullable=True)  # For applicants
    phone = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    applications = relationship("Application", back_populates="applicant")
    evaluations = relationship("Evaluation", back_populates="evaluator")

class ProductType(Base):
    __tablename__ = "product_types"
    
    id = Column(Integer, primary_key=True, index=True)
    name_en = Column(String, nullable=False)
    name_fa = Column(String, nullable=False)  # Persian name
    protection_profile = Column(String, nullable=False)
    description_en = Column(Text)
    description_fa = Column(Text)  # Persian description
    estimated_days = Column(Integer, default=90)  # Estimated evaluation days
    estimated_cost = Column(Float, default=0.0)  # Estimated cost in Iranian Rial
    required_documents = Column(JSON)  # List of required document types
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    applications = relationship("Application", back_populates="product_type")

class Application(Base):
    __tablename__ = "applications"
    
    id = Column(Integer, primary_key=True, index=True)
    application_number = Column(String, unique=True, index=True)  # Auto-generated
    product_name = Column(String, nullable=False)
    product_version = Column(String, nullable=True)
    product_type_id = Column(Integer, ForeignKey("product_types.id"))
    applicant_id = Column(Integer, ForeignKey("users.id"))
    
    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.DRAFT)
    submission_date = Column(DateTime, nullable=True)
    estimated_completion_date = Column(DateTime, nullable=True)
    actual_completion_date = Column(DateTime, nullable=True)
    
    # Additional info
    description = Column(Text)
    evaluation_level = Column(String, default="EAL1")
    company_name = Column(String, nullable=True)
    contact_person = Column(String, nullable=True)
    contact_email = Column(String, nullable=True)
    contact_phone = Column(String, nullable=True)
    
    # Legacy fields (keeping for compatibility)
    product_description = Column(Text)
    technical_contact = Column(String)
    business_contact = Column(String)
    notes = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    applicant = relationship("User", back_populates="applications")
    product_type = relationship("ProductType", back_populates="applications")
    documents = relationship("Document", back_populates="application")
    evaluation = relationship("Evaluation", back_populates="application", uselist=False)

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"))
    document_type = Column(Enum(DocumentType), nullable=False)
    filename = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer)  # in bytes
    mime_type = Column(String)
    version = Column(Integer, default=1)
    is_approved = Column(Boolean, default=False)
    approval_notes = Column(Text)
    
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    
    # Relationships
    application = relationship("Application", back_populates="documents")
    uploader = relationship("User")

class Evaluation(Base):
    __tablename__ = "evaluations"
    
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"))
    evaluator_id = Column(Integer, ForeignKey("users.id"))
    
    start_date = Column(DateTime, default=datetime.utcnow)
    end_date = Column(DateTime, nullable=True)
    status = Column(String, default="in_progress")  # in_progress, completed, on_hold
    
    # Evaluation progress
    document_review_completed = Column(Boolean, default=False)
    security_testing_completed = Column(Boolean, default=False)
    vulnerability_assessment_completed = Column(Boolean, default=False)
    
    # Overall scores and findings
    overall_score = Column(Float, nullable=True)
    findings = Column(Text)
    recommendations = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    application = relationship("Application", back_populates="evaluation")
    evaluator = relationship("User", back_populates="evaluations")
    reports = relationship("Report", back_populates="evaluation")

class Report(Base):
    __tablename__ = "reports"
    
    id = Column(Integer, primary_key=True, index=True)
    evaluation_id = Column(Integer, ForeignKey("evaluations.id"))
    report_type = Column(Enum(ReportType), nullable=False)
    
    title = Column(String, nullable=False)
    content = Column(Text)  # Can store HTML or markdown
    template_version = Column(String, default="1.0")
    
    is_draft = Column(Boolean, default=True)
    is_approved = Column(Boolean, default=False)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    approval_date = Column(DateTime, nullable=True)
    
    file_path = Column(String, nullable=True)  # PDF export path
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    evaluation = relationship("Evaluation", back_populates="reports")
    approver = relationship("User", foreign_keys=[approved_by])

class ProtectionProfile(Base):
    __tablename__ = "protection_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    version = Column(String, nullable=False)
    description = Column(Text)
    file_path = Column(String)  # Path to PP document
    requirements = Column(JSON)  # Structured requirements data
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class EvaluationGuideline(Base):
    __tablename__ = "evaluation_guidelines"
    
    id = Column(Integer, primary_key=True, index=True)
    title_en = Column(String, nullable=False)
    title_fa = Column(String, nullable=False)
    content_en = Column(Text)
    content_fa = Column(Text)
    document_mapping = Column(JSON)  # Maps to required documents
    category = Column(String)  # test_guidelines, cc_standards, etc.
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow) 