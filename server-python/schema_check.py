import os
import requests
from dotenv import load_dotenv

load_dotenv()
url = os.getenv('VITE_SUPABASE_URL', '').strip('"')
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY', '').strip('"')
headers = {'apikey': key}

r = requests.get(f"{url}/rest/v1/", headers=headers)
defs = r.json().get('definitions', {})

for t in ['applications', 'bids', 'profiles', 'projects']:
    if t in defs:
        print(f"\n[{t}]")
        for k, v in defs[t]['properties'].items():
            if k in ['project_id', 'user_id', 'id']:
                print(f"  {k}: {v.get('format', v.get('type'))}")
