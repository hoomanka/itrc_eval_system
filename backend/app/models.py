from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey, Enum, Float, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import enum

from .database import Base

class UserRole(str, enum.Enum):
    APPLICANT = "applicant"
    EVALUATOR = "evaluator"
    SUPERVISOR = "supervisor"  # Added supervisor role
    GOVERNANCE = "governance"
    ADMIN = "admin"

class ApplicationStatus(str, enum.Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    IN_REVIEW = "in_review"
    IN_EVALUATION = "in_evaluation"
    EVALUATION_COMPLETED = "evaluation_completed"  # New status for completed evaluation
    REPORT_GENERATED = "report_generated"  # New status for generated technical report
    SUPERVISOR_REVIEW = "supervisor_review"  # New status for supervisor review
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

class ReportStatus(str, enum.Enum):
    DRAFT = "draft"
    GENERATED = "generated"
    SUPERVISOR_REVIEW = "supervisor_review"
    APPROVED = "approved"
    NEEDS_REVISION = "needs_revision"
    REJECTED = "rejected"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    company = Column(String, nullable=True)  # For applicants
    phone = Column(String, nullable=True)
    supervisor_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # For evaluator-supervisor relationship
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    applications = relationship("Application", back_populates="applicant")
    evaluations = relationship("Evaluation", back_populates="evaluator")
    supervised_evaluators = relationship("User", remote_side=[id])  # Supervisor's evaluators
    supervisor = relationship("User", remote_side=[id])  # Evaluator's supervisor

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

class EvaluationStatus(str, enum.Enum):
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    ON_HOLD = "ON_HOLD"

class Evaluation(Base):
    __tablename__ = "evaluations"
    
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"))
    evaluator_id = Column(Integer, ForeignKey("users.id"))
    
    start_date = Column(DateTime, default=datetime.utcnow)
    end_date = Column(DateTime, nullable=True)
    status = Column(Enum(EvaluationStatus), default=EvaluationStatus.IN_PROGRESS)
    
    # Evaluation progress
    document_review_completed = Column(Boolean, default=False, nullable=False)
    security_testing_completed = Column(Boolean, default=False, nullable=False)
    vulnerability_assessment_completed = Column(Boolean, default=False, nullable=False)
    
    # Overall scores and findings
    overall_score = Column(Float, nullable=True)
    findings = Column(Text, nullable=True)
    recommendations = Column(Text, nullable=True)
    
    # Report generation tracking
    report_ready_for_generation = Column(Boolean, default=False, nullable=False)
    report_generated_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    application = relationship("Application", back_populates="evaluation")
    evaluator = relationship("User", back_populates="evaluations")
    reports = relationship("TechnicalReport", back_populates="evaluation")

class TechnicalReport(Base):
    __tablename__ = "technical_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    evaluation_id = Column(Integer, ForeignKey("evaluations.id"))
    report_number = Column(String, unique=True, nullable=False)  # Auto-generated unique number
    
    # Report metadata
    title = Column(String, nullable=False)
    report_type = Column(Enum(ReportType), default=ReportType.ETR)
    template_version = Column(String, default="1.0")
    
    # Report status and workflow
    status = Column(Enum(ReportStatus), default=ReportStatus.DRAFT)
    generated_by = Column(Integer, ForeignKey("users.id"))  # Evaluator who generated
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)  # Supervisor who reviewed
    
    # Dates
    generated_at = Column(DateTime, nullable=True)
    submitted_for_review_at = Column(DateTime, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    approved_at = Column(DateTime, nullable=True)
    
    # Report content and files
    executive_summary = Column(Text)
    evaluation_methodology = Column(Text)
    findings_summary = Column(Text)
    conclusions = Column(Text)
    supervisor_comments = Column(Text)
    
    # File storage
    word_file_path = Column(String, nullable=True)  # Generated Word document
    pdf_file_path = Column(String, nullable=True)   # Generated PDF
    file_size = Column(Integer, nullable=True)
    
    # Report data (JSON structure for dynamic content)
    report_data = Column(JSON)  # All evaluation data structured for report generation
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    evaluation = relationship("Evaluation", back_populates="reports")
    generator = relationship("User", foreign_keys=[generated_by])
    reviewer = relationship("User", foreign_keys=[reviewed_by])

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

class ProductClass(Base):
    __tablename__ = "product_classes"
    
    id = Column(Integer, primary_key=True, index=True)
    product_type_id = Column(Integer, ForeignKey("product_types.id"))
    name_en = Column(String, nullable=False)
    name_fa = Column(String, nullable=False)
    code = Column(String, unique=True, nullable=False)  # e.g., "FAM_CRY", "FAM_MAL"
    description_en = Column(Text)
    description_fa = Column(Text)
    weight = Column(Float, default=1.0)  # Weight for scoring calculations
    order = Column(Integer, default=0)  # Display order
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    product_type = relationship("ProductType")
    subclasses = relationship("ProductSubclass", back_populates="product_class")
    evaluation_helps = relationship("EvaluationHelp", back_populates="product_class")

class ProductSubclass(Base):
    __tablename__ = "product_subclasses"
    
    id = Column(Integer, primary_key=True, index=True)
    product_class_id = Column(Integer, ForeignKey("product_classes.id"))
    name_en = Column(String, nullable=False)
    name_fa = Column(String, nullable=False)
    code = Column(String, unique=True, nullable=False)  # e.g., "FAM_MAL.1", "FAM_MAL.2"
    description_en = Column(Text)
    description_fa = Column(Text)
    order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    product_class = relationship("ProductClass", back_populates="subclasses")

class EvaluationHelp(Base):
    __tablename__ = "evaluation_helps"
    
    id = Column(Integer, primary_key=True, index=True)
    product_class_id = Column(Integer, ForeignKey("product_classes.id"))
    product_subclass_id = Column(Integer, ForeignKey("product_subclasses.id"), nullable=True)
    help_text_en = Column(Text, nullable=False)
    help_text_fa = Column(Text, nullable=False)
    evaluation_criteria = Column(JSON)  # Structured evaluation criteria
    examples = Column(JSON)  # Example implementations
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    product_class = relationship("ProductClass", back_populates="evaluation_helps")
    product_subclass = relationship("ProductSubclass")

class SecurityTarget(Base):
    __tablename__ = "security_targets"
    
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), unique=True)
    version = Column(String, default="1.0")
    status = Column(String, default="draft")  # draft, submitted, approved
    
    # Product identification
    product_description = Column(Text)
    toe_description = Column(Text)  # Target of Evaluation description
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    submitted_at = Column(DateTime, nullable=True)
    
    # Relationships
    application = relationship("Application", backref="security_target")
    class_selections = relationship("STClassSelection", back_populates="security_target")

class STClassSelection(Base):
    __tablename__ = "st_class_selections"
    
    id = Column(Integer, primary_key=True, index=True)
    security_target_id = Column(Integer, ForeignKey("security_targets.id"))
    product_class_id = Column(Integer, ForeignKey("product_classes.id"))
    product_subclass_id = Column(Integer, ForeignKey("product_subclasses.id"), nullable=True)
    
    # User inputs
    description = Column(Text, nullable=False)  # How this class is implemented
    justification = Column(Text)  # Why this class is needed
    test_approach = Column(Text)  # How it should be tested
    
    # Evaluation fields
    evaluator_notes = Column(Text)
    evaluation_status = Column(String, default="pending")  # pending, pass, fail, needs_revision
    evaluation_score = Column(Float)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    security_target = relationship("SecurityTarget", back_populates="class_selections")
    product_class = relationship("ProductClass")
    product_subclass = relationship("ProductSubclass") 