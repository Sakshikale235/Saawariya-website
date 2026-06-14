from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.apps import _initialize_firebase_app
from firebase_admin import firestore


def _get_uid(request) -> str | None:
    return request.user.get('uid') if hasattr(request, 'user') else None


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        _initialize_firebase_app()
        db = firestore.client()

        uid = _get_uid(request)
        if not uid:
            return Response({'error': 'Missing uid'}, status=400)

        doc_ref = db.collection('users').document(uid)
        snap = doc_ref.get()
        if not snap.exists:
            return Response({'profile': {}}, status=200)

        data = snap.to_dict() or {}
        data.pop('addresses', None)  # keep addresses separate
        return Response({'profile': data}, status=200)

    def put(self, request):
        _initialize_firebase_app()
        db = firestore.client()

        uid = _get_uid(request)
        if not uid:
            return Response({'error': 'Missing uid'}, status=400)

        payload = request.data or {}
        if not isinstance(payload, dict):
            return Response({'error': 'Invalid JSON body'}, status=400)

        # Basic required-field validation (extend as needed)
        # Current schema is flexible, but we prevent setting uid.
        if 'uid' in payload:
            return Response({'error': 'uid cannot be set by client'}, status=400)

        payload.pop('addresses', None)  # client updates addresses via /api/addresses

        doc_ref = db.collection('users').document(uid)
        doc_ref.set(payload, merge=True)

        return Response({'profile': payload}, status=200)

