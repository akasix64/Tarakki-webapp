import os
import requests
from dotenv import load_dotenv

load_dotenv()

url = os.getenv('VITE_SUPABASE_URL', '').strip('"')
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY', '').strip('"')

headers = {
    'apikey': key,
    'Authorization': f'Bearer {key}'
}

# Fetch projects
r = requests.get(f"{url}/rest/v1/projects?select=id,title", headers=headers)
if r.status_code == 200:
    print("--- Projects in DB ---")
    for p in r.json():
        print(f"ID: {p['id']} | Title: {p['title']}")
else:
    print(f"Error fetching projects: {r.status_code} - {r.text}")

# Fetch one application to see what it looks like if any exist
r = requests.get(f"{url}/rest/v1/applications?select=*", headers=headers)
if r.status_code == 200:
    apps = r.json()
    print(f"\n--- Applications in DB ({len(apps)}) ---")
    if apps:
        print(apps[0])
else:
    print(f"Error fetching applications: {r.status_code} - {r.text}")
