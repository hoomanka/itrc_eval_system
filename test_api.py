import requests
import json

def test_api():
    print("🔍 Testing API connection...")
    
    try:
        # Test 1: Root endpoint
        print("\n1. Testing root endpoint...")
        r = requests.get('http://127.0.0.1:8000/', timeout=5)
        print(f"Status: {r.status_code}")
        print(f"Response: {r.text}")
        
        # Test 2: Applications endpoint (should get 401)
        print("\n2. Testing applications endpoint...")
        r2 = requests.get('http://127.0.0.1:8000/api/applications/1', timeout=5)
        print(f"Status: {r2.status_code}")
        print(f"Response: {r2.text}")
        
        # Test 3: With auth header
        print("\n3. Testing with auth header...")
        headers = {"Authorization": "Bearer test-token"}
        r3 = requests.get('http://127.0.0.1:8000/api/applications/1', headers=headers, timeout=5)
        print(f"Status: {r3.status_code}")
        print(f"Response: {r3.text}")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_api() 