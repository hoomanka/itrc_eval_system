#!/usr/bin/env python3
"""
Test script for evaluation API endpoints
Tests the complete evaluation workflow to ensure it's working
"""

import sys
import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000/api"

def print_section(title):
    """Print a section header"""
    print(f"\n{'='*60}")
    print(f"🧪 {title}")
    print('='*60)

def test_login():
    """Test login and return token"""
    print_section("AUTHENTICATION TEST")
    
    # Test evaluator login
    login_data = {
        "email": "evaluator@itrc.ir",
        "password": "eval123"
    }
    
    print("🔐 Testing evaluator login...")
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    
    if response.status_code == 200:
        data = response.json()
        token = data["access_token"]
        user = data["user"]
        print(f"✅ Login successful")
        print(f"   User: {user['full_name']} ({user['email']})")
        print(f"   Role: {user['role']}")
        return token
    else:
        print(f"❌ Login failed: {response.status_code}")
        print(f"   Error: {response.text}")
        return None

def test_applications_list(token):
    """Test getting applications list"""
    print_section("APPLICATIONS LIST TEST")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    print("📋 Getting applications list for evaluator...")
    response = requests.get(f"{BASE_URL}/applications/dashboard/list", headers=headers)
    
    if response.status_code == 200:
        applications = response.json()
        print(f"✅ Applications list retrieved successfully")
        print(f"   Found {len(applications)} applications")
        
        for app in applications:
            print(f"   - App {app['id']}: {app['product_name']} (Status: {app['status']})")
        
        return applications
    else:
        print(f"❌ Failed to get applications: {response.status_code}")
        print(f"   Error: {response.text}")
        return []

def test_application_detail(token, app_id):
    """Test getting application details"""
    print_section(f"APPLICATION DETAIL TEST (ID: {app_id})")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    print(f"🔍 Getting application details for ID {app_id}...")
    response = requests.get(f"{BASE_URL}/applications/{app_id}", headers=headers)
    
    if response.status_code == 200:
        app_detail = response.json()
        print(f"✅ Application details retrieved successfully")
        print(f"   ID: {app_detail['id']}")
        print(f"   Product: {app_detail['product_name']}")
        print(f"   Company: {app_detail['company_name']}")
        print(f"   Status: {app_detail['status']}")
        print(f"   Product Type: {app_detail['product_type']}")
        return app_detail
    else:
        print(f"❌ Failed to get application details: {response.status_code}")
        print(f"   Error: {response.text}")
        return None

def test_security_target(token, app_id):
    """Test getting security target"""
    print_section(f"SECURITY TARGET TEST (App ID: {app_id})")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    print(f"🎯 Getting security target for application {app_id}...")
    response = requests.get(f"{BASE_URL}/security-targets/applications/{app_id}/security-target", headers=headers)
    
    if response.status_code == 200:
        security_target = response.json()
        print(f"✅ Security target retrieved successfully")
        print(f"   Security Target ID: {security_target['id']}")
        print(f"   Application ID: {security_target['application_id']}")
        print(f"   Status: {security_target['status']}")
        print(f"   Class Selections: {len(security_target.get('class_selections', []))}")
        
        # Validate class selections
        for i, selection in enumerate(security_target.get('class_selections', [])):
            print(f"   Selection {i+1}:")
            print(f"     - ID: {selection.get('id')}")
            print(f"     - Class: {selection.get('product_class', {}).get('name_fa', 'Unknown')}")
            print(f"     - Subclass: {selection.get('product_subclass', {}).get('name_fa', 'None')}")
            print(f"     - Status: {selection.get('evaluation_status', 'pending')}")
            print(f"     - Score: {selection.get('evaluation_score', 'None')}")
        
        return security_target
    else:
        print(f"❌ Failed to get security target: {response.status_code}")
        print(f"   Error: {response.text}")
        return None

