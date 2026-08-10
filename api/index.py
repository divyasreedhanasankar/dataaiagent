"""
Vercel Python serverless function entry point.

Adds backend/ to sys.path so all existing backend imports work correctly,
then re-exports the FastAPI app for Vercel's @vercel/python runtime.

No application code is changed — this is deployment wiring only.
"""
import sys
import os

# Add backend/ directory to Python path so "from app.* import ..." works exactly
# as it does when uvicorn is launched from inside the backend/ directory.
_backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "backend")
sys.path.insert(0, _backend_dir)

# Import the FastAPI app — this is the same app that runs locally via uvicorn
from main import app  # noqa: E402, F401
