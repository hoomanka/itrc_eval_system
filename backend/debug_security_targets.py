#!/usr/bin/env python3
"""Debug security targets and class selections"""

import sys
sys.path.append('.')

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, joinedload
from app.models import SecurityTarget, STClassSelection, ProductClass, Application
from app.core.config import settings

# Create database connection
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def debug_security_targets():
    """Debug security targets data"""
    db = SessionLocal()
    try:
        # Check all applications
        applications = db.query(Application).all()
        print(f"📊 Total applications: {len(applications)}")
        
        for app in applications:
            print(f"\n🔍 Application {app.id}: {app.product_name}")
            print(f"   Status: {app.status}")
            
            # Check security target
            st = db.query(SecurityTarget).filter(
                SecurityTarget.application_id == app.id
            ).first()
            
            if st:
                print(f"   ✅ Security Target found (ID: {st.id})")
                
                # Check class selections with proper loading
                selections = db.query(STClassSelection).options(
                    joinedload(STClassSelection.product_class),
                    joinedload(STClassSelection.product_subclass)
                ).filter(
                    STClassSelection.security_target_id == st.id
                ).all()
                
                print(f"   📂 Class selections: {len(selections)}")
                
                for sel in selections:
                    print(f"      - Selection {sel.id}:")
                    if sel.product_class:
                        print(f"        Class: {sel.product_class.name_fa} (ID: {sel.product_class.id})")
                        if sel.product_subclass:
                            print(f"        Subclass: {sel.product_subclass.name_fa} (ID: {sel.product_subclass.id})")
                        else:
                            print(f"        Subclass: None")
                        print(f"        Status: {sel.evaluation_status}")
                        print(f"        Score: {sel.evaluation_score}")
                    else:
                        print(f"        ❌ Missing product_class!")
            else:
                print(f"   ❌ No security target found")
        
        print(f"\n📋 Product Classes available:")
        classes = db.query(ProductClass).all()
        for cls in classes:
            print(f"   - {cls.name_fa} (ID: {cls.id}, Code: {cls.code})")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    print("🔍 Debugging security targets...")
    debug_security_targets()
    print("�� Debug completed!") 