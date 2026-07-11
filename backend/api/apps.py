# Re-export so legacy `from api.apps import get_supabase_client` keeps working.
# The singleton now lives in api.db.
from api.db import get_supabase_client  # noqa: F401

from django.apps import AppConfig


class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'
