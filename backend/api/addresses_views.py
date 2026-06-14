from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.apps import _initialize_firebase_app
from firebase_admin import firestore


def _get_uid(request) -> str | None:
    return request.user.get('uid') if hasattr(request, 'user') else None


def _is_non_empty_string(v) -> bool:
    return isinstance(v, str) and v.strip() != ""


def _validate_address_payload(payload: dict, *, require_fields: bool = True):
    if not isinstance(payload, dict):
        return Response({'error': 'Invalid JSON body'}, status=400)

    # Minimal required fields; extend to match your frontend.
    required_fields = ['id', 'full_name', 'phone', 'address_line1', 'city', 'state', 'postal_code', 'country']

    if require_fields:
        missing = [f for f in required_fields if f not in payload or payload[f] in (None, '')]
        if missing:
            return Response({'error': f"Missing required fields: {missing}"}, status=400)

    # Never allow client to set uid
    payload.pop('uid', None)

    # Validate id
    if 'id' in payload and not _is_non_empty_string(payload['id']):
        return Response({'error': 'id must be a non-empty string'}, status=400)

    # Validate other required fields if present
    for f in required_fields:
        if f in payload and not _is_non_empty_string(payload[f]):
            return Response({'error': f"{f} must be a non-empty string"}, status=400)

    return None


class AddressesView(APIView):
    """GET /api/addresses/ (list)

    POST /api/addresses/ (create)
    POST uses payload.id as document id.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        _initialize_firebase_app()
        db = firestore.client()

        uid = _get_uid(request)
        if not uid:
            return Response({'error': 'Missing uid'}, status=400)

        col = db.collection('users').document(uid).collection('addresses')

        items = []
        for snap in col.stream():
            data = snap.to_dict() or {}
            data['id'] = snap.id
            items.append(data)

        # Optional: identify default
        default_id = None
        for a in items:
            if a.get('is_default') is True:
                default_id = a.get('id')
                break

        return Response({'items': items, 'default_id': default_id})

    def post(self, request):
        _initialize_firebase_app()
        db = firestore.client()

        uid = _get_uid(request)
        if not uid:
            return Response({'error': 'Missing uid'}, status=400)

        payload = request.data or {}
        validation_error = _validate_address_payload(payload, require_fields=True)
        if validation_error:
            return validation_error

        addr_id = payload['id']
        doc_ref = db.collection('users').document(uid).collection('addresses').document(str(addr_id))

        if doc_ref.get().exists:
            return Response({'error': 'Duplicate address id'}, status=409)

        # If address is default, unset others (best-effort).
        is_default = bool(payload.get('is_default', False))

        if is_default:
            existing = db.collection('users').document(uid).collection('addresses')
            for snap in existing.stream():
                existing.document(snap.id).set({'is_default': False}, merge=True)

        payload['uid'] = uid
        payload.pop('uid', None)
        # Ensure we store doc id consistently too
        payload['id'] = str(addr_id)

        doc_ref.set(payload)
        return Response({'created': True, 'address': payload}, status=201)


class AddressDetailView(APIView):
    """GET/PUT/DELETE /api/addresses/{id}"""

    permission_classes = [IsAuthenticated]

    def get(self, request, id: str):
        _initialize_firebase_app()
        db = firestore.client()

        uid = _get_uid(request)
        if not uid:
            return Response({'error': 'Missing uid'}, status=400)

        doc_ref = db.collection('users').document(uid).collection('addresses').document(str(id))
        snap = doc_ref.get()
        if not snap.exists:
            return Response({'error': 'Not found'}, status=404)

        data = snap.to_dict() or {}
        data['id'] = snap.id
        return Response({'address': data}, status=200)

    def put(self, request, id: str):
        _initialize_firebase_app()
        db = firestore.client()

        uid = _get_uid(request)
        if not uid:
            return Response({'error': 'Missing uid'}, status=400)

        payload = request.data or {}
        if not isinstance(payload, dict):
            return Response({'error': 'Invalid JSON body'}, status=400)

        # For updates, allow partial fields but require non-empty strings for any provided fields.
        # Also prevent id mismatch.
        if 'id' in payload and str(payload['id']) != str(id):
            return Response({'error': 'id in body must match URL id'}, status=400)

        required_fields = ['full_name', 'phone', 'address_line1', 'city', 'state', 'postal_code', 'country']
        for f in required_fields:
            if f in payload and not _is_non_empty_string(payload[f]):
                return Response({'error': f"{f} must be a non-empty string"}, status=400)

        payload.pop('uid', None)

        doc_ref = db.collection('users').document(uid).collection('addresses').document(str(id))
        if not doc_ref.get().exists:
            return Response({'error': 'Not found'}, status=404)

        is_default = bool(payload.get('is_default', None))
        if payload.get('is_default') is True:
            # Unset other defaults
            existing = db.collection('users').document(uid).collection('addresses')
            for snap in existing.stream():
                if snap.id != str(id):
                    existing.document(snap.id).set({'is_default': False}, merge=True)

        payload['id'] = str(id)
        doc_ref.set(payload, merge=True)
        snap = doc_ref.get()
        data = snap.to_dict() or {}
        data['id'] = snap.id
        return Response({'updated': True, 'address': data}, status=200)

    def delete(self, request, id: str):
        _initialize_firebase_app()
        db = firestore.client()

        uid = _get_uid(request)
        if not uid:
            return Response({'error': 'Missing uid'}, status=400)

        doc_ref = db.collection('users').document(uid).collection('addresses').document(str(id))
        snap = doc_ref.get()
        if not snap.exists:
            return Response({'error': 'Not found'}, status=404)

        doc_ref.delete()
        return Response({'deleted': True, 'id': str(id)}, status=204)