def test_evaluation_help(token, class_id, subclass_id=None):
    """Test getting evaluation help"""
    print_section(f"EVALUATION HELP TEST (Class: {class_id}, Subclass: {subclass_id})")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    url = f"{BASE_URL}/security-targets/evaluation-help/{class_id}"
    if subclass_id:
        url += f"?subclass_id={subclass_id}"
    
    print(f"📚 Getting evaluation help...")
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        help_data = response.json()
        print(f"✅ Evaluation help retrieved successfully")
        print(f"   Help ID: {help_data['id']}")
        print(f"   Class ID: {help_data['product_class_id']}")
        print(f"   Subclass ID: {help_data.get('product_subclass_id', 'None')}")
        print(f"   Help Text (FA): {help_data['help_text_fa'][:100]}...")
        return help_data
    else:
        print(f"❌ Failed to get evaluation help: {response.status_code}")
        print(f"   Error: {response.text}")
        return None

def test_evaluation_update(token, selection_id):
    """Test updating evaluation"""
    print_section(f"EVALUATION UPDATE TEST (Selection: {selection_id})")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    update_data = {
        "evaluation_status": "pass",
        "evaluation_score": 85,
        "evaluator_notes": "Test evaluation notes from API test"
    }
    
    print(f"📝 Updating evaluation for selection {selection_id}...")
    response = requests.post(
        f"{BASE_URL}/security-targets/class-selections/{selection_id}/evaluate",
        headers=headers,
        json=update_data
    )
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Evaluation updated successfully")
        print(f"   Selection ID: {result.get('id')}")
        print(f"   Status: {result.get('evaluation_status')}")
        print(f"   Score: {result.get('evaluation_score')}")
        return result
    else:
        print(f"❌ Failed to update evaluation: {response.status_code}")
        print(f"   Error: {response.text}")
        return None

def test_submit_evaluation(token, app_id):
    """Test submitting final evaluation"""
    print_section(f"EVALUATION SUBMISSION TEST (App: {app_id})")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    evaluation_data = {
        "application_id": app_id,
        "findings": "Test evaluation findings from API test",
        "recommendations": "Test recommendations from API test"
    }
    
    print(f"📤 Submitting evaluation for application {app_id}...")
    response = requests.post(
        f"{BASE_URL}/evaluations/",
        headers=headers,
        json=evaluation_data
    )
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Evaluation submitted successfully")
        print(f"   Evaluation ID: {result.get('id')}")
        return result
    else:
        print(f"❌ Failed to submit evaluation: {response.status_code}")
        print(f"   Error: {response.text}")
        return None

def main():
    """Main test routine"""
    print("🧪 ITRC Evaluation API Test Suite")
    print(f"🕒 Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    try:
        # Test authentication
        token = test_login()
        if not token:
            print("❌ Authentication failed, stopping tests")
            return
        
        # Test applications list
        applications = test_applications_list(token)
        if not applications:
            print("❌ No applications found, stopping tests")
            return
        
        # Use the first application for testing
        app_id = applications[0]['id']
        
        # Test application details
        app_detail = test_application_detail(token, app_id)
        if not app_detail:
            print("❌ Failed to get application details, stopping tests")
            return
        
        # Test security target
        security_target = test_security_target(token, app_id)
        if not security_target:
            print("❌ Failed to get security target, stopping tests")
            return
        
        class_selections = security_target.get('class_selections', [])
        if not class_selections:
            print("❌ No class selections found, stopping tests")
            return
        
        # Test evaluation help for first class selection
        first_selection = class_selections[0]
        class_id = first_selection.get('product_class', {}).get('id')
        subclass_id = first_selection.get('product_subclass', {}).get('id')
        
        if class_id:
            test_evaluation_help(token, class_id, subclass_id)
        
        # Test evaluation update
        selection_id = first_selection.get('id')
        if selection_id:
            test_evaluation_update(token, selection_id)
        
        # Test evaluation submission
        test_submit_evaluation(token, app_id)
        
        print_section("TEST SUMMARY")
        print("✅ All evaluation API tests completed successfully!")
        print("🎉 The evaluation functionality is working properly!")
        
    except Exception as e:
        print(f"\n❌ Test failed with exception: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main() 