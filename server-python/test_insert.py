import os
import requests
from dotenv import load_dotenv

load_dotenv()

url = os.getenv('VITE_SUPABASE_URL', '').strip('"')
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY', '').strip('"')

headers = {
    'apikey': key,
    'Authorization': f'Bearer {key}',
    'Prefer': 'return=representation'
}

# Try to insert a row with a fake project_id
data = {
    "user_id": "2f3ce29a-3677-4584-855f-83670104190c", # Use a real user ID from my earlier check
    "project_id": "1",
    "status": "pending",
    "cover_letter": "test",
    "expected_rate": "100",
    "availability": "now"
}

r = requests.post(f"{url}/rest/v1/applications", headers=headers, json=[data])
print(f"Status: {r.status_code}")
print(f"Body: {r.text}")
