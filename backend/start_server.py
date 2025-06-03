#!/usr/bin/env python3
"""
Startup script for ITRC backend server
Initializes PostgreSQL database if needed and starts the FastAPI server
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
        
        with engine.connect() as conn:
            # Check if tables exist first
            tables_check = conn.execute(text("""
                SELECT COUNT(*) FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name IN ('users', 'product_classes', 'evaluation_helps')
            """))
            table_count = tables_check.scalar()
            
            if table_count < 3:
                print(f"⚠️  Only {table_count} required tables found, initialization needed")
                return False
            
            # Check for users using ORM approach to handle enum properly
            try:
                from app.models import User, UserRole, ProductClass, EvaluationHelp
                from sqlalchemy.orm import sessionmaker
                
                SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
                db = SessionLocal()
                
                # Use ORM queries which handle enums properly
                evaluator_count = db.query(User).filter(User.role == UserRole.EVALUATOR).count()
                class_count = db.query(ProductClass).count()
                help_count = db.query(EvaluationHelp).count()
                
                db.close()
                
                print(f"📊 Found: {evaluator_count} evaluators, {class_count} classes, {help_count} help entries")
                
                # Consider initialized if we have evaluators, classes, and help data
                return evaluator_count > 0 and class_count > 0 and help_count > 0
                
            except Exception as orm_error:
                print(f"⚠️  ORM check failed: {orm_error}")
                # Fallback to raw SQL with proper enum casting
                try:
                    result = conn.execute(text("SELECT COUNT(*) FROM users WHERE role::text = 'evaluator'"))
                    evaluator_count = result.scalar()
                    
                    result = conn.execute(text("SELECT COUNT(*) FROM product_classes"))
                    class_count = result.scalar()
                    
                    result = conn.execute(text("SELECT COUNT(*) FROM evaluation_helps"))
                    help_count = result.scalar()
                    
                    print(f"📊 Fallback check - Found: {evaluator_count} evaluators, {class_count} classes, {help_count} help entries")
                    return evaluator_count > 0 and class_count > 0 and help_count > 0
                    
                except Exception as fallback_error:
                    print(f"❌ Fallback check also failed: {fallback_error}")
                    return False
            
    except Exception as e:
        print(f"❌ Error checking database initialization: {e}")
        return False

def initialize_database():
    """Initialize the PostgreSQL database"""
    print("🚀 Initializing PostgreSQL database...")
    
    try:
        # Import and run initialization
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
        # Start uvicorn server
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
    print("🔧 ITRC Backend Server Startup")
    print("=" * 40)
    
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
    if not check_database_initialized():
        print("⚠️  Database not initialized, running initialization...")
        if not initialize_database():
            print("❌ Database initialization failed")
            sys.exit(1)
    else:
        print("✅ Database already initialized")
    
    # Start the server
    start_server()

if __name__ == "__main__":
    main() 