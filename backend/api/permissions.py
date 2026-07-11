from typing import Any

from rest_framework.permissions import BasePermission


def _get_uid_from_request(request) -> str | None:
    user = getattr(request, "user", None)
    if isinstance(user, dict):
        return user.get("uid")
    return None


def _get_decoded_claims(request) -> dict[str, Any]:
    # SupabaseAuthentication returns (user_dict, decoded_claims).
    # DRF stores `user_dict` in request.user and `decoded_claims` in request.auth.
    claims = getattr(request, "auth", None)
    if isinstance(claims, dict):
        return claims

    # Fallback: some setups may embed claims in request.user['claims']
    user = getattr(request, "user", None)
    if isinstance(user, dict) and isinstance(user.get("claims"), dict):
        return user.get("claims")

    return {}


def _is_admin_claims(claims: dict[str, Any]) -> bool:
    # Check Supabase app_metadata role (set via Supabase dashboard or SQL):
    #   UPDATE auth.users SET raw_app_meta_data = '{"role":"admin"}' WHERE id = '<uid>';
    app_metadata = claims.get('app_metadata') or {}
    if app_metadata.get('role') == 'admin':
        return True

    # Legacy fallback: honour old-style custom claims already in token.
    if claims.get('admin') is True:
        return True

    roles = claims.get('roles') or []
    if isinstance(roles, list) and 'admin' in roles:
        return True

    return False


class IsAdminSupabaseUser(BasePermission):
    """Allow only Supabase users whose JWT carries an admin role in app_metadata."""

    message = "Admin privileges required."

    def has_permission(self, request, view) -> bool:
        claims = _get_decoded_claims(request)
        return _is_admin_claims(claims)


# Backwards-compatible alias (used in existing view imports)
IsAdminFirebaseUser = IsAdminSupabaseUser
