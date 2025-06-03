#!/usr/bin/env python3
"""
PostgreSQL Database Initialization Script for ITRC Evaluation System
Enhanced with Technical Report Generation and Supervisor Workflow
"""

import os
import sys
from pathlib import Path

# Add the app directory to Python path
current_dir = Path(__file__).parent
sys.path.append(str(current_dir))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta
import json

# Import models and database config
from app.database import Base, SQLALCHEMY_DATABASE_URL
from app.models import (
    User, UserRole, Application, ApplicationStatus, ProductType,
    SecurityTarget, ProductClass, ProductSubclass, 
    EvaluationHelp, STClassSelection, Evaluation, TechnicalReport,
    ReportStatus, ReportType
)
from app.core.security import get_password_hash

def init_postgres_database():
    """Initialize PostgreSQL database with complete data including supervisor workflow"""
    
    print("🚀 Initializing PostgreSQL Database with Enhanced Features...")
    
    # Create engine
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    
    # Drop all existing tables
    print("🗑️  Dropping existing tables...")
    Base.metadata.drop_all(bind=engine)
    
    # Create all tables
    print("🏗️  Creating new tables...")
    Base.metadata.create_all(bind=engine)
    
    # Create session
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # 1. Create Product Type (Antimalware)
        print("📦 Creating product type...")
        product_type = ProductType(
            name_en="Antimalware Software",
            name_fa="نرم‌افزار ضد بدافزار",
            protection_profile="Anti-Malware Protection Profile v2.0",
            description_en="Security evaluation for antimalware software products including detection, prevention, and removal capabilities",
            description_fa="ارزیابی امنیتی نرم‌افزارهای ضد بدافزار شامل قابلیت‌های تشخیص، پیشگیری و حذف",
            estimated_days=120,
            estimated_cost=50000000.0,  # 50M Iranian Rial
            required_documents=["ST", "AGD", "ATE", "AVA"]
        )
        db.add(product_type)
        db.commit()
        db.refresh(product_type)
        
        # 2. Create 7 Main Product Classes
        print("🏷️  Creating product classes...")
        product_classes_data = [
            {
                "name_en": "Malware Detection",
                "name_fa": "تشخیص بدافزار",
                "code": "FAM_MAL",
                "description_en": "Malware detection and identification capabilities",
                "description_fa": "قابلیت‌های تشخیص و شناسایی بدافزار",
                "weight": 1.5,
                "order": 1
            },
            {
                "name_en": "Real-time Protection",
                "name_fa": "محافظت بلادرنگ",
                "code": "FAM_RTP",
                "description_en": "Real-time monitoring and protection against threats",
                "description_fa": "نظارت و محافظت بلادرنگ در برابر تهدیدات",
                "weight": 1.4,
                "order": 2
            },
            {
                "name_en": "Quarantine Management",
                "name_fa": "مدیریت قرنطینه",
                "code": "FAM_QUA",
                "description_en": "Quarantine and isolation of detected threats",
                "description_fa": "قرنطینه و جداسازی تهدیدات شناسایی شده",
                "weight": 1.2,
                "order": 3
            },
            {
                "name_en": "Update Mechanism",
                "name_fa": "سازوکار به‌روزرسانی",
                "code": "FAM_UPD",
                "description_en": "Secure update mechanism for virus definitions",
                "description_fa": "سازوکار امن به‌روزرسانی تعاریف ویروس",
                "weight": 1.3,
                "order": 4
            },
            {
                "name_en": "Scanning Engine",
                "name_fa": "موتور اسکن",
                "code": "FAM_SCN",
                "description_en": "File and system scanning capabilities",
                "description_fa": "قابلیت‌های اسکن فایل و سیستم",
                "weight": 1.5,
                "order": 5
            },
            {
                "name_en": "Behavioral Analysis",
                "name_fa": "تحلیل رفتاری",
                "code": "FAM_BEH",
                "description_en": "Behavioral analysis and heuristic detection",
                "description_fa": "تحلیل رفتاری و تشخیص اکتشافی",
                "weight": 1.1,
                "order": 6
            },
            {
                "name_en": "Network Protection",
                "name_fa": "محافظت شبکه",
                "code": "FAM_NET",
                "description_en": "Network-based threat detection and protection",
                "description_fa": "تشخیص و محافظت از تهدیدات مبتنی بر شبکه",
                "weight": 1.0,
                "order": 7
            }
        ]
        
        product_classes = []
        for class_data in product_classes_data:
            pc = ProductClass(
                product_type_id=product_type.id,
                **class_data
            )
            db.add(pc)
            product_classes.append(pc)
        
        db.commit()
        
        # 3. Create Subclasses (2-3 per class)
        print("📂 Creating product subclasses...")
        subclasses_data = [
            # Malware Detection subclasses
            {"class_idx": 0, "name_en": "Signature-based Detection", "name_fa": "تشخیص مبتنی بر امضا", "code": "FAM_MAL.1", "order": 1},
            {"class_idx": 0, "name_en": "Heuristic Detection", "name_fa": "تشخیص اکتشافی", "code": "FAM_MAL.2", "order": 2},
            {"class_idx": 0, "name_en": "Machine Learning Detection", "name_fa": "تشخیص یادگیری ماشین", "code": "FAM_MAL.3", "order": 3},
            
            # Real-time Protection subclasses
            {"class_idx": 1, "name_en": "File System Monitoring", "name_fa": "نظارت سیستم فایل", "code": "FAM_RTP.1", "order": 1},
            {"class_idx": 1, "name_en": "Process Monitoring", "name_fa": "نظارت فرآیند", "code": "FAM_RTP.2", "order": 2},
            {"class_idx": 1, "name_en": "Web Protection", "name_fa": "محافظت وب", "code": "FAM_RTP.3", "order": 3},
            
            # Quarantine Management subclasses
            {"class_idx": 2, "name_en": "Automatic Quarantine", "name_fa": "قرنطینه خودکار", "code": "FAM_QUA.1", "order": 1},
            {"class_idx": 2, "name_en": "Manual Quarantine Management", "name_fa": "مدیریت دستی قرنطینه", "code": "FAM_QUA.2", "order": 2},
            
            # Update Mechanism subclasses
            {"class_idx": 3, "name_en": "Automatic Updates", "name_fa": "به‌روزرسانی خودکار", "code": "FAM_UPD.1", "order": 1},
            {"class_idx": 3, "name_en": "Secure Update Verification", "name_fa": "تأیید امن به‌روزرسانی", "code": "FAM_UPD.2", "order": 2},
            
            # Scanning Engine subclasses
            {"class_idx": 4, "name_en": "On-Demand Scanning", "name_fa": "اسکن درخواستی", "code": "FAM_SCN.1", "order": 1},
            {"class_idx": 4, "name_en": "Scheduled Scanning", "name_fa": "اسکن زمان‌بندی شده", "code": "FAM_SCN.2", "order": 2},
            {"class_idx": 4, "name_en": "Boot-time Scanning", "name_fa": "اسکن زمان بوت", "code": "FAM_SCN.3", "order": 3},
            
            # Behavioral Analysis subclasses
            {"class_idx": 5, "name_en": "Dynamic Analysis", "name_fa": "تحلیل پویا", "code": "FAM_BEH.1", "order": 1},
            {"class_idx": 5, "name_en": "Static Analysis", "name_fa": "تحلیل ایستا", "code": "FAM_BEH.2", "order": 2},
            
            # Network Protection subclasses
            {"class_idx": 6, "name_en": "Firewall Integration", "name_fa": "یکپارچگی فایروال", "code": "FAM_NET.1", "order": 1},
            {"class_idx": 6, "name_en": "URL Filtering", "name_fa": "فیلترینگ URL", "code": "FAM_NET.2", "order": 2}
        ]
        
        subclasses = []
        for sub_data in subclasses_data:
            class_idx = sub_data.pop("class_idx")
            sub = ProductSubclass(
                product_class_id=product_classes[class_idx].id,
                description_en=f"Detailed evaluation of {sub_data['name_en'].lower()}",
                description_fa=f"ارزیابی دقیق {sub_data['name_fa']}",
                **sub_data
            )
            db.add(sub)
            subclasses.append(sub)
        
        db.commit()
        
        # 4. Create Evaluation Help Data
        print("💡 Creating evaluation help data...")
        help_data = [
            {
                "class_idx": 0,  # Malware Detection
                "help_text_en": "Evaluate the antimalware software's ability to detect known and unknown malware using various detection techniques including signature-based, heuristic, and machine learning approaches.",
                "help_text_fa": "ارزیابی توانایی نرم‌افزار ضد بدافزار در تشخیص بدافزارهای شناخته شده و ناشناخته با استفاده از تکنیک‌های مختلف تشخیص شامل مبتنی بر امضا، اکتشافی و یادگیری ماشین.",
                "evaluation_criteria": {
                    "detection_rate": "Minimum 95% detection rate for known malware",
                    "false_positive_rate": "Maximum 0.1% false positive rate",
                    "zero_day_detection": "Ability to detect zero-day threats"
                }
            },
            {
                "class_idx": 1,  # Real-time Protection
                "help_text_en": "Assess the real-time monitoring capabilities including file system protection, process monitoring, and web-based threat prevention.",
                "help_text_fa": "ارزیابی قابلیت‌های نظارت بلادرنگ شامل محافظت سیستم فایل، نظارت بر فرآیندها و پیشگیری از تهدیدات مبتنی بر وب.",
                "evaluation_criteria": {
                    "response_time": "Real-time response within 100ms",
                    "system_impact": "CPU usage below 5% during idle state",
                    "memory_usage": "Memory footprint below 100MB"
                }
            },
            {
                "class_idx": 2,  # Quarantine Management
                "help_text_en": "Evaluate quarantine functionality including automatic isolation, secure storage, and restoration capabilities.",
                "help_text_fa": "ارزیابی عملکرد قرنطینه شامل جداسازی خودکار، ذخیره‌سازی امن و قابلیت‌های بازیابی.",
                "evaluation_criteria": {
                    "isolation_effectiveness": "100% isolation of quarantined files",
                    "secure_storage": "Encrypted quarantine storage",
                    "restoration_capability": "Safe restoration with user confirmation"
                }
            },
            {
                "class_idx": 3,  # Update Mechanism
                "help_text_en": "Test the secure update mechanism for virus definitions and program updates including integrity verification.",
                "help_text_fa": "آزمایش سازوکار امن به‌روزرسانی تعاریف ویروس و به‌روزرسانی‌های برنامه شامل تأیید یکپارچگی.",
                "evaluation_criteria": {
                    "update_frequency": "Daily automatic updates",
                    "integrity_verification": "Digital signature verification",
                    "rollback_capability": "Ability to rollback failed updates"
                }
            },
            {
                "class_idx": 4,  # Scanning Engine
                "help_text_en": "Evaluate scanning engine performance including file scanning, memory scanning, and system scanning capabilities.",
                "help_text_fa": "ارزیابی عملکرد موتور اسکن شامل اسکن فایل، اسکن حافظه و قابلیت‌های اسکن سیستم.",
                "evaluation_criteria": {
                    "scanning_speed": "Minimum 1GB/minute scanning speed",
                    "thoroughness": "Complete system and memory scanning",
                    "resource_efficiency": "Minimal system resource usage"
                }
            }
        ]
        
        for help_item in help_data:
            class_idx = help_item.pop("class_idx")
            help_entry = EvaluationHelp(
                product_class_id=product_classes[class_idx].id,
                examples={"test_cases": ["Scan test malware samples", "Performance testing", "False positive testing"]},
                **help_item
            )
            db.add(help_entry)
        
        db.commit()
        
        # 5. Create Users with Supervisor Relationships
        print("👥 Creating users with supervisor relationships...")
        
        # Create Supervisor first
        supervisor = User(
            email="supervisor@itrc.ir",
            hashed_password=get_password_hash("super123"),
            full_name="Dr. Ahmad Supervisor",
            role=UserRole.SUPERVISOR,
            company="ITRC",
            phone="+98-21-1234567"
        )
        db.add(supervisor)
        db.commit()
        db.refresh(supervisor)
        
        # Create Evaluator with supervisor relationship
        evaluator = User(
            email="evaluator@itrc.ir",
            hashed_password=get_password_hash("eval123"),
            full_name="Engineer Maryam Evaluator",
            role=UserRole.EVALUATOR,
            company="ITRC",
            phone="+98-21-7654321",
            supervisor_id=supervisor.id
        )
        db.add(evaluator)
        
        # Create Applicant
        applicant = User(
            email="applicant@company.com",
            hashed_password=get_password_hash("app123"),
            full_name="Mr. Ali Applicant",
            role=UserRole.APPLICANT,
            company="TechSafe Solutions",
            phone="+98-21-9876543"
        )
        db.add(applicant)
        
        # Create Admin
        admin = User(
            email="admin@itrc.ir",
            hashed_password=get_password_hash("admin123"),
            full_name="System Administrator",
            role=UserRole.ADMIN,
            company="ITRC",
            phone="+98-21-1111111"
        )
        db.add(admin)
        
        db.commit()
        db.refresh(evaluator)
        db.refresh(applicant)
        
        # 6. Create Sample Application
        print("📄 Creating sample application...")
        application = Application(
            application_number="ITRC-APP-2024-0001",
            product_name="SecureShield Antimalware Pro",
            product_version="3.5.2",
            product_type_id=product_type.id,
            applicant_id=applicant.id,
            status=ApplicationStatus.IN_EVALUATION,
            submission_date=datetime.now() - timedelta(days=30),
            estimated_completion_date=datetime.now() + timedelta(days=60),
            description="Advanced antimalware solution with machine learning capabilities and real-time protection",
            evaluation_level="EAL2",
            company_name="TechSafe Solutions",
            contact_person="Mr. Ali Applicant",
            contact_email="applicant@company.com",
            contact_phone="+98-21-9876543"
        )
        db.add(application)
        db.commit()
        db.refresh(application)
        
        # 7. Create Security Target
        print("🎯 Creating security target...")
        security_target = SecurityTarget(
            application_id=application.id,
            version="1.2",
            status="submitted",
            product_description="SecureShield Antimalware Pro is a comprehensive security solution providing multi-layered protection against malware threats",
            toe_description="The Target of Evaluation includes the antimalware engine, real-time protection module, quarantine system, and update mechanism",
            submitted_at=datetime.now() - timedelta(days=25)
        )
        db.add(security_target)
        db.commit()
        db.refresh(security_target)
        
        # 8. Create Class Selections (5 classes selected)
        print("🏷️  Creating class selections...")
        selected_classes = [0, 1, 2, 3, 4]  # First 5 classes
        
        for i, class_idx in enumerate(selected_classes):
            pc = product_classes[class_idx]
            # Select first subclass for each main class
            subclass = next((s for s in subclasses if s.product_class_id == pc.id), None)
            
            selection = STClassSelection(
                security_target_id=security_target.id,
                product_class_id=pc.id,
                product_subclass_id=subclass.id if subclass else None,
                description=f"Implementation of {pc.name_en} using industry standard approaches with enhanced security features",
                justification=f"This class is essential for comprehensive malware protection and meets the security requirements for {application.evaluation_level}",
                test_approach=f"Testing will include functional verification, performance benchmarking, and security validation for {pc.name_en}",
                evaluator_notes=f"Initial assessment shows good implementation of {pc.name_en} with proper security controls",
                evaluation_status="pass" if i % 3 != 2 else "needs_revision",
                evaluation_score=85.0 + (i * 2.5)
            )
            db.add(selection)
        
        db.commit()
        
        # 9. Create Evaluation
        print("📊 Creating evaluation...")
        evaluation = Evaluation(
            application_id=application.id,
            evaluator_id=evaluator.id,
            start_date=datetime.now() - timedelta(days=20),
            end_date=datetime.now() - timedelta(days=1),
            status="completed",
            document_review_completed=True,
            security_testing_completed=True,
            vulnerability_assessment_completed=True,
            overall_score=87.5,
            findings="The antimalware solution demonstrates strong detection capabilities and good performance. Minor improvements needed in update mechanism validation.",
            recommendations="1. Enhance update integrity verification\n2. Improve quarantine file handling\n3. Optimize scanning performance for large files",
            report_ready_for_generation=True
        )
        db.add(evaluation)
        db.commit()
        db.refresh(evaluation)
        
        # 10. Generate Sample Technical Report
        print("📄 Generating sample technical report...")
        try:
            from app.services.report_generator import TechnicalReportGenerator
            
            generator = TechnicalReportGenerator(db)
            report = generator.generate_technical_report(
                evaluation_id=evaluation.id,
                generated_by_id=evaluator.id,
                title="Evaluation Technical Report for SecureShield Antimalware Pro v3.5.2"
            )
            
            print(f"✅ Sample technical report generated: {report.report_number}")
            
            # Update application status
            application.status = ApplicationStatus.REPORT_GENERATED
            evaluation.report_generated_at = datetime.now()
            db.commit()
            
        except Exception as e:
            print(f"⚠️  Note: Could not generate sample report: {e}")
            print("   This is normal if python-docx is not installed yet")
        
        print("\n" + "="*60)
        print("✅ Database initialization completed successfully!")
        print("="*60)
        print("\n📊 Summary:")
        print(f"   • Product Types: 1 (Antimalware Software)")
        print(f"   • Product Classes: 7")
        print(f"   • Product Subclasses: 16")
        print(f"   • Evaluation Help Entries: 5")
        print(f"   • Users: 4 (Admin, Supervisor, Evaluator, Applicant)")
        print(f"   • Applications: 1")
        print(f"   • Security Targets: 1")
        print(f"   • Class Selections: 5")
        print(f"   • Evaluations: 1 (Completed)")
        print(f"   • Technical Reports: 1 (if generation succeeded)")
        
        print("\n👥 User Accounts:")
        print("   • Admin: admin@itrc.ir / admin123")
        print("   • Supervisor: supervisor@itrc.ir / super123")
        print("   • Evaluator: evaluator@itrc.ir / eval123")
        print("   • Applicant: applicant@company.com / app123")
        
        print("\n🔄 Workflow Status:")
        print("   • Application: In Evaluation → Report Generated")
        print("   • Evaluation: Completed (87.5% score)")
        print("   • Technical Report: Generated and ready for supervisor review")
        
        print("\n🚀 Ready to test report generation and supervisor workflow!")
        
    except Exception as e:
        print(f"❌ Error during database initialization: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    init_postgres_database() 