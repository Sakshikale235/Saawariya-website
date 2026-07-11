"""db.py – Shared Supabase admin client helper.

Import `get_supabase_client` from this module anywhere you need a
service-role Supabase client.

Usage:
    from api.db import get_supabase_client

    supabase = get_supabase_client()
    res = supabase.table('products').select('*').execute()
"""

import os

from supabase import Client, create_client

_supabase_client: Client | None = None


def get_supabase_client() -> Client:
    """Return a lazily-initialised Supabase service-role client (process-wide singleton).

    Reads SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (falling back to
    SUPABASE_KEY) from the environment.  Raises RuntimeError if either
    variable is absent.
    """
    global _supabase_client
    if _supabase_client is None:
        url = os.environ.get("SUPABASE_URL")
        key = (
            os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
            or os.environ.get("SUPABASE_KEY")
        )
        if not url or not key:
            raise RuntimeError(
                "Missing required environment variables: "
                "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must both be set."
            )
        _supabase_client = create_client(url, key)
    return _supabase_client
