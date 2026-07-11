import os

import jwt
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed


class SupabaseAuthentication(BaseAuthentication):
    """Verify Supabase JWT from Authorization: Bearer <token>.

    Uses stateless local verification with SUPABASE_JWT_SECRET (HS256),
    which avoids a round-trip to Supabase on every request.
    """

    keyword = 'Bearer'

    def authenticate(self, request):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header:
            return None

        parts = auth_header.split()
        if len(parts) != 2 or parts[0] != self.keyword:
            raise AuthenticationFailed(
                'Invalid Authorization header format. Use: Bearer <token>.'
            )

        token = parts[1]
        jwt_secret = os.environ.get('SUPABASE_JWT_SECRET')
        if not jwt_secret:
            raise AuthenticationFailed(
                'SUPABASE_JWT_SECRET environment variable is not set on the server.'
            )

        try:
            # Supabase signs access tokens with HS256; audience is always "authenticated".
            decoded = jwt.decode(
                token,
                jwt_secret,
                algorithms=['HS256'],
                audience='authenticated',
            )
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token has expired.')
        except jwt.InvalidTokenError as exc:
            raise AuthenticationFailed(f'Invalid token: {exc}')

        # `sub` holds the Supabase auth user UUID.
        user = {
            'uid': decoded.get('sub'),
            'email': decoded.get('email'),
            'claims': decoded,
        }
        return (user, decoded)
