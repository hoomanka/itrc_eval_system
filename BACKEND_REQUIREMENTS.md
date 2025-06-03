# Backend Requirements for ITRC Evaluation System

## Overview
This document outlines the backend changes required to support the ITRC Common Criteria evaluation system for antimalware products.

## Database Schema Updates

### 1. Clear Existing Data
```sql
-- Clear all existing test data
TRUNCATE TABLE applications CASCADE;
TRUNCATE TABLE security_targets CASCADE;
TRUNCATE TABLE evaluations CASCADE;
```

### 2. Product Classes and Subclasses for Antimalware
```sql
-- Insert Antimalware-specific classes
INSERT INTO product_classes (name_en, name_fa, code, description_en, description_fa, weight) VALUES
('Malware Detection', 'تشخیص بدافزار', 'MD', 'Detection capabilities for various malware types', 'قابلیت‌های تشخیص انواع بدافزار', 1.5),
('Real-time Protection', 'حفاظت بلادرنگ', 'RTP', 'Real-time scanning and protection', 'اسکن و حفاظت بلادرنگ', 2.0),
('Quarantine Management', 'مدیریت قرنطینه', 'QM', 'Isolation and management of threats', 'جداسازی و مدیریت تهدیدات', 1.0),
('Update Mechanism', 'مکانیزم بروزرسانی', 'UM', 'Signature and engine updates', 'بروزرسانی امضاها و موتور', 1.5),
('Scanning Engine', 'موتور اسکن', 'SE', 'Core scanning capabilities', 'قابلیت‌های اصلی اسکن', 2.0),
('Behavioral Analysis', 'تحلیل رفتاری', 'BA', 'Heuristic and behavioral detection', 'تشخیص اکتشافی و رفتاری', 1.5),
('Network Protection', 'حفاظت شبکه', 'NP', 'Network-based threat protection', 'حفاظت در برابر تهدیدات شبکه', 1.0);

-- Insert subclasses
INSERT INTO product_subclasses (product_class_id, name_en, name_fa, code, description_en, description_fa) VALUES
-- Malware Detection subclasses
(1, 'Virus Detection', 'تشخیص ویروس', 'MD.VD', 'Traditional virus detection', 'تشخیص ویروس‌های سنتی'),
(1, 'Trojan Detection', 'تشخیص تروجان', 'MD.TD', 'Trojan horse detection', 'تشخیص اسب‌های تروا'),
(1, 'Ransomware Detection', 'تشخیص باج‌افزار', 'MD.RD', 'Ransomware detection and prevention', 'تشخیص و جلوگیری از باج‌افزارها'),
(1, 'Spyware Detection', 'تشخیص جاسوس‌افزار', 'MD.SD', 'Spyware and adware detection', 'تشخیص جاسوس‌افزار و تبلیغ‌افزار'),

-- Real-time Protection subclasses
(2, 'File System Protection', 'حفاظت سیستم فایل', 'RTP.FSP', 'Real-time file system monitoring', 'نظارت بلادرنگ بر سیستم فایل'),
(2, 'Web Protection', 'حفاظت وب', 'RTP.WP', 'Web browsing protection', 'حفاظت هنگام مرور وب'),
(2, 'Email Protection', 'حفاظت ایمیل', 'RTP.EP', 'Email attachment scanning', 'اسکن پیوست‌های ایمیل'),

-- Scanning Engine subclasses
(5, 'On-demand Scan', 'اسکن دستی', 'SE.ODS', 'User-initiated scanning', 'اسکن با درخواست کاربر'),
(5, 'Scheduled Scan', 'اسکن زمان‌بندی شده', 'SE.SS', 'Automated scheduled scans', 'اسکن‌های خودکار زمان‌بندی شده'),
(5, 'Quick Scan', 'اسکن سریع', 'SE.QS', 'Fast scanning of critical areas', 'اسکن سریع نواحی حیاتی');
```

