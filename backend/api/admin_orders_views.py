from rest_framework.response import Response
from rest_framework.views import APIView

from firebase_admin import firestore

from api.apps import _initialize_firebase_app


from api.permissions import IsAdminFirebaseUser


class AdminOrdersView(APIView):
    permission_classes = [IsAdminFirebaseUser]

    """Admin endpoint to list all orders across users.


    Note: no explicit admin auth is implemented (uses same FirebaseAuthentication).
    """

    def get(self, request):
        _initialize_firebase_app()
        db = firestore.client()

        orders_col = db.collection('orders')
        items = []

        for user_doc in orders_col.stream():
            uid = user_doc.id
            user_items_ref = orders_col.document(uid).collection('items')
            for snap in user_items_ref.stream():
                data = snap.to_dict() or {}
                data['id'] = snap.id
                data['user_id'] = uid
                items.append(data)

        return Response({'items': items})


class AdminOrderStatusUpdateView(APIView):
    permission_classes = [IsAdminFirebaseUser]

    """Admin endpoint to update an order's status.

    Accepts: order_status in [Pending, Processing, Shipped, Delivered, Cancelled]
    """

    VALID_STATUSES = {'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'}

    def put(self, request, id: str):
        _initialize_firebase_app()
        db = firestore.client()

        payload = request.data or {}
        new_status = payload.get('order_status')
        if new_status not in self.VALID_STATUSES:
            return Response({'error': 'Invalid order_status'}, status=400)

        # Locate the order by searching all user subcollections.
        # Collection: orders/<uid>/items/<id>
        orders_col = db.collection('orders')
        updated = None

        for user_doc in orders_col.stream():
            uid = user_doc.id
            doc_ref = orders_col.document(uid).collection('items').document(id)
            snap = doc_ref.get()
            if snap.exists:
                doc_ref.set({'order_status': new_status}, merge=True)
                updated = snap.to_dict() or {}
                updated['id'] = id
                updated['user_id'] = uid
                updated['order_status'] = new_status
                break

        if not updated:
            return Response({'error': 'Not found'}, status=404)

        return Response({'updated': True, 'data': updated})

