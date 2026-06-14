from pathlib import Path

import firebase_admin
from firebase_admin import credentials

from django.apps import AppConfig


BACKEND_DIR = Path(__file__).resolve().parents[1]
FIREBASE_ADMIN_SDK_PATH = BACKEND_DIR / "firebase-admin-sdk.json"




def _initialize_firebase_app() -> None:
    """Initialize Firebase Admin SDK once per process using local service account JSON."""
    if firebase_admin._apps:
        return

    if not FIREBASE_ADMIN_SDK_PATH.exists():
        raise RuntimeError(
            f"Firebase service account JSON not found at: {FIREBASE_ADMIN_SDK_PATH}"
        )

    # The Admin SDK expects a valid Google service account JSON.
    # The JSON must contain fields like `type`, `project_id`, `private_key`, etc.
    firebase_admin.initialize_app(
        credential=credentials.Certificate(str(FIREBASE_ADMIN_SDK_PATH))
    )



class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'


