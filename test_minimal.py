import urllib.request
import urllib.error

def test_minimal():
    print("🔍 Testing minimal server on port 8002...")
    
    try:
        # Test root endpoint
        print("\n1. Testing root endpoint...")
        with urllib.request.urlopen('http://127.0.0.1:8002/', timeout=5) as response:
            data = response.read().decode('utf-8')
            print(f"Status: {response.status}")
            print(f"Response: {data}")
        
        # Test /test endpoint
        print("\n2. Testing /test endpoint...")
        with urllib.request.urlopen('http://127.0.0.1:8002/test', timeout=5) as response:
            data = response.read().decode('utf-8')
            print(f"Status: {response.status}")
            print(f"Response: {data}")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_minimal() 