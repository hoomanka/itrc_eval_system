#!/usr/bin/env python3
"""Check PostgreSQL database data"""

import sys
sys.path.append('.')

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

def check_postgres_db():
    """Check PostgreSQL database data"""
    print("🔍 Checking PostgreSQL database...")
    
    try:
        # Create database connection
        engine = create_engine(settings.DATABASE_URL)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        # Check applications
        result = db.execute(text("SELECT COUNT(*) FROM applications"))
        app_count = result.scalar()
        print(f"📋 Applications: {app_count}")
        
        if app_count > 0:
            result = db.execute(text("SELECT id, product_name, status FROM applications LIMIT 3"))
            apps = result.fetchall()
            for app in apps:
                print(f"   - App {app[0]}: {app[1]} (Status: {app[2]})")
        
        # Check security targets
        result = db.execute(text("SELECT COUNT(*) FROM security_targets"))
        st_count = result.scalar()
        print(f"🎯 Security Targets: {st_count}")
        
        if st_count > 0:
            result = db.execute(text("SELECT id, application_id, status FROM security_targets LIMIT 3"))
            sts = result.fetchall()
            for st in sts:
                print(f"   - ST {st[0]}: App {st[1]} (Status: {st[2]})")
        
        # Check class selections
        result = db.execute(text("SELECT COUNT(*) FROM st_class_selections"))
        cs_count = result.scalar()
        print(f"📂 Class Selections: {cs_count}")
        
        if cs_count > 0:
            result = db.execute(text("""
                SELECT s.id, s.security_target_id, s.product_class_id, s.description
                FROM st_class_selections s
                LIMIT 3
            """))
            selections = result.fetchall()
            for sel in selections:
                description = sel[3][:50] + "..." if len(sel[3]) > 50 else sel[3]
                print(f"   - Selection {sel[0]}: ST {sel[1]}, Class {sel[2]}")
                print(f"     Description: {description}")
        
        # Check product classes
        result = db.execute(text("SELECT COUNT(*) FROM product_classes"))
        pc_count = result.scalar()
        print(f"🏷️ Product Classes: {pc_count}")
        
        if pc_count > 0:
            result = db.execute(text("SELECT id, name_fa, code FROM product_classes LIMIT 5"))
            classes = result.fetchall()
            for cls in classes:
                print(f"   - Class {cls[0]}: {cls[1]} ({cls[2]})")
        
        # Check evaluation help
        result = db.execute(text("SELECT COUNT(*) FROM evaluation_helps"))
        eh_count = result.scalar()
        print(f"📚 Evaluation Help: {eh_count}")
        
        if eh_count > 0:
            result = db.execute(text("SELECT id, product_class_id, help_text_fa FROM evaluation_helps LIMIT 3"))
            helps = result.fetchall()
            for help_item in helps:
                help_text = help_item[2][:50] + "..." if len(help_item[2]) > 50 else help_item[2]
                print(f"   - Help {help_item[0]}: Class {help_item[1]} - {help_text}")
        
        # Check users with evaluator role
        result = db.execute(text("SELECT COUNT(*) FROM users WHERE role = 'evaluator'"))
        evaluator_count = result.scalar()
        print(f"👨‍💼 Evaluators: {evaluator_count}")
        
        if evaluator_count > 0:
            result = db.execute(text("SELECT id, email, full_name FROM users WHERE role = 'evaluator' LIMIT 3"))
            evaluators = result.fetchall()
            for eval in evaluators:
                print(f"   - {eval[0]}: {eval[1]} ({eval[2]})")
        
        # Detailed check for a specific application
        if app_count > 0:
            print(f"\n🔍 Detailed check for first application:")
            result = db.execute(text("""
                SELECT a.id, a.product_name, a.status, st.id as st_id, st.status as st_status
                FROM applications a
                LEFT JOIN security_targets st ON st.application_id = a.id
                LIMIT 1
            """))
            app_detail = result.fetchone()
            if app_detail:
                print(f"   Application {app_detail[0]}: {app_detail[1]} (Status: {app_detail[2]})")
                if app_detail[3]:
                    print(f"   Security Target {app_detail[3]} (Status: {app_detail[4]})")
                    
                    # Check class selections for this ST
                    result = db.execute(text("""
                        SELECT cs.id, cs.product_class_id, cs.product_subclass_id, 
                               pc.name_fa as class_name, ps.name_fa as subclass_name,
                               cs.evaluation_status, cs.evaluation_score
                        FROM st_class_selections cs
                        JOIN product_classes pc ON pc.id = cs.product_class_id
                        LEFT JOIN product_subclasses ps ON ps.id = cs.product_subclass_id
                        WHERE cs.security_target_id = :st_id
                    """), {"st_id": app_detail[3]})
                    selections = result.fetchall()
                    print(f"   Class selections: {len(selections)}")
                    for sel in selections:
                        subclass_info = f" / {sel[4]}" if sel[4] else ""
                        print(f"     - {sel[3]}{subclass_info} (Status: {sel[5]}, Score: {sel[6]})")
                else:
                    print(f"   ❌ No security target found for this application")
        
        db.close()
        print("\n✅ PostgreSQL database check completed!")
        
    except Exception as e:
        print(f"❌ Error connecting to PostgreSQL: {e}")
        print("Make sure PostgreSQL is running and the database exists")

if __name__ == "__main__":
    check_postgres_db() 