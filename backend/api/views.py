from datetime import datetime

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.db import get_supabase_client


class HealthView(APIView):

    permission_classes = []

    def get(self, request):
        return Response({'status': 'ok', 'time': datetime.utcnow().isoformat() + 'Z'})


class SupabaseTestView(APIView):
    """POST a test row to the `api_test` table (requires auth).

    Replaces FirestoreTestView. Run the following SQL in Supabase dashboard first:
        CREATE TABLE IF NOT EXISTS api_test (
          id BIGSERIAL PRIMARY KEY,
          uid UUID,
          payload JSONB,
          server_time TIMESTAMPTZ DEFAULT NOW()
        );
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        supabase = get_supabase_client()

        uid = request.user.get('uid')
        if not uid:
            return Response({'error': 'Missing uid in request.user'}, status=400)

        payload = request.data or {}
        now = datetime.utcnow().isoformat() + 'Z'

        res = supabase.table('api_test').insert({
            'uid': uid,
            'payload': payload,
            'server_time': now,
        }).execute()

        return Response({'saved': True, 'data': res.data[0] if res.data else None})


# Backwards-compatible alias so existing URL config referencing FirestoreTestView still works.
FirestoreTestView = SupabaseTestView
