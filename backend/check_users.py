#!/usr/bin/env python3
"""Check users in database"""

import sys
sys.path.append('.')

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import User
from app.core.config import settings

# Create database connection
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def check_users():
    """Check all users in database"""
    db = SessionLocal()
    try:
        users = db.query(User).all()
        print("👥 Users in database:")
        print("=" * 50)
        
        for user in users:
            print(f"📧 Email: {user.email}")
            print(f"👤 Name: {user.full_name}")
            print(f"🎭 Role: {user.role}")
            print(f"🏢 Company: {user.company or 'N/A'}")
            print(f"✅ Active: {user.is_active}")
            print("-" * 30)
            
        print(f"\n📊 Total users: {len(users)}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_users() 