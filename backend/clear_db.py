#!/usr/bin/env python3
"""
Script to clear all tables in the database while preserving their structure
"""

import psycopg2
from app.core.config import settings
from urllib.parse import urlparse

def clear_tables():
    """Clear all tables in the database."""
    try:
        # Parse the DATABASE_URL using urlparse
        parsed = urlparse(settings.DATABASE_URL)
        
        # Extract connection details
        dbname = parsed.path[1:]  # Remove leading slash
        user = parsed.username
        password = parsed.password
        host = parsed.hostname
        port = parsed.port or 5432  # Default PostgreSQL port

        # Connect to the database
        conn = psycopg2.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            database=dbname
        )
        conn.autocommit = True
        cursor = conn.cursor()

        # Read and execute the SQL file
        with open('clear_tables.sql', 'r') as sql_file:
            sql_commands = sql_file.read()
            for command in sql_commands.split(';'):
                if command.strip():
                    cursor.execute(command)

        print("✅ All tables cleared successfully")
        print("🔄 Sequences have been reset")

    except Exception as e:
        print(f"❌ Error clearing tables: {str(e)}")
        raise
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    clear_tables() 