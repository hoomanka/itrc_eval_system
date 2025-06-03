#!/usr/bin/env python3
"""
Simple script to verify PostgreSQL database status
"""

import sys
sys.path.append('.')

def check_db_status():
    """Check database status"""
    print("🔍 Verifying PostgreSQL database status...")
    
    try:
        from app.database import engine
        from app.models import User, UserRole, ProductClass, EvaluationHelp, Application, SecurityTarget, STClassSelection
        from sqlalchemy import text
        from sqlalchemy.orm import sessionmaker
        
        # Test connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("✅ Database connection successful")
        
        # Check tables using ORM
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        try:
            # Count records using ORM (handles enums properly)
            user_count = db.query(User).count()
            evaluator_count = db.query(User).filter(User.role == UserRole.EVALUATOR).count()
            applicant_count = db.query(User).filter(User.role == UserRole.APPLICANT).count()
            admin_count = db.query(User).filter(User.role == UserRole.ADMIN).count()
            
            class_count = db.query(ProductClass).count()
            help_count = db.query(EvaluationHelp).count()
            app_count = db.query(Application).count()
            st_count = db.query(SecurityTarget).count()
            selection_count = db.query(STClassSelection).count()
            
            print(f"\n📊 Database Status:")
            print(f"   👥 Total Users: {user_count}")
            print(f"      - Evaluators: {evaluator_count}")
            print(f"      - Applicants: {applicant_count}")
            print(f"      - Admins: {admin_count}")
            print(f"   🏷️  Product Classes: {class_count}")
            print(f"   📚 Evaluation Helps: {help_count}")
            print(f"   📋 Applications: {app_count}")
            print(f"   🎯 Security Targets: {st_count}")
            print(f"   📂 Class Selections: {selection_count}")
            
            # Check if fully initialized
            is_initialized = (evaluator_count > 0 and class_count > 0 and help_count > 0)
            print(f"\n🔧 Database Initialized: {'✅ YES' if is_initialized else '❌ NO'}")
            
            if is_initialized:
                print("\n🎉 Database is ready for use!")
                
                # Show sample data
                if evaluator_count > 0:
                    evaluator = db.query(User).filter(User.role == UserRole.EVALUATOR).first()
                    print(f"   Sample evaluator: {evaluator.email}")
                
                if app_count > 0:
                    app = db.query(Application).first()
                    print(f"   Sample application: {app.product_name}")
            else:
                print("\n⚠️  Database needs initialization!")
                print("   Run: python start_server.py")
        
        finally:
            db.close()
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    check_db_status() 