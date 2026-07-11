from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.db import get_supabase_client


def _get_uid(request) -> str | None:
    return request.user.get('uid') if hasattr(request, 'user') else None


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        supabase = get_supabase_client()

        uid = _get_uid(request)
        if not uid:
            return Response({'error': 'Missing uid'}, status=400)

        res = supabase.table('profiles').select('*').eq('id', uid).execute()
        if not res.data:
            return Response({'profile': {}}, status=200)

        profile = dict(res.data[0])
        return Response({'profile': profile}, status=200)

    def put(self, request):
        supabase = get_supabase_client()

        uid = _get_uid(request)
        if not uid:
            return Response({'error': 'Missing uid'}, status=400)

        payload = dict(request.data or {})
        if not isinstance(payload, dict):
            return Response({'error': 'Invalid JSON body'}, status=400)

        if 'id' in payload and payload['id'] != uid:
            return Response({'error': 'id cannot be changed by client'}, status=400)

        # Addresses are managed via /api/addresses/
        payload.pop('addresses', None)
        # Always link to the authenticated user
        payload['id'] = uid

        res = supabase.table('profiles').upsert(payload).execute()
        row = res.data[0] if res.data else payload

        return Response({'profile': row}, status=200)
