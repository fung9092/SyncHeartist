import requests
import json

url = "http://127.0.0.1:3000/api/generate"
payload = {
#cd . && cd /Users/fung9092/syncheartist && npx prisma db push 2>&1
",
    "cost": 5
}
headers = {
    "Content-Type": "application/json"
}

try:
    response = requests.post(url, data=json.dumps(payload), headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
