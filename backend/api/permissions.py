from typing import Any

from rest_framework.permissions import BasePermission

from api.apps import _initialize_firebase_app


def _get_uid_from_request(request) -> str | None:
    user = getattr(request, "user", None)
    if isinstance(user, dict):
        return user.get("uid")
    return None


def _get_decoded_claims(request) -> dict[str, Any]:
    # FirebaseAuthentication returns (user_dict, decoded_claims).
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
    # Common custom-claim patterns:
    # - {"admin": true}
    # - {"roles": ["admin", ...]}
    if claims.get("admin") is True:
        return True

    roles = claims.get("roles") or []
    if isinstance(roles, list) and "admin" in roles:
        return True

    return False


class IsAdminFirebaseUser(BasePermission):
    """Allow only Firebase users with admin custom claim (or roles)."""

    message = "Admin privileges required."

    def has_permission(self, request, view) -> bool:
        _initialize_firebase_app()
        claims = _get_decoded_claims(request)
        return _is_admin_claims(claims)


