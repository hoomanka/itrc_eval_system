#!/usr/bin/env python3
"""Add weight column to product_classes table"""

import sys
sys.path.append('.')

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.models import ProductClass
from app.core.config import settings

# Create database connection
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def add_weight_column():
    """Add weight column to product_classes table"""
    db = SessionLocal()
    try:
        # Check if weight column exists
        result = db.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='product_classes' AND column_name='weight'"))
        if result.fetchone():
            print("✅ Weight column already exists")
            return
        
        # Add weight column
        print("📋 Adding weight column to product_classes table...")
        db.execute(text("ALTER TABLE product_classes ADD COLUMN weight REAL DEFAULT 1.0"))
        db.commit()
        print("✅ Weight column added successfully")
        
        # Update existing classes with appropriate weights
        print("📊 Setting weights for existing product classes...")
        weights = {
            'FAM_CRY': 2.0,  # Cryptographic support - high importance
            'FAM_MAL': 3.0,  # Malware detection - highest importance
            'FAM_PRO': 2.5,  # Protection mechanisms - very important
            'FAM_UPD': 1.5,  # Update mechanisms - medium importance  
            'FAM_QUA': 1.5,  # Quarantine management - medium importance
            'FAM_LOG': 1.0,  # Logging and reporting - standard importance
            'FAM_CFG': 1.0,  # Configuration management - standard importance
        }
        
        for code, weight in weights.items():
            db.execute(text("UPDATE product_classes SET weight = :weight WHERE code = :code"), 
                      {"weight": weight, "code": code})
        
        db.commit()
        print("✅ Weights updated for existing product classes")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("🔄 Running weight column migration...")
    add_weight_column()
    print("🎉 Migration completed!") 