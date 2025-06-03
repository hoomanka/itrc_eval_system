#!/usr/bin/env python3
"""Quick authentication test script"""

import requests
import json

def test_auth():
    """Test authentication endpoints"""
    print("🧪 Quick Authentication Test")
    print("=" * 40)
    
    # Test accounts to try
    test_accounts = [
        {"email": "evaluator@itrc.ir", "password": "eval123", "role": "evaluator"},
        {"email": "applicant@company.com", "password": "app123", "role": "applicant"},
        {"email": "admin@itrc.ir", "password": "admin123", "role": "admin"},
    ]
    
    for account in test_accounts:
        print(f"\n🔐 Testing {account['role']}: {account['email']}")
        
        try:
            response = requests.post(
                "http://localhost:8000/api/auth/login",
                json={"email": account["email"], "password": account["password"]},
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Login successful")
                print(f"   User: {data['user']['full_name']}")
                print(f"   Role: {data['user']['role']}")
                print(f"   Token: {data['access_token'][:20]}...")
            else:
                print(f"❌ Login failed: {response.status_code}")
                print(f"   Error: {response.text}")
                
        except requests.exceptions.ConnectionError:
            print(f"❌ Connection error - make sure backend server is running on http://localhost:8000")
            break
        except Exception as e:
            print(f"❌ Error: {e}")
    
    print(f"\n🔍 Testing server health...")
    try:
        response = requests.get("http://localhost:8000/health")
        if response.status_code == 200:
            print("✅ Server is running and healthy")
        else:
            print(f"⚠️  Server responded with status: {response.status_code}")
    except Exception as e:
        print(f"❌ Server health check failed: {e}")

if __name__ == "__main__":
    test_auth() 