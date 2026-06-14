from datetime import datetime

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.apps import _initialize_firebase_app

import firebase_admin
from firebase_admin import firestore


class HealthView(APIView):

    permission_classes = []

    def get(self, request):
        return Response({'status': 'ok', 'time': datetime.utcnow().isoformat() + 'Z'})


class FirestoreTestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Creates a test doc in Firestore under `api_test/<uid>/last_write`."""
        _initialize_firebase_app()

        db = firestore.client()

        uid = request.user.get('uid') if hasattr(request, 'user') else None
        if not uid:
            return Response({'error': 'Missing uid in request.user'}, status=400)

        payload = request.data or {}
        now = datetime.utcnow().isoformat() + 'Z'

        doc_ref = db.collection('api_test').document(uid).collection('last_write').document('doc')
        doc_ref.set({'server_time': now, 'payload': payload, 'uid': uid})

        # Read back
        snap = doc_ref.get()
        return Response({'saved': True, 'data': snap.to_dict() if snap.exists else None})

