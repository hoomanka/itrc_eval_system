#!/usr/bin/env python3
"""
Fix database schema by dropping and recreating all tables
"""
from app.database import engine, Base
from app.models import *

def fix_database():
    """Drop all tables and recreate them with correct schema"""
    print("🚨 Fixing database schema...")
    print("⚠️  This will delete all existing data!")
    
    # Drop all tables
    print("🗑️  Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    print("✅ Tables dropped successfully")
    
    # Create all tables with current schema
    print("🏗️  Creating tables with updated schema...")
    Base.metadata.create_all(bind=engine)
    print("✅ Tables created successfully with correct schema")
    
    print("🎉 Database schema fixed! You can now run init_db.py to add test data.")

if __name__ == "__main__":
    fix_database() 