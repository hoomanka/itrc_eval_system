#!/usr/bin/env python3
"""
Database initialization script for ITRC Common Criteria Evaluation Platform
"""

import asyncio
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.auth import get_password_hash
from app.database import Base
from app.models import User, ProductType, ProductClass, ProductSubclass, EvaluationHelp

def create_tables():
    """Create all database tables."""
    engine = create_engine(settings.DATABASE_URL)
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully")
    return engine

def create_sample_data(engine):
    """Create sample users and product types."""
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Check if data already exists
        if not db.query(User).first():
            # Create sample users only if they don't exist
            users = [
                {
                    "email": "admin@itrc.ac.ir",
                    "hashed_password": get_password_hash("admin123"),
                    "full_name": "مدیر سیستم",
                    "role": "admin",
                    "company": "مرکز تحقیقات فناوری اطلاعات",
                    "phone": "021-12345678",
                    "is_active": True
                },
                {
                    "email": "governance@itrc.ac.ir", 
                    "hashed_password": get_password_hash("gov123"),
                    "full_name": "کارشناس حاکمیت",
                    "role": "governance",
                    "company": "مرکز تحقیقات فناوری اطلاعات",
                    "phone": "021-12345679",
                    "is_active": True
                },
                {
                    "email": "evaluator@itrc.ac.ir",
                    "hashed_password": get_password_hash("eval123"),
                    "full_name": "ارزیاب فنی",
                    "role": "evaluator",
                    "company": "مرکز تحقیقات فناوری اطلاعات",
                    "phone": "021-12345680",
                    "is_active": True
                },
                {
                    "email": "applicant@company.com",
                    "hashed_password": get_password_hash("app123"),
                    "full_name": "متقاضی آزمون",
                    "role": "applicant",
                    "company": "شرکت فناوری پارس",
                    "phone": "021-87654321",
                    "is_active": True
                }
            ]
            
            for user_data in users:
                user = User(**user_data)
                db.add(user)
            
            # Create sample product types
            product_types = [
                {
                    "name_en": "Operating System",
                    "name_fa": "سیستم عامل",
                    "protection_profile": "PP_OS_v2.1",
                    "description_en": "Operating systems and computing platforms",
                    "description_fa": "سیستم‌های عامل و پلتفرم‌های محاسباتی",
                    "estimated_days": 120,
                    "estimated_cost": 75000000.0,
                    "required_documents": ["security_target", "assurance_life_cycle", "administrative_guidance", "development", "tests", "vulnerability_assessment"]
                },
                {
                    "name_en": "Network Firewall",
                    "name_fa": "فایروال شبکه",
                    "protection_profile": "PP_FW_v2.1",
                    "description_en": "Network protection equipment and software",
                    "description_fa": "تجهیزات و نرم‌افزارهای حفاظت شبکه",
                    "estimated_days": 90,
                    "estimated_cost": 50000000.0,
                    "required_documents": ["security_target", "assurance_life_cycle", "administrative_guidance", "development", "tests", "vulnerability_assessment"]
                },
                {
                    "name_en": "Database Management System",
                    "name_fa": "سیستم مدیریت پایگاه داده",
                    "protection_profile": "PP_DB_v1.5",
                    "description_en": "Database management and storage systems",
                    "description_fa": "سیستم‌های مدیریت و ذخیره‌سازی داده",
                    "estimated_days": 100,
                    "estimated_cost": 60000000.0,
                    "required_documents": ["security_target", "assurance_life_cycle", "administrative_guidance", "development", "tests", "vulnerability_assessment"]
                },
                {
                    "name_en": "Cryptographic Software",
                    "name_fa": "نرم‌افزار رمزنگاری",
                    "protection_profile": "PP_CR_v3.0",
                    "description_en": "Cryptographic tools and libraries",
                    "description_fa": "ابزارها و کتابخانه‌های رمزنگاری",
                    "estimated_days": 80,
                    "estimated_cost": 45000000.0,
                    "required_documents": ["security_target", "assurance_life_cycle", "administrative_guidance", "development", "tests", "vulnerability_assessment"]
                },
                {
                    "name_en": "Authentication System",
                    "name_fa": "سیستم احراز هویت",
                    "protection_profile": "PP_AUTH_v2.0",
                    "description_en": "User identification and authentication systems",
                    "description_fa": "سیستم‌های شناسایی و احراز هویت کاربران",
                    "estimated_days": 70,
                    "estimated_cost": 40000000.0,
                    "required_documents": ["security_target", "assurance_life_cycle", "administrative_guidance", "development", "tests"]
                }
            ]
            
            for pt_data in product_types:
                product_type = ProductType(**pt_data)
                db.add(product_type)
            
            db.commit()
            print("✅ Sample data created successfully")
        else:
            print("⚠️  Users already exist, skipping user creation...")
        
        # Always try to create anti-virus product type and classes
        antivirus_type = db.query(ProductType).filter(ProductType.name_en == "Antivirus Software").first()
        if not antivirus_type:
            antivirus_type = ProductType(
                name_en="Antivirus Software", 
                name_fa="نرم‌افزار آنتی‌ویروس",
                protection_profile="PP_AV_v2.0",
                description_en="Anti-malware and antivirus software products",
                description_fa="محصولات نرم‌افزاری آنتی‌ویروس و ضد بدافزار",
                estimated_days=60,
                estimated_cost=35000000.0,
                required_documents=["security_target", "assurance_life_cycle", "administrative_guidance", "tests"]
            )
            db.add(antivirus_type)
            db.commit()
            db.refresh(antivirus_type)
            print(f"✅ Created Antivirus Software product type with ID: {antivirus_type.id}")
        else:
            print(f"ℹ️  Antivirus Software product type already exists with ID: {antivirus_type.id}")
        
        # Check if classes already exist for this product type
        existing_classes = db.query(ProductClass).filter(ProductClass.product_type_id == antivirus_type.id).count()
        if existing_classes == 0:
            # Create product classes for antivirus
            classes_data = [
                {
                    "name_en": "Anti-Malware Class",
                    "name_fa": "کلاس ضد بدافزار",
                    "code": "FAM_MAL",
                    "description_en": "Requirements for malware detection and prevention",
                    "description_fa": "الزامات برای تشخیص و جلوگیری از بدافزار",
                    "order": 1,
                    "subclasses": [
                        {
                            "name_en": "Malware Action",
                            "name_fa": "عملیات بدافزار",
                            "code": "FAM_MAL.1",
                            "description_en": "Actions taken when malware is detected",
                            "description_fa": "اقدامات انجام شده هنگام تشخیص بدافزار"
                        },
                        {
                            "name_en": "Malware Alert",
                            "name_fa": "هشدار بدافزار",
                            "code": "FAM_MAL.2",
                            "description_en": "Alert mechanisms for malware detection",
                            "description_fa": "مکانیزم‌های هشدار برای تشخیص بدافزار"
                        },
                        {
                            "name_en": "Malware Scan",
                            "name_fa": "اسکن بدافزار",
                            "code": "FAM_MAL.3",
                            "description_en": "Scanning capabilities and methods",
                            "description_fa": "قابلیت‌ها و روش‌های اسکن"
                        }
                    ]
                },
                {
                    "name_en": "Cryptographic Class",
                    "name_fa": "کلاس رمزنگاری",
                    "code": "FAM_CRY",
                    "description_en": "Cryptographic operations and key management",
                    "description_fa": "عملیات رمزنگاری و مدیریت کلید",
                    "order": 2,
                    "subclasses": [
                        {
                            "name_en": "Cryptographic Operations",
                            "name_fa": "عملیات رمزنگاری",
                            "code": "FAM_CRY.1",
                            "description_en": "Basic cryptographic operations",
                            "description_fa": "عملیات پایه رمزنگاری"
                        },
                        {
                            "name_en": "Key Management",
                            "name_fa": "مدیریت کلید",
                            "code": "FAM_CRY.2",
                            "description_en": "Key generation and management",
                            "description_fa": "تولید و مدیریت کلید"
                        }
                    ]
                }
            ]
            
            for class_data in classes_data:
                subclasses = class_data.pop("subclasses", [])
                product_class = ProductClass(**class_data, product_type_id=antivirus_type.id)
                db.add(product_class)
                db.flush()  # Get the ID of the new class
                
                for subclass_data in subclasses:
                    subclass = ProductSubclass(**subclass_data, product_class_id=product_class.id)
                    db.add(subclass)
            
            db.commit()
            print("✅ Created product classes and subclasses for Antivirus Software")
        else:
            print("ℹ️  Product classes already exist for Antivirus Software")
            
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating sample data: {str(e)}")
        raise
    finally:
        db.close()

def main():
    """Main function to initialize the database."""
    try:
        engine = create_tables()
        create_sample_data(engine)
        print("✅ Database initialization completed successfully")
    except Exception as e:
        print(f"❌ Database initialization failed: {str(e)}")
        raise

if __name__ == "__main__":
    main() 