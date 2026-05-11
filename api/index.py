import sys
import os

# Add the backend directory to the sys.path so we can import from 'app'
# This allows 'from app.main import app' to work correctly
backend_path = os.path.join(os.path.dirname(__file__), "..", "backend")
sys.path.append(backend_path)

# Import the FastAPI app
from app.main import app

# Vercel needs the app object to be named 'app' by default or configured
# In our case, app is already named 'app'
