from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.db import get_supabase_client


def _get_uid(request) -> str | None:
    return request.user.get('uid') if hasattr(request, 'user') else None


def _is_non_empty_string(v) -> bool:
    return isinstance(v, str) and v.strip() != ""


def _validate_address_payload(payload: dict, *, require_fields: bool = True):
    if not isinstance(payload, dict):
        return Response({'error': 'Invalid JSON body'}, status=400)

    required_fields = ['id', 'full_name', 'phone', 'address_line1', 'city', 'state', 'postal_code', 'country']

    if require_fields:
        missing = [f for f in required_fields if f not in payload or payload[f] in (None, '')]
        if missing:
            return Response({'error': f"Missing required fields: {missing}"}, status=400)

    payload.pop('uid', None)
    payload.pop('profile_id', None)  # will be set server-side

    if 'id' in payload and not _is_non_empty_string(payload['id']):
        return Response({'error': 'id must be a non-empty string'}, status=400)

    for f in required_fields:
        if f in payload and not _is_non_empty_string(payload[f]):
            return Response({'error': f"{f} must be a non-empty string"}, status=400)

    return None


class AddressesView(APIView):
    """GET /api/addresses/  (list)  |  POST /api/addresses/  (create)"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        supabase = get_supabase_client()

        uid = _get_uid(request)
        if not uid:
            return Response({'error': 'Missing uid'}, status=400)

        res = supabase.table('addresses').select('*').eq('profile_id', uid).execute()
        items = res.data or []

        default_id = next((a.get('id') for a in items if a.get('is_default') is True), None)
        return Response({'items': items, 'default_id': default_id})

    def post(self, request):
        supabase = get_supabase_client()

        uid = _get_uid(request)
        if not uid:
            return Response({'error': 'Missing uid'}, status=400)

        payload = dict(request.data or {})
        validation_error = _validate_address_payload(payload, require_fields=True)
        if validation_error:
            return validation_error

        addr_id = str(payload['id'])

        # Duplicate check
        check = supabase.table('addresses').select('id').eq('id', addr_id).execute()
        if check.data:
            return Response({'error': 'Duplicate address id'}, status=409)

        # If marking as default, unset all other defaults for this user
        if payload.get('is_default'):
            supabase.table('addresses').update({'is_default': False}).eq('profile_id', uid).execute()

        payload['id'] = addr_id
        payload['profile_id'] = uid

        res = supabase.table('addresses').insert(payload).execute()
        row = res.data[0] if res.data else payload
        return Response({'created': True, 'address': row}, status=201)


class AddressDetailView(APIView):
    """GET / PUT / DELETE /api/addresses/{id}/"""

    permission_classes = [IsAuthenticated]

    def get(self, request, id: str):
        supabase = get_supabase_client()

        uid = _get_uid(request)
        if not uid:
            return Response({'error': 'Missing uid'}, status=400)

        res = supabase.table('addresses').select('*').eq('id', id).eq('profile_id', uid).execute()
        if not res.data:
            return Response({'error': 'Not found'}, status=404)

        return Response({'address': res.data[0]}, status=200)

    def put(self, request, id: str):
        supabase = get_supabase_client()

        uid = _get_uid(request)
        if not uid:
            return Response({'error': 'Missing uid'}, status=400)

        payload = dict(request.data or {})
        if not isinstance(payload, dict):
            return Response({'error': 'Invalid JSON body'}, status=400)

        if 'id' in payload and str(payload['id']) != str(id):
            return Response({'error': 'id in body must match URL id'}, status=400)

        required_fields = ['full_name', 'phone', 'address_line1', 'city', 'state', 'postal_code', 'country']
        for f in required_fields:
            if f in payload and not _is_non_empty_string(payload[f]):
                return Response({'error': f"{f} must be a non-empty string"}, status=400)

        payload.pop('uid', None)
        payload.pop('profile_id', None)

        # Verify ownership
        check = supabase.table('addresses').select('id').eq('id', id).eq('profile_id', uid).execute()
        if not check.data:
            return Response({'error': 'Not found'}, status=404)

        # Unset other defaults if needed
        if payload.get('is_default') is True:
            supabase.table('addresses').update({'is_default': False}).eq('profile_id', uid).neq('id', id).execute()

        payload['id'] = str(id)
        res = supabase.table('addresses').update(payload).eq('id', id).eq('profile_id', uid).execute()
        row = res.data[0] if res.data else payload
        return Response({'updated': True, 'address': row}, status=200)

    def delete(self, request, id: str):
        supabase = get_supabase_client()

        uid = _get_uid(request)
        if not uid:
            return Response({'error': 'Missing uid'}, status=400)

        check = supabase.table('addresses').select('id').eq('id', id).eq('profile_id', uid).execute()
        if not check.data:
            return Response({'error': 'Not found'}, status=404)

        supabase.table('addresses').delete().eq('id', id).eq('profile_id', uid).execute()
        return Response({'deleted': True, 'id': str(id)}, status=204)
