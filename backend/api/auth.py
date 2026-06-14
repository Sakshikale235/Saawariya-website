from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

from firebase_admin import auth as firebase_auth

from api.apps import _initialize_firebase_app


class FirebaseAuthentication(BaseAuthentication):
    """Verify Firebase ID token from Authorization: Bearer <token>."""

    keyword = 'Bearer'

    def authenticate(self, request):
        _initialize_firebase_app()


        auth_header = request.headers.get('Authorization', '')
        if not auth_header:
            return None

        parts = auth_header.split()
        if len(parts) != 2 or parts[0] != self.keyword:
            raise AuthenticationFailed('Invalid Authorization header format. Use: Bearer <token>.')

        token = parts[1]
        try:
            decoded = firebase_auth.verify_id_token(token)
        except Exception as exc:
            raise AuthenticationFailed(f'Invalid or expired Firebase token: {exc}')

        # Attach user info to request; DRF expects a tuple (user, auth)
        # Use a lightweight dict-like object
        user = {
            'uid': decoded.get('uid'),
            'email': decoded.get('email'),
            'claims': decoded,
        }
        return (user, decoded)