### 3. Evaluation Help and Guides
```sql
-- Create evaluation_help table
CREATE TABLE IF NOT EXISTS evaluation_help (
    id SERIAL PRIMARY KEY,
    product_class_id INTEGER REFERENCES product_classes(id),
    product_subclass_id INTEGER REFERENCES product_subclasses(id),
    help_text_fa TEXT NOT NULL,
    help_text_en TEXT NOT NULL,
    evaluation_criteria JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert evaluation help for each class/subclass
INSERT INTO evaluation_help (product_class_id, product_subclass_id, help_text_fa, help_text_en, evaluation_criteria) VALUES
-- Malware Detection help
(1, 1, 'برای ارزیابی تشخیص ویروس، باید قابلیت تشخیص انواع مختلف ویروس‌ها شامل ویروس‌های فایلی، بوت سکتور و ماکرو ویروس‌ها را بررسی کنید. از مجموعه تست EICAR و نمونه‌های استاندارد استفاده کنید.',
'For virus detection evaluation, check the ability to detect various virus types including file viruses, boot sector viruses, and macro viruses. Use EICAR test set and standard samples.',
'{
  "detection_rate": "نرخ تشخیص باید بالای 99% باشد",
  "false_positive": "نرخ مثبت کاذب باید زیر 0.1% باشد",
  "performance": "زمان اسکن باید متناسب با حجم فایل باشد"
}'),

(1, 3, 'ارزیابی تشخیص باج‌افزار باید شامل بررسی قابلیت تشخیص رفتارهای مشکوک مانند رمزگذاری انبوه فایل‌ها، تغییر پسوند فایل‌ها و ایجاد فایل‌های درخواست باج باشد.',
'Ransomware detection evaluation should include checking for suspicious behaviors like mass file encryption, file extension changes, and ransom note creation.',
'{
  "behavior_detection": "تشخیص رفتار رمزگذاری انبوه",
  "prevention": "قابلیت جلوگیری از رمزگذاری",
  "recovery": "امکان بازیابی فایل‌های آسیب دیده"
}'),

-- Real-time Protection help
(2, 5, 'برای ارزیابی حفاظت سیستم فایل، باید عملکرد نظارت بلادرنگ بر عملیات فایلی شامل ایجاد، اصلاح، اجرا و حذف فایل‌ها را بررسی کنید.',
'For file system protection evaluation, check real-time monitoring performance for file operations including creation, modification, execution, and deletion.',
'{
  "coverage": "پوشش تمام عملیات فایلی",
  "performance_impact": "تأثیر بر عملکرد سیستم زیر 5%",
  "response_time": "زمان پاسخ زیر 100ms"
}');
```

## API Endpoint Updates

### 1. Application Submission
```python
@router.post("/api/applications/")
async def create_application(
    product_name: str = Form(...),
    product_type: str = Form(...),
    description: str = Form(...),
    evaluation_level: str = Form(...),
    company_name: str = Form(...),
    contact_person: str = Form(...),
    contact_email: str = Form(...),
    contact_phone: str = Form(...),
    status: str = Form(default="submitted"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Generate application number
    application_number = f"APP-{datetime.now().year}-{str(db.query(Application).count() + 1).zfill(4)}"
    
    # Create application
    application = Application(
        application_number=application_number,
        product_name=product_name,
        product_type=product_type,
        description=description,
        evaluation_level=evaluation_level,
        company_name=company_name,
        contact_person=contact_person,
        contact_email=contact_email,
        contact_phone=contact_phone,
        status=status,
        user_id=current_user.id,
        submission_date=datetime.now() if status == "submitted" else None
    )
    
    db.add(application)
    db.commit()
    db.refresh(application)
    
    return application
```

### 2. Get Application Details
```python
@router.get("/api/applications/{application_id}")
async def get_application(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    application = db.query(Application).filter(Application.id == application_id).first()
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Check permissions
    if current_user.role == "applicant" and application.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return {
        "id": application.id,
        "application_number": application.application_number,
        "product_name": application.product_name,
        "product_type": application.product_type,
        "description": application.description,
        "evaluation_level": application.evaluation_level,
        "company_name": application.company_name,
        "contact_person": application.contact_person,
        "contact_email": application.contact_email,
        "contact_phone": application.contact_phone,
        "status": application.status,
        "submission_date": application.submission_date,
        "created_at": application.created_at,
        "updated_at": application.updated_at
    }
```

