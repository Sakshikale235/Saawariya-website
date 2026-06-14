from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.apps import _initialize_firebase_app
from firebase_admin import firestore


class WishlistView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        _initialize_firebase_app()
        db = firestore.client()

        uid = request.user.get('uid')
        items_ref = db.collection('wishlists').document(uid).collection('items')

        items = []
        for snap in items_ref.stream():
            data = snap.to_dict() or {}
            data['product_id'] = snap.id
            items.append(data)

        return Response({'items': items})


class WishlistAddView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        _initialize_firebase_app()
        db = firestore.client()

        uid = request.user.get('uid')
        product_id = (request.data or {}).get('product_id')
        if not product_id:
            return Response({'error': 'product_id is required'}, status=400)

        item_ref = db.collection('wishlists').document(uid).collection('items').document(str(product_id))
        item_ref.set({'product_id': str(product_id)})

        return Response({'added': True, 'product_id': str(product_id)}, status=201)


class WishlistRemoveView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, product_id: str):
        _initialize_firebase_app()
        db = firestore.client()

        uid = request.user.get('uid')
        item_ref = db.collection('wishlists').document(uid).collection('items').document(str(product_id))
        snap = item_ref.get()
        if not snap.exists:
            return Response({'error': 'Not found'}, status=404)

        item_ref.delete()
        return Response({'removed': True, 'product_id': str(product_id)}, status=204)

