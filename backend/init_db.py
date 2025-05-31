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
from app.models import User, ProductType

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
        if db.query(User).first():
            print("⚠️  Sample data already exists, skipping...")
            return
        
        # Create sample users
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
        print("\n📋 Test Accounts Created:")
        print("👤 Admin: admin@itrc.ac.ir / admin123")
        print("👤 Governance: governance@itrc.ac.ir / gov123") 
        print("👤 Evaluator: evaluator@itrc.ac.ir / eval123")
        print("👤 Applicant: applicant@company.com / app123")
        
    except Exception as e:
        print(f"❌ Error creating sample data: {e}")
        db.rollback()
    finally:
        db.close()

def main():
    """Main initialization function."""
    print("🚀 Initializing ITRC Common Criteria Database...")
    
    try:
        # Create tables
        engine = create_tables()
        
        # Create sample data
        create_sample_data(engine)
        
        print("\n✅ Database initialization completed successfully!")
        print("🔧 You can now start the backend server with: uvicorn app.main:app --reload")
        
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main()) 