### 3. Evaluator Dashboard List
```python
@router.get("/api/applications/dashboard/list")
async def get_evaluator_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "evaluator":
        raise HTTPException(status_code=403, detail="Only evaluators can access this endpoint")
    
    # Get all submitted applications with security targets
    applications = db.query(Application).filter(
        Application.status.in_(["submitted", "in_evaluation"])
    ).all()
    
    result = []
    for app in applications:
        # Get user info
        user = db.query(User).filter(User.id == app.user_id).first()
        
        result.append({
            "id": app.id,
            "application_number": app.application_number,
            "product_name": app.product_name,
            "product_type": app.product_type,
            "status": app.status,
            "submission_date": app.submission_date,
            "evaluation_level": app.evaluation_level,
            "applicant_name": user.full_name if user else "Unknown",
            "company_name": app.company_name,
            "created_at": app.created_at,
            "updated_at": app.updated_at
        })
    
    return result
```

### 4. Update Application Model
```python
class Application(Base):
    __tablename__ = "applications"
    
    id = Column(Integer, primary_key=True, index=True)
    application_number = Column(String, unique=True, index=True)
    product_name = Column(String, nullable=False)
    product_type = Column(String, nullable=False)
    description = Column(Text)
    evaluation_level = Column(String, default="EAL1")
    company_name = Column(String, nullable=False)
    contact_person = Column(String, nullable=False)
    contact_email = Column(String, nullable=False)
    contact_phone = Column(String)
    status = Column(String, default="draft")
    submission_date = Column(DateTime, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="applications")
    security_target = relationship("SecurityTarget", back_populates="application", uselist=False)
    evaluations = relationship("Evaluation", back_populates="application")
```

## Required Alembic Migration
```python
"""Add application fields and evaluation help

Revision ID: xxx
Create Date: 2024-xx-xx
"""

def upgrade():
    # Add missing columns to applications table
    op.add_column('applications', sa.Column('application_number', sa.String(), nullable=True))
    op.add_column('applications', sa.Column('product_type', sa.String(), nullable=True))
    op.add_column('applications', sa.Column('description', sa.Text(), nullable=True))
    op.add_column('applications', sa.Column('evaluation_level', sa.String(), nullable=True))
    op.add_column('applications', sa.Column('company_name', sa.String(), nullable=True))
    op.add_column('applications', sa.Column('contact_person', sa.String(), nullable=True))
    op.add_column('applications', sa.Column('contact_email', sa.String(), nullable=True))
    op.add_column('applications', sa.Column('contact_phone', sa.String(), nullable=True))
    op.add_column('applications', sa.Column('submission_date', sa.DateTime(), nullable=True))
    
    # Create unique index
    op.create_unique_constraint('uq_application_number', 'applications', ['application_number'])
    
    # Create evaluation_help table
    op.create_table('evaluation_help',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('product_class_id', sa.Integer(), nullable=True),
        sa.Column('product_subclass_id', sa.Integer(), nullable=True),
        sa.Column('help_text_fa', sa.Text(), nullable=False),
        sa.Column('help_text_en', sa.Text(), nullable=False),
        sa.Column('evaluation_criteria', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['product_class_id'], ['product_classes.id'], ),
        sa.ForeignKeyConstraint(['product_subclass_id'], ['product_subclasses.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
```

## Testing Commands
```bash
# Clear and reset database
alembic downgrade base
alembic upgrade head

# Insert test data
python scripts/insert_antimalware_data.py

# Test API endpoints
curl -X POST http://localhost:8000/api/applications/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "product_name=Test Antivirus" \
  -F "product_type=Antivirus Software" \
  -F "description=Test antivirus product" \
  -F "evaluation_level=EAL2" \
  -F "company_name=Test Company" \
  -F "contact_person=John Doe" \
  -F "contact_email=john@test.com" \
  -F "contact_phone=1234567890" \
  -F "status=submitted" 