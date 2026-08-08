import os
import time
import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    raise ValueError("GEMINI_API_KEY is not configured")

# Primary and fallback model hierarchy using active models for this API key
MODELS_TO_TRY = [
    "gemini-flash-latest",
    "gemini-3.5-flash",
    "gemini-3.6-flash",
    "gemini-2.0-flash",
]

def ask_gemini(prompt: str) -> str:
    last_error = None

    for model_name in MODELS_TO_TRY:
        for attempt in range(2):
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={API_KEY}"
                payload = {
                    "contents": [{"parts": [{"text": prompt}]}]
                }
                headers = {"Content-Type": "application/json"}

                response = requests.post(url, json=payload, headers=headers, timeout=20)

                if response.status_code == 200:
                    data = response.json()
                    if "candidates" in data and len(data["candidates"]) > 0:
                        content = data["candidates"][0].get("content", {})
                        parts = content.get("parts", [])
                        if parts:
                            return parts[0].get("text", "")

                err_str = response.text.lower()
                last_error = Exception(f"HTTP {response.status_code} ({model_name}): {response.text}")

                # Quota / Rate limit (429) or Not Found (404) -> Skip immediately to next model
                if response.status_code in (429, 404) or "quota" in err_str or "exhausted" in err_str or "no longer available" in err_str:
                    print(f"[Gemini] Model {model_name} unavailable ({response.status_code}), trying next model...")
                    break

                # Transient server error (503) -> Retry with short backoff
                if response.status_code == 503 or "unavailable" in err_str or "demand" in err_str:
                    time.sleep(1 + attempt * 1.5)
                    continue

                break

            except requests.exceptions.RequestException as e:
                last_error = e
                time.sleep(1)
                continue

    raise RuntimeError(
        f"Gemini API unavailable across all models. Last error: {str(last_error)}"
    )