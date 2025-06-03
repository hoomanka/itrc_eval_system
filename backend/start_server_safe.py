#!/usr/bin/env python3
"""
Safe startup script for ITRC backend server
Only initializes database if explicitly requested
"""

import os
import sys
import subprocess
from pathlib import Path

# Add the app directory to Python path
current_dir = Path(__file__).parent
sys.path.append(str(current_dir))

def check_database_connection():
    """Check if we can connect to PostgreSQL database"""
    try:
        from app.database import engine
        from sqlalchemy import text
        
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def check_database_initialized():
    """Check if database has been initialized with required data"""
    try:
        from app.database import engine
        from sqlalchemy import text
        from app.models import User, UserRole, ProductClass, EvaluationHelp
        from sqlalchemy.orm import sessionmaker
        
        # Check if tables exist first
        with engine.connect() as conn:
            tables_check = conn.execute(text("""
                SELECT COUNT(*) FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name IN ('users', 'product_classes', 'evaluation_helps', 'applications')
            """))
            table_count = tables_check.scalar()
            
            if table_count < 4:
                print(f"⚠️  Only {table_count}/4 required tables found")
                return False, f"Missing tables (found {table_count}/4)"
        
        # Use ORM queries which handle enums properly
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        try:
            evaluator_count = db.query(User).filter(User.role == UserRole.EVALUATOR).count()
            class_count = db.query(ProductClass).count()
            help_count = db.query(EvaluationHelp).count()
            
            print(f"📊 Found: {evaluator_count} evaluators, {class_count} classes, {help_count} help entries")
            
            is_initialized = evaluator_count > 0 and class_count > 0 and help_count > 0
            
            if not is_initialized:
                reason = []
                if evaluator_count == 0: reason.append("no evaluators")
                if class_count == 0: reason.append("no product classes") 
                if help_count == 0: reason.append("no evaluation help")
                return False, f"Incomplete data: {', '.join(reason)}"
            
            return True, "Database fully initialized"
            
        finally:
            db.close()
            
    except Exception as e:
        print(f"❌ Error checking database initialization: {e}")
        return False, f"Check failed: {str(e)}"

def ask_user_permission():
    """Ask user if they want to initialize/reset the database"""
    print("\n" + "="*60)
    print("⚠️  DATABASE INITIALIZATION REQUIRED")
    print("="*60)
    print("The database needs to be initialized or is incomplete.")
    print("🚨 WARNING: This will DELETE all existing data!")
    print("\nThis will:")
    print("  - Drop all existing tables")
    print("  - Create new tables")
    print("  - Add default users and test data")
    print("  - Create product classes and evaluation help")
    
    while True:
        response = input("\nDo you want to initialize the database? (yes/no): ").lower().strip()
        if response in ['yes', 'y']:
            return True
        elif response in ['no', 'n']:
            return False
        else:
            print("Please enter 'yes' or 'no'")

def initialize_database():
    """Initialize the PostgreSQL database"""
    print("🚀 Initializing PostgreSQL database...")
    
    try:
        from init_postgres_db import init_postgres_database
        init_postgres_database()
        print("✅ Database initialization completed successfully!")
        return True
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def start_server():
    """Start the FastAPI server"""
    print("🚀 Starting FastAPI server...")
    
    try:
        os.chdir(current_dir)
        subprocess.run([
            sys.executable, "-m", "uvicorn", 
            "app.main:app", 
            "--reload", 
            "--host", "0.0.0.0", 
            "--port", "8000"
        ])
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Failed to start server: {e}")

def main():
    """Main startup routine"""
    print("🔧 ITRC Backend Server Startup (Safe Mode)")
    print("=" * 50)
    
    # Check database connection
    print("🔍 Checking database connection...")
    if not check_database_connection():
        print("❌ Failed to connect to PostgreSQL database")
        print("   Make sure PostgreSQL is running and the connection settings are correct")
        print("   Check app/core/config.py for database URL")
        sys.exit(1)
    
    print("✅ Database connection successful")
    
    # Check if database is initialized
    print("🔍 Checking database initialization...")
    is_initialized, reason = check_database_initialized()
    
    if is_initialized:
        print("✅ Database is already initialized and ready")
    else:
        print(f"⚠️  Database initialization needed: {reason}")
        
        if ask_user_permission():
            if not initialize_database():
                print("❌ Database initialization failed")
                sys.exit(1)
        else:
            print("⚠️  Starting server with uninitialized database")
            print("   Some features may not work properly")
    
    # Start the server
    start_server()

if __name__ == "__main__":
    main() 