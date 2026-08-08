import os, requests
from dotenv import load_dotenv

load_dotenv()
key = os.getenv("GEMINI_API_KEY")
print(f"API Key found: {'YES' if key else 'NO'}")
if key:
    print(f"Key prefix: {key[:10]}...")

models = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-flash-latest"]
for model in models:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
    payload = {"contents": [{"parts": [{"text": "Reply with just: OK"}]}]}
    try:
        r = requests.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=15)
        if r.status_code == 200:
            text = r.json()["candidates"][0]["content"]["parts"][0]["text"]
            print(f"[{model}] Connected! Response: {text.strip()}")
            break
        else:
            print(f"[{model}] HTTP {r.status_code}: {r.text[:100]}")
    except Exception as e:
        print(f"[{model}] Error: {e}")
