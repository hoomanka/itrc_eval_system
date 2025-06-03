#!/usr/bin/env python3
"""Update evaluator email domain from .ir to .ac.ir"""

import sys
sys.path.append('.')

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import User
from app.core.config import settings

# Create database connection
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def update_evaluator_email():
    """Update evaluator email domain"""
    db = SessionLocal()
    try:
        # Find evaluator user
        evaluator = db.query(User).filter(User.email == "evaluator@itrc.ir").first()
        
        if evaluator:
            print(f"📧 Found evaluator: {evaluator.email}")
            # Update email domain
            evaluator.email = "evaluator@itrc.ac.ir"
            db.commit()
            print(f"✅ Updated evaluator email to: {evaluator.email}")
            print(f"🔑 Evaluator credentials: evaluator@itrc.ac.ir / eval123")
        else:
            print("❌ Evaluator not found with email: evaluator@itrc.ir")
            
        # Also update admin if needed
        admin = db.query(User).filter(User.email == "admin@itrc.ir").first()
        if admin:
            admin.email = "admin@itrc.ac.ir"
            db.commit()
            print(f"✅ Updated admin email to: {admin.email}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("🔄 Updating evaluator email domain...")
    update_evaluator_email()
    print("🎉 Email update completed!") 