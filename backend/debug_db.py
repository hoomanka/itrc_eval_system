#!/usr/bin/env python3
"""
Debug script to check database contents
"""
from app.database import get_db
from app.models import Application, User, ProductType

def debug_database():
    """Check database contents"""
    db = next(get_db())
    
    print("🔍 USERS IN DATABASE:")
    users = db.query(User).all()
    for user in users:
        print(f"  ID: {user.id}, Email: {user.email}, Role: {user.role}")
    
    print("\n📋 APPLICATIONS IN DATABASE:")
    applications = db.query(Application).all()
    for app in applications:
        print(f"  ID: {app.id}, Number: {app.application_number}")
        print(f"    Product: {app.product_name}")
        print(f"    Applicant ID: {app.applicant_id}")
        print(f"    Status: {app.status}")
        print(f"    Created: {app.created_at}")
        print(f"    ---")
    
    print(f"\n📊 SUMMARY:")
    print(f"  Total Users: {len(users)}")
    print(f"  Total Applications: {len(applications)}")
    
    # Check for applicant specifically
    applicant = db.query(User).filter(User.email == "applicant@company.com").first()
    if applicant:
        print(f"\n👤 APPLICANT USER:")
        print(f"  ID: {applicant.id}, Email: {applicant.email}")
        
        applicant_apps = db.query(Application).filter(Application.applicant_id == applicant.id).all()
        print(f"  Applications for this user: {len(applicant_apps)}")
        for app in applicant_apps:
            print(f"    - {app.application_number}: {app.product_name} (Status: {app.status})")
    
    db.close()

if __name__ == "__main__":
    debug_database() 