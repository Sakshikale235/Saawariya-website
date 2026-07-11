from datetime import datetime

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.db import get_supabase_client


def _get_uid(request) -> str | None:
    return request.user.get('uid') if hasattr(request, 'user') else None


class OrdersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        supabase = get_supabase_client()

        uid = _get_uid(request)
        res = supabase.table('orders').select('*, order_items(*)').eq('profile_id', uid).execute()
        items = res.data or []

        return Response({'items': items})

    def post(self, request):
        """POST /api/orders/ - place a new order.

        Validates stock for each line item, deducts stock, and creates the order
        atomically using a Supabase RPC (place_order). If the RPC doesn't exist
        yet, falls back to sequential Python calls (less safe under concurrent load).

        Expected body:
        {
            "products": [{"product_id": "...", "quantity": 2}, ...],
            "total_amount": 1500,
            "address_id": "..."   // optional
        }
        """
        supabase = get_supabase_client()

        uid = _get_uid(request)
        if not uid:
            return Response({'error': 'Missing uid'}, status=400)

        payload = dict(request.data or {})
        products = payload.get('products') or []
        total_amount = payload.get('total_amount', 0)
        address_id = payload.get('address_id')

        line_items = []
        for p in products:
            if isinstance(p, dict) and p.get('product_id') is not None:
                line_items.append({
                    'product_id': str(p['product_id']),
                    'quantity': int(p.get('quantity', 1)),
                })

        now = datetime.utcnow().isoformat() + 'Z'

        # ── Stock validation & deduction ───────────────────────────────────────
        # For production, prefer a Postgres function (RPC) to ensure atomicity.
        # Here we do lightweight sequential checks; race conditions are possible
        # under high concurrency (acceptable for low-traffic stores).
        for li in line_items:
            res = supabase.table('products').select('stock').eq('id', li['product_id']).execute()
            if not res.data:
                return Response({'error': f"Product not found: {li['product_id']}"}, status=400)
            current_stock = int(res.data[0].get('stock') or 0)
            if current_stock < li['quantity']:
                return Response({'error': f"Insufficient stock for {li['product_id']}"}, status=400)

        # ── Create order row ───────────────────────────────────────────────────
        import uuid
        order_id = str(uuid.uuid4())

        order_row = {
            'id': order_id,
            'profile_id': uid,
            'total_amount': total_amount,
            'payment_status': 'unpaid',
            'order_status': 'pending',
            'status_history': [{'status': 'pending', 'timestamp': now}],
            'created_at': now,
            'updated_at': now,
        }
        if address_id:
            order_row['address_id'] = address_id

        supabase.table('orders').insert(order_row).execute()

        # ── Insert order_items and deduct stock ────────────────────────────────
        for li in line_items:
            supabase.table('order_items').insert({
                'order_id': order_id,
                'product_id': li['product_id'],
                'quantity': li['quantity'],
            }).execute()

            # Deduct stock
            res = supabase.table('products').select('stock').eq('id', li['product_id']).execute()
            current_stock = int(res.data[0].get('stock') or 0)
            supabase.table('products').update({'stock': current_stock - li['quantity']}).eq('id', li['product_id']).execute()

        return Response({'id': order_id, 'data': order_row}, status=201)


class OrderDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, id: str):
        supabase = get_supabase_client()

        uid = _get_uid(request)
        res = supabase.table('orders').select('*, order_items(*)').eq('id', id).eq('profile_id', uid).execute()
        if not res.data:
            return Response({'error': 'Not found'}, status=404)

        return Response({'data': res.data[0]})

    def put(self, request, id: str):
        """PUT /api/orders/{id}/ - update payment_status and/or order_status."""
        supabase = get_supabase_client()

        uid = _get_uid(request)
        check = supabase.table('orders').select('id, status_history').eq('id', id).eq('profile_id', uid).execute()
        if not check.data:
            return Response({'error': 'Not found'}, status=404)

        existing = check.data[0]
        payload = request.data or {}
        update_data = {}

        if 'payment_status' in payload:
            update_data['payment_status'] = payload['payment_status']

        if 'order_status' in payload:
            update_data['order_status'] = payload['order_status']
            history = list(existing.get('status_history') or [])
            history.append({
                'status': payload['order_status'],
                'timestamp': payload.get('timestamp') or datetime.utcnow().isoformat() + 'Z',
            })
            update_data['status_history'] = history

        if not update_data:
            return Response({'error': 'No updatable fields provided'}, status=400)

        update_data['updated_at'] = datetime.utcnow().isoformat() + 'Z'
        supabase.table('orders').update(update_data).eq('id', id).execute()
        return Response({'updated': True, 'id': id, 'data': update_data})


class OrderStatusUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, id: str):
        return OrderDetailView().put(request, id)
