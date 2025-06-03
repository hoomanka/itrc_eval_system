import urllib.request
import urllib.error

def test_api():
    print("🔍 Testing API connection on port 8001...")
    
    try:
        # Test 1: Root endpoint
        print("\n1. Testing root endpoint...")
        with urllib.request.urlopen('http://127.0.0.1:8001/', timeout=5) as response:
            data = response.read().decode('utf-8')
            print(f"Status: {response.status}")
            print(f"Response: {data}")
        
        # Test 2: Applications endpoint with auth
        print("\n2. Testing applications endpoint with auth...")
        req = urllib.request.Request('http://127.0.0.1:8001/api/applications/1')
        req.add_header('Authorization', 'Bearer test-token')
        try:
            with urllib.request.urlopen(req, timeout=5) as response:
                data = response.read().decode('utf-8')
                print(f"Status: {response.status}")
                print(f"Response: {data}")
        except urllib.error.HTTPError as e:
            print(f"HTTP Error: {e.code}")
            print(f"Response: {e.read().decode('utf-8')}")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_api() 