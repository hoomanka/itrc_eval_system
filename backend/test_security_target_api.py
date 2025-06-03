#!/usr/bin/env python3
"""Test security target API response"""

import sys
sys.path.append('.')

import json
import requests

def test_security_target_api():
    """Test the security target API endpoint"""
    
    # First login to get a token
    login_data = {
        "email": "evaluator@itrc.ir",
        "password": "eval123"
    }
    
    print("🔐 Logging in...")
    login_response = requests.post("http://localhost:8000/api/auth/login", json=login_data)
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        print(login_response.text)
        return
    
    token_data = login_response.json()
    token = token_data["access_token"]
    print(f"✅ Login successful")
    
    # Test security target endpoint
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test for application ID 1 (we know it exists from debug)
    app_id = 1
    st_url = f"http://localhost:8000/api/security-targets/applications/{app_id}/security-target"
    
    print(f"\n📡 Testing security target API for application {app_id}...")
    print(f"URL: {st_url}")
    
    st_response = requests.get(st_url, headers=headers)
    
    print(f"Status: {st_response.status_code}")
    
    if st_response.status_code == 200:
        data = st_response.json()
        print("✅ API Response successful")
        print(f"📋 Security Target ID: {data.get('id')}")
        print(f"📋 Application ID: {data.get('application_id')}")
        print(f"📋 Class selections count: {len(data.get('class_selections', []))}")
        
        # Check first class selection
        if data.get('class_selections'):
            first_selection = data['class_selections'][0]
            print(f"\n🔍 First class selection:")
            print(f"   ID: {first_selection.get('id')}")
            print(f"   Product Class: {first_selection.get('product_class')}")
            print(f"   Product Subclass: {first_selection.get('product_subclass')}")
            print(f"   Description: {first_selection.get('description', '')[:50]}...")
            print(f"   Status: {first_selection.get('evaluation_status')}")
            
            # Check if product_class has required fields
            product_class = first_selection.get('product_class')
            if product_class:
                print(f"   Class ID: {product_class.get('id')}")
                print(f"   Class Name FA: {product_class.get('name_fa')}")
            else:
                print("   ❌ Product class is missing!")
        
        # Pretty print full response
        print(f"\n📄 Full API Response:")
        print(json.dumps(data, indent=2, ensure_ascii=False))
        
    else:
        print(f"❌ API request failed: {st_response.status_code}")
        print(st_response.text)

if __name__ == "__main__":
    print("🧪 Testing Security Target API...")
    test_security_target_api()
    print("🎉 Test completed!") 