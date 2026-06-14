from datetime import datetime

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.apps import _initialize_firebase_app
from firebase_admin import firestore


def _get_uid(request) -> str | None:
    return request.user.get('uid') if hasattr(request, 'user') else None


class OrdersView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):
        _initialize_firebase_app()
        db = firestore.client()

        uid = request.user.get('uid')
        orders_ref = db.collection('orders').document(uid).collection('items')

        items = []
        for snap in orders_ref.stream():
            data = snap.to_dict() or {}
            data['id'] = snap.id
            items.append(data)

        return Response({'items': items})

    def post(self, request):
        _initialize_firebase_app()
        db = firestore.client()

        uid = request.user.get('uid')
        payload = request.data or {}

        payload.setdefault('user_id', uid)
        payload.setdefault('products', [])
        payload.setdefault('total_amount', 0)
        payload.setdefault('payment_status', 'unpaid')
        payload.setdefault('order_status', 'pending')
        payload.setdefault('created_at', datetime.utcnow().isoformat() + 'Z')

        products = payload.get('products') or []
        # Expected product line items: [{"product_id": "...", "quantity": 2}, ...]
        # If your frontend sends a different shape, adjust mapping accordingly.
        line_items = []
        for p in products:
            if isinstance(p, dict) and p.get('product_id') is not None:
                line_items.append({
                    'product_id': str(p.get('product_id')),
                    'quantity': int(p.get('quantity', 1)),
                })

        orders_ref = db.collection('orders').document(uid).collection('items')
        doc_ref = orders_ref.document()

        stock_updates = []

        def _tx_update_stock(transaction):
            # Validate stock availability for all items first.
            for li in line_items:
                product_ref = db.collection('products').document(li['product_id'])
                prod_snap = product_ref.get(transaction=transaction)
                prod_data = prod_snap.to_dict() or {}
                current_stock = prod_data.get('stock')
                try:
                    current_stock = int(current_stock)
                except Exception:
                    current_stock = 0

                qty = int(li['quantity'])
                if qty <= 0:
                    raise ValueError('Invalid quantity in order')

                if current_stock <= 0 or current_stock < qty:
                    raise ValueError(f"Insufficient stock for {li['product_id']}")

                new_stock = current_stock - qty
                stock_updates.append((product_ref, new_stock))

            # Apply stock updates
            for product_ref, new_stock in stock_updates:
                transaction.update(product_ref, {'stock': new_stock})


            # Create order doc
            transaction.set(doc_ref, {
                'user_id': payload['user_id'],
                'products': payload['products'],
                'total_amount': payload['total_amount'],
                'payment_status': payload['payment_status'],
                'order_status': payload['order_status'],
                'status_history': [
                    {
                        'status': payload['order_status'],
                        'timestamp': payload['created_at'],
                    }
                ],
                'created_at': payload['created_at'],

                'stock_updates': [
                    {'product_id': li['product_id'], 'quantity': li['quantity'], 'new_stock': int(ns)}
                    for li, (_, ns) in zip(line_items, stock_updates)
                ],
            })


        try:
            transaction = db.transaction()
            transaction.run(_tx_update_stock)
        except ValueError as exc:
            return Response({'error': str(exc)}, status=400)

        return Response({'id': doc_ref.id, 'data': payload}, status=201)



class OrderDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, id: str):
        _initialize_firebase_app()
        db = firestore.client()

        uid = request.user.get('uid')
        doc_ref = db.collection('orders').document(uid).collection('items').document(id)
        snap = doc_ref.get()

        if not snap.exists:
            return Response({'error': 'Not found'}, status=404)

        data = snap.to_dict() or {}
        data['id'] = snap.id
        return Response({'data': data})

    def put(self, request, id: str):
        """PUT /api/orders/{id}/status/ - update only `payment_status` and/or `order_status`."""
        _initialize_firebase_app()
        db = firestore.client()

        uid = request.user.get('uid')
        doc_ref = db.collection('orders').document(uid).collection('items').document(id)
        snap = doc_ref.get()
        if not snap.exists:
            return Response({'error': 'Not found'}, status=404)

        payload = request.data or {}
        update_data = {}
        if 'payment_status' in payload:
            update_data['payment_status'] = payload['payment_status']
        if 'order_status' in payload:
            update_data['order_status'] = payload['order_status']
            # Append status history entry
            existing = snap.to_dict() or {}
            history = existing.get('status_history') or []
            history = list(history) if isinstance(history, list) else []
            history.append({
                'status': payload['order_status'],
                'timestamp': payload.get('timestamp') or datetime.utcnow().isoformat() + 'Z',
            })
            update_data['status_history'] = history


        if not update_data:
            return Response({'error': 'No updatable fields provided'}, status=400)

        doc_ref.set(update_data, merge=True)
        return Response({'updated': True, 'id': id, 'data': update_data})


class OrderStatusUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, id: str):
        # Kept separate to match requested endpoint name.
        return OrderDetailView().put(request, id)

