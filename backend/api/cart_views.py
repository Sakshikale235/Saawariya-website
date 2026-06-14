from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.apps import _initialize_firebase_app
from firebase_admin import firestore


class CartView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        _initialize_firebase_app()
        db = firestore.client()

        uid = request.user.get('uid')
        items_ref = db.collection('carts').document(uid).collection('items')

        items = []
        for snap in items_ref.stream():
            data = snap.to_dict() or {}
            data['product_id'] = snap.id
            items.append(data)

        return Response({'items': items})


class CartAddView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        _initialize_firebase_app()
        db = firestore.client()

        uid = request.user.get('uid')
        product_id = (request.data or {}).get('product_id')
        quantity = (request.data or {}).get('quantity', 1)

        if not product_id:
            return Response({'error': 'product_id is required'}, status=400)

        try:
            quantity = int(quantity)
        except Exception:
            return Response({'error': 'quantity must be an integer'}, status=400)

        item_ref = (
            db.collection('carts')
            .document(uid)
            .collection('items')
            .document(str(product_id))
        )

        snap = item_ref.get()
        if snap.exists:
            prev_qty = snap.to_dict().get('quantity', 0) or 0
            item_ref.set({'product_id': str(product_id), 'quantity': int(prev_qty) + quantity})
        else:
            item_ref.set({'product_id': str(product_id), 'quantity': quantity})

        return Response({'added': True, 'product_id': str(product_id), 'quantity': quantity}, status=201)


class CartUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        _initialize_firebase_app()
        db = firestore.client()

        uid = request.user.get('uid')
        product_id = (request.data or {}).get('product_id')
        quantity = (request.data or {}).get('quantity')

        if not product_id:
            return Response({'error': 'product_id is required'}, status=400)
        if quantity is None:
            return Response({'error': 'quantity is required'}, status=400)

        try:
            quantity = int(quantity)
        except Exception:
            return Response({'error': 'quantity must be an integer'}, status=400)

        item_ref = db.collection('carts').document(uid).collection('items').document(str(product_id))
        snap = item_ref.get()
        if not snap.exists:
            return Response({'error': 'Not found'}, status=404)

        item_ref.set({'product_id': str(product_id), 'quantity': quantity})
        return Response({'updated': True, 'product_id': str(product_id), 'quantity': quantity})


class CartRemoveView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, product_id: str):
        _initialize_firebase_app()
        db = firestore.client()

        uid = request.user.get('uid')
        item_ref = db.collection('carts').document(uid).collection('items').document(str(product_id))
        snap = item_ref.get()
        if not snap.exists:
            return Response({'error': 'Not found'}, status=404)

        item_ref.delete()
        return Response({'removed': True, 'product_id': str(product_id)}, status=204)

