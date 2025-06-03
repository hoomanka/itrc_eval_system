#!/usr/bin/env python3
"""
Simple server startup script - no database checks or initialization
Use this when you want to start the server with existing database
"""

import os
import sys
import subprocess
from pathlib import Path

def main():
    """Start the FastAPI server without any database operations"""
    print("🚀 Starting ITRC Backend Server (Database Preserved)")
    print("=" * 55)
    
    current_dir = Path(__file__).parent
    os.chdir(current_dir)
    
    try:
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

if __name__ == "__main__":
    main() 