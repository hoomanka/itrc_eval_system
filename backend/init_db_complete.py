#!/usr/bin/env python3
"""
Complete database initialization for ITRC Cybersecurity Certification system
Includes antimalware software product classes, evaluation help data, and proper setup
"""

import os
import sys
import sqlalchemy
from sqlalchemy.orm import sessionmaker
from datetime import datetime

# Add the app directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.database import engine, Base
from app.models import (
    User, UserRole, ProductType, ProductClass, ProductSubclass, 
    EvaluationHelp, Application, ApplicationStatus
)
from passlib.context import CryptContext

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def init_database():
    """Initialize database with complete setup"""
    print("🚀 Starting complete database initialization...")
    
    # Create all tables
    print("📋 Creating database tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    # Create session
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # 1. Create default users
        print("👥 Creating default users...")
        
        # Admin user
        admin_user = User(
            email="admin@itrc.ir",
            hashed_password=hash_password("admin123"),
            full_name="مدیر سیستم",
            role=UserRole.ADMIN,
            company="ITRC",
            phone="021-12345678",
            is_active=True
        )
        db.add(admin_user)
        
        # Evaluator user
        evaluator_user = User(
            email="evaluator@itrc.ir",
            hashed_password=hash_password("eval123"),
            full_name="ارزیاب سیستم",
            role=UserRole.EVALUATOR,
            company="ITRC",
            phone="021-87654321",
            is_active=True
        )
        db.add(evaluator_user)
        
        # Sample applicant user
        applicant_user = User(
            email="applicant@company.com",
            hashed_password=hash_password("app123"),
            full_name="متقاضی نمونه",
            role=UserRole.APPLICANT,
            company="شرکت نمونه",
            phone="021-11223344",
            is_active=True
        )
        db.add(applicant_user)
        
        db.commit()
        print("✅ Default users created successfully")
        
        # 2. Create Antimalware Product Type
        print("🛡️ Creating antimalware product type...")
        
        antimalware_product_type = ProductType(
            name_en="Antimalware Software",
            name_fa="نرم‌افزار ضد بدافزار",
            protection_profile="PP_AV_V1.0",
            description_en="Antimalware software products for endpoint protection",
            description_fa="محصولات نرم‌افزاری ضد بدافزار برای حفاظت از نقاط پایانی",
            estimated_days=120,
            estimated_cost=50000000.0,  # 50 million IRR
            required_documents=["ST", "ALC", "AGD", "ASE", "ADV", "ATE", "AVA"],
            is_active=True
        )
        db.add(antimalware_product_type)
        db.commit()
        print("✅ Antimalware product type created")
        
        # 3. Create Antimalware Product Classes
        print("📂 Creating antimalware product classes...")
        
        antimalware_classes = [
            {
                "code": "FAM_CRY",
                "name_en": "Cryptographic support",
                "name_fa": "پشتیبانی رمزنگاری",
                "description_en": "Functions related to cryptographic operations",
                "description_fa": "عملکردهای مرتبط با عملیات رمزنگاری",
                "subclasses": [
                    {
                        "code": "FAM_CRY.1",
                        "name_en": "Cryptographic key generation",
                        "name_fa": "تولید کلید رمزنگاری",
                        "description_en": "Generation of cryptographic keys",
                        "description_fa": "تولید کلیدهای رمزنگاری"
                    },
                    {
                        "code": "FAM_CRY.2", 
                        "name_en": "Cryptographic operation",
                        "name_fa": "عملیات رمزنگاری",
                        "description_en": "Performance of cryptographic operations",
                        "description_fa": "انجام عملیات رمزنگاری"
                    }
                ]
            },
            {
                "code": "FAM_MAL",
                "name_en": "Malware detection",
                "name_fa": "تشخیص بدافزار",
                "description_en": "Functions for detecting malicious software",
                "description_fa": "عملکردهای تشخیص نرم‌افزارهای مخرب",
                "subclasses": [
                    {
                        "code": "FAM_MAL.1",
                        "name_en": "Signature-based detection",
                        "name_fa": "تشخیص بر اساس امضا",
                        "description_en": "Detection using known malware signatures",
                        "description_fa": "تشخیص با استفاده از امضای بدافزارهای شناخته شده"
                    },
                    {
                        "code": "FAM_MAL.2",
                        "name_en": "Heuristic detection",
                        "name_fa": "تشخیص ابتکاری",
                        "description_en": "Detection using behavioral and heuristic analysis",
                        "description_fa": "تشخیص با استفاده از تحلیل رفتاری و ابتکاری"
                    },
                    {
                        "code": "FAM_MAL.3",
                        "name_en": "Real-time detection",
                        "name_fa": "تشخیص بلادرنگ",
                        "description_en": "Real-time malware detection capabilities",
                        "description_fa": "قابلیت‌های تشخیص بدافزار در زمان واقعی"
                    }
                ]
            },
            {
                "code": "FAM_PRT",
                "name_en": "Protection mechanisms",
                "name_fa": "مکانیزم‌های حفاظت",
                "description_en": "Functions providing protection against threats",
                "description_fa": "عملکردهای ارائه حفاظت در برابر تهدیدات",
                "subclasses": [
                    {
                        "code": "FAM_PRT.1",
                        "name_en": "File system protection",
                        "name_fa": "حفاظت سیستم فایل",
                        "description_en": "Protection of file system integrity",
                        "description_fa": "حفاظت از یکپارچگی سیستم فایل"
                    },
                    {
                        "code": "FAM_PRT.2",
                        "name_en": "Process protection",
                        "name_fa": "حفاظت فرآیند",
                        "description_en": "Protection of running processes",
                        "description_fa": "حفاظت از فرآیندهای در حال اجرا"
                    },
                    {
                        "code": "FAM_PRT.3",
                        "name_en": "Registry protection",
                        "name_fa": "حفاظت رجیستری",
                        "description_en": "Protection of system registry",
                        "description_fa": "حفاظت از رجیستری سیستم"
                    }
                ]
            },
            {
                "code": "FAM_UPD",
                "name_en": "Update mechanisms",
                "name_fa": "مکانیزم‌های به‌روزرسانی",
                "description_en": "Functions for updating malware definitions",
                "description_fa": "عملکردهای به‌روزرسانی تعاریف بدافزار",
                "subclasses": [
                    {
                        "code": "FAM_UPD.1",
                        "name_en": "Automatic updates",
                        "name_fa": "به‌روزرسانی خودکار",
                        "description_en": "Automatic update of malware definitions",
                        "description_fa": "به‌روزرسانی خودکار تعاریف بدافزار"
                    },
                    {
                        "code": "FAM_UPD.2",
                        "name_en": "Manual updates", 
                        "name_fa": "به‌روزرسانی دستی",
                        "description_en": "Manual update capabilities",
                        "description_fa": "قابلیت‌های به‌روزرسانی دستی"
                    }
                ]
            },
            {
                "code": "FAM_QUA",
                "name_en": "Quarantine management",
                "name_fa": "مدیریت قرنطینه",
                "description_en": "Functions for managing quarantined files",
                "description_fa": "عملکردهای مدیریت فایل‌های قرنطینه شده",
                "subclasses": [
                    {
                        "code": "FAM_QUA.1",
                        "name_en": "File quarantine",
                        "name_fa": "قرنطینه فایل",
                        "description_en": "Quarantine of suspicious files",
                        "description_fa": "قرنطینه فایل‌های مشکوک"
                    },
                    {
                        "code": "FAM_QUA.2",
                        "name_en": "Quarantine management",
                        "name_fa": "مدیریت قرنطینه",
                        "description_en": "Management of quarantined items",
                        "description_fa": "مدیریت موارد قرنطینه شده"
                    }
                ]
            },
            {
                "code": "FAM_LOG",
                "name_en": "Logging and reporting",
                "name_fa": "ثبت رویداد و گزارش‌دهی",
                "description_en": "Functions for logging events and generating reports",
                "description_fa": "عملکردهای ثبت رویدادها و تولید گزارش",
                "subclasses": [
                    {
                        "code": "FAM_LOG.1",
                        "name_en": "Event logging",
                        "name_fa": "ثبت رویداد",
                        "description_en": "Logging of security events",
                        "description_fa": "ثبت رویدادهای امنیتی"
                    },
                    {
                        "code": "FAM_LOG.2",
                        "name_en": "Report generation",
                        "name_fa": "تولید گزارش",
                        "description_en": "Generation of security reports",
                        "description_fa": "تولید گزارش‌های امنیتی"
                    }
                ]
            },
            {
                "code": "FAM_CFG",
                "name_en": "Configuration management",
                "name_fa": "مدیریت پیکربندی",
                "description_en": "Functions for managing system configuration",
                "description_fa": "عملکردهای مدیریت پیکربندی سیستم",
                "subclasses": [
                    {
                        "code": "FAM_CFG.1",
                        "name_en": "Policy management",
                        "name_fa": "مدیریت خط‌مشی",
                        "description_en": "Management of security policies",
                        "description_fa": "مدیریت خط‌مشی‌های امنیتی"
                    },
                    {
                        "code": "FAM_CFG.2",
                        "name_en": "Configuration backup",
                        "name_fa": "پشتیبان‌گیری پیکربندی",
                        "description_en": "Backup and restore of configurations",
                        "description_fa": "پشتیبان‌گیری و بازیابی پیکربندی‌ها"
                    }
                ]
            }
        ]
        
        # Create classes and subclasses
        for class_data in antimalware_classes:
            product_class = ProductClass(
                product_type_id=antimalware_product_type.id,
                name_en=class_data["name_en"],
                name_fa=class_data["name_fa"],
                code=class_data["code"],
                description_en=class_data["description_en"],
                description_fa=class_data["description_fa"],
                order=len(antimalware_classes),
                is_active=True
            )
            db.add(product_class)
            db.commit()
            
            # Create subclasses
            for subclass_data in class_data["subclasses"]:
                product_subclass = ProductSubclass(
                    product_class_id=product_class.id,
                    name_en=subclass_data["name_en"],
                    name_fa=subclass_data["name_fa"],
                    code=subclass_data["code"],
                    description_en=subclass_data["description_en"],
                    description_fa=subclass_data["description_fa"],
                    order=len(class_data["subclasses"]),
                    is_active=True
                )
                db.add(product_subclass)
            
            db.commit()
            print(f"   ✅ Created class: {class_data['name_fa']} with {len(class_data['subclasses'])} subclasses")
        
        # 4. Create evaluation help data
        print("📖 Creating evaluation help data...")
        
        evaluation_helps = [
            {
                "class_code": "FAM_MAL",
                "subclass_code": "FAM_MAL.1",
                "help_text_en": "Verify that the antimalware can detect known malware using signature-based detection. Test with EICAR test file and other standard test malware samples.",
                "help_text_fa": "تأیید کنید که ضد بدافزار می‌تواند بدافزارهای شناخته شده را با استفاده از تشخیص مبتنی بر امضا شناسایی کند. با فایل تست EICAR و سایر نمونه‌های بدافزار استاندارد آزمایش کنید.",
                "evaluation_criteria": {
                    "detection_rate": "Must detect 95% of known malware samples",
                    "false_positive_rate": "Must be less than 0.1%",
                    "performance_impact": "System performance impact must be less than 10%"
                }
            },
            {
                "class_code": "FAM_MAL",
                "subclass_code": "FAM_MAL.2",
                "help_text_en": "Test heuristic detection capabilities against unknown malware variants and suspicious behaviors. Verify behavioral analysis engine effectiveness.",
                "help_text_fa": "قابلیت‌های تشخیص ابتکاری را در برابر انواع بدافزارهای ناشناخته و رفتارهای مشکوک آزمایش کنید. اثربخشی موتور تحلیل رفتاری را تأیید کنید.",
                "evaluation_criteria": {
                    "heuristic_detection_rate": "Must detect 80% of unknown malware variants",
                    "behavioral_analysis": "Must identify suspicious behaviors accurately",
                    "machine_learning": "ML models must be regularly updated"
                }
            },
            {
                "class_code": "FAM_PRT",
                "subclass_code": "FAM_PRT.1",
                "help_text_en": "Verify file system protection mechanisms including real-time scanning, file integrity monitoring, and access control.",
                "help_text_fa": "مکانیزم‌های حفاظت سیستم فایل شامل اسکن بلادرنگ، نظارت بر یکپارچگی فایل و کنترل دسترسی را تأیید کنید.",
                "evaluation_criteria": {
                    "real_time_scanning": "Must scan files in real-time during access",
                    "integrity_monitoring": "Must detect unauthorized file modifications",
                    "performance": "File access delay must be minimal"
                }
            }
        ]
        
        # Get created classes and subclasses
        classes = db.query(ProductClass).all()
        subclasses = db.query(ProductSubclass).all()
        
        for help_data in evaluation_helps:
            # Find the class and subclass
            product_class = next((c for c in classes if c.code == help_data["class_code"]), None)
            product_subclass = next((s for s in subclasses if s.code == help_data["subclass_code"]), None)
            
            if product_class and product_subclass:
                eval_help = EvaluationHelp(
                    product_class_id=product_class.id,
                    product_subclass_id=product_subclass.id,
                    help_text_en=help_data["help_text_en"],
                    help_text_fa=help_data["help_text_fa"],
                    evaluation_criteria=help_data["evaluation_criteria"],
                    examples={}
                )
                db.add(eval_help)
        
        db.commit()
        print("✅ Evaluation help data created successfully")
        
        print("\n🎉 Database initialization completed successfully!")
        print("\n👤 Default user accounts created:")
        print("   📧 Admin: admin@itrc.ir / admin123")
        print("   📧 Evaluator: evaluator@itrc.ir / eval123")  
        print("   📧 Applicant: applicant@company.com / app123")
        print(f"\n📊 Created {len(antimalware_classes)} product classes with subclasses")
        print("📖 Created evaluation help documentation")
        
    except Exception as e:
        print(f"❌ Error during database initialization: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    init_database() 