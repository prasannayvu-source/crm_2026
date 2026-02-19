import urllib.request
import urllib.error

try:
    with urllib.request.urlopen("http://localhost:8000/api/v1/health") as response:
        print(f"Status: {response.status}")
        print(response.read().decode('utf-8'))
except urllib.error.URLError as e:
    print(f"Error: {e}")
except Exception as e:
    print(f"Unexpected error: {e}")
