from datetime import datetime

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.apps import _initialize_firebase_app
from firebase_admin import firestore


class ReviewsByProductView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, product_id: str):
        _initialize_firebase_app()
        db = firestore.client()

        reviews_ref = db.collection('reviews').document(str(product_id)).collection('items')
        items = []
        for snap in reviews_ref.stream():
            data = snap.to_dict() or {}
            data['id'] = snap.id
            items.append(data)

        return Response({'items': items})

    def post(self, request):
        _initialize_firebase_app()
        db = firestore.client()

        uid = request.user.get('uid')
        payload = request.data or {}

        product_id = payload.get('product_id')
        rating = payload.get('rating')
        review_text = payload.get('review_text')

        if not product_id:
            return Response({'error': 'product_id is required'}, status=400)

        if rating is None:
            return Response({'error': 'rating is required'}, status=400)

        # Ensure rating is stored as number if possible
        try:
            rating = float(rating)
        except Exception:
            return Response({'error': 'rating must be a number'}, status=400)

        payload.setdefault('user_id', uid)
        payload.setdefault('created_at', datetime.utcnow().isoformat() + 'Z')

        data = {
            'product_id': str(product_id),
            'user_id': payload['user_id'],
            'rating': rating,
            'review_text': review_text,
            'created_at': payload['created_at'],
        }

        doc_ref = (
            db.collection('reviews')
            .document(str(product_id))
            .collection('items')
            .document()
        )
        doc_ref.set(data)

        return Response({'id': doc_ref.id, 'data': data}, status=201)

