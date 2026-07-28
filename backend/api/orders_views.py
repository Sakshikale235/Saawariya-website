import uuid
from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.db import get_supabase_client


def _get_uid(request) -> str | None:
    return request.user.get('uid') if hasattr(request, 'user') else None


def _now_iso() -> str:
    return datetime.utcnow().replace(microsecond=0).isoformat() + 'Z'


def _to_decimal(value) -> Decimal:
    return Decimal(str(value or 0)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)


def _is_valid_uuid(value: str) -> bool:
    try:
        uuid.UUID(str(value))
        return True
    except (TypeError, ValueError):
        return False


def _calculate_price_breakdown(subtotal: Decimal) -> dict[str, Decimal]:
    discount = Decimal('0.00')
    shipping_fee = Decimal('0.00') if subtotal >= Decimal('500.00') else Decimal('50.00')
    tax = subtotal * Decimal('0.05')
    total_amount = subtotal - discount + shipping_fee + tax
    return {
        'subtotal': subtotal.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP),
        'discount': discount.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP),
        'shipping_fee': shipping_fee.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP),
        'tax': tax.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP),
        'total_amount': total_amount.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP),
    }


def _get_item_count(items: list[dict]) -> int:
    return sum(int(item.get('quantity') or 0) for item in items)


class OrdersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        supabase = get_supabase_client()

        uid = _get_uid(request)
        if not uid:
            return Response({'error': 'Authentication required'}, status=401)

        res = (
            supabase.table('orders')
            .select('id, created_at, order_status, payment_status, total_amount, order_items(*)')
            .eq('profile_id', uid)
            .order('created_at', desc=True)
            .execute()
        )
        orders = res.data or []

        payload = []
        for order in orders:
            items = order.get('order_items') or []
            thumbnail = None
            for item in items:
                image = item.get('product_image') or item.get('product_image_url') or item.get('image_url')
                if image:
                    thumbnail = image
                    break

            payload.append({
                'id': order.get('id'),
                'created_at': order.get('created_at'),
                'status': order.get('order_status'),
                'payment_status': order.get('payment_status'),
                'total_amount': order.get('total_amount'),
                'item_count': _get_item_count(items),
                'thumbnail': thumbnail,
            })

        return Response({'orders': payload})

    def post(self, request):
        """Create a new order from authenticated user items using server-side pricing."""
        supabase = get_supabase_client()

        uid = _get_uid(request)
        if not uid:
            return Response({'error': 'Authentication required'}, status=401)

        payload = request.data or {}
        if not isinstance(payload, dict):
            return Response({'error': 'Invalid JSON body'}, status=400)

        address_id = payload.get('address_id')
        payment_method = (payload.get('payment_method') or 'razorpay').strip().lower()
        items_payload = payload.get('items') or []

        if not address_id:
            return Response({'error': 'address_id is required'}, status=400)

        if not isinstance(items_payload, list) or not items_payload:
            return Response({'error': 'At least one item is required'}, status=400)

        allowed_payment_methods = {'razorpay', 'cod', 'upi', 'netbanking', 'card', 'wallet'}
        if payment_method not in allowed_payment_methods:
            return Response({'error': 'Invalid payment_method'}, status=400)

        address_res = supabase.table('addresses').select('id, profile_id').eq('id', str(address_id)).eq('profile_id', uid).execute()
        if not address_res.data:
            return Response({'error': 'Invalid address'}, status=400)

        line_items = []
        subtotal = Decimal('0.00')

        for raw_item in items_payload:
            if not isinstance(raw_item, dict):
                return Response({'error': 'Each item must be an object'}, status=400)

            product_id = raw_item.get('product_id')
            if not product_id:
                return Response({'error': 'product_id is required for each item'}, status=400)

            try:
                quantity = int(raw_item.get('quantity', 1))
            except (TypeError, ValueError):
                return Response({'error': 'quantity must be an integer'}, status=400)

            if quantity <= 0:
                return Response({'error': 'quantity must be greater than zero'}, status=400)

            product_res = (
                supabase.table('products')
                .select('id, name, title, price, stock, image_url')
                .eq('id', str(product_id))
                .execute()
            )
            if not product_res.data:
                return Response({'error': f'Product not found: {product_id}'}, status=404)

            product = product_res.data[0]
            current_stock = int(product.get('stock') or 0)
            if current_stock < quantity:
                return Response({'error': f'Stock unavailable for {product_id}'}, status=400)

            price = _to_decimal(product.get('price'))
            subtotal += price * quantity
            line_items.append({
                'product_id': str(product_id),
                'quantity': quantity,
                'product_name': product.get('name') or product.get('title') or str(product_id),
                'product_image': product.get('image_url') or '',
                'price_at_purchase': float(price),
                'selected_size': raw_item.get('selected_size') or None,
                'selected_color': raw_item.get('selected_color') or None,
            })

        pricing = _calculate_price_breakdown(subtotal)
        discount = pricing['discount']
        shipping_fee = pricing['shipping_fee']
        tax = pricing['tax']
        total_amount = pricing['total_amount']

        now = _now_iso()
        order_id = str(uuid.uuid4())
        order_row = {
            'id': order_id,
            'profile_id': uid,
            'address_id': str(address_id),
            'subtotal': float(subtotal),
            'discount': float(discount),
            'shipping_fee': float(shipping_fee),
            'tax': float(tax),
            'total_amount': float(total_amount),
            'payment_method': payment_method,
            'payment_status': 'pending',
            'order_status': 'pending',
            'status_history': [{'status': 'pending', 'timestamp': now}],
            'created_at': now,
            'updated_at': now,
        }

        try:
            rpc_payload = {
                'p_order_id': order_id,
                'p_profile_id': uid,
                'p_address_id': str(address_id),
                'p_subtotal': float(subtotal),
                'p_discount': float(discount),
                'p_shipping_fee': float(shipping_fee),
                'p_tax': float(tax),
                'p_total_amount': float(total_amount),
                'p_payment_method': payment_method,
                'p_items': [
                    {
                        'product_id': item['product_id'],
                        'quantity': item['quantity'],
                        'product_name': item['product_name'],
                        'product_image': item['product_image'],
                        'price_at_purchase': item['price_at_purchase'],
                        'selected_size': item['selected_size'],
                        'selected_color': item['selected_color'],
                    }
                    for item in line_items
                ],
            }
            rpc_res = supabase.rpc('place_order', rpc_payload).execute()
            if getattr(rpc_res, 'error', None):
                raise RuntimeError(str(rpc_res.error))
        except Exception as exc:
            return Response({'error': 'Unable to create order', 'detail': str(exc)}, status=500)

        return Response({
            'order_id': order_id,
            'total_amount': float(total_amount),
            'payment_status': 'pending',
            'order_status': 'pending',
        }, status=201)


class MyOrdersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        supabase = get_supabase_client()

        uid = _get_uid(request)
        if not uid:
            return Response({'error': 'Authentication required'}, status=401)

        res = (
            supabase.table('orders')
            .select('id, created_at, order_status, payment_status, total_amount, order_items(*)')
            .eq('profile_id', uid)
            .order('created_at', desc=True)
            .execute()
        )
        orders = res.data or []

        payload = []
        for order in orders:
            items = order.get('order_items') or []
            thumbnail = None
            for item in items:
                image = item.get('product_image') or item.get('product_image_url') or item.get('image_url')
                if image:
                    thumbnail = image
                    break

            payload.append({
                'id': order.get('id'),
                'created_at': order.get('created_at'),
                'status': order.get('order_status'),
                'payment_status': order.get('payment_status'),
                'total_amount': order.get('total_amount'),
                'item_count': _get_item_count(items),
                'thumbnail': thumbnail,
            })

        return Response({'orders': payload})


class OrderDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, id: str):
        supabase = get_supabase_client()

        uid = _get_uid(request)
        if not uid:
            return Response({'error': 'Authentication required'}, status=401)

        if not _is_valid_uuid(id):
            return Response({'error': 'Invalid order id'}, status=400)

        order_res = (
            supabase.table('orders')
            .select('*, order_items(*)')
            .eq('id', str(id))
            .eq('profile_id', uid)
            .execute()
        )
        if not order_res.data:
            existing = supabase.table('orders').select('id, profile_id').eq('id', str(id)).execute().data or []
            if existing and existing[0].get('profile_id') != uid:
                return Response({'error': 'Forbidden'}, status=403)
            return Response({'error': 'Order not found'}, status=404)

        order = order_res.data[0]
        profile_res = supabase.table('profiles').select('id, email, full_name, phone').eq('id', uid).execute()
        address = None
        if order.get('address_id'):
            address_res = supabase.table('addresses').select('*').eq('id', order['address_id']).eq('profile_id', uid).execute()
            if address_res.data:
                address = address_res.data[0]

        return Response({
            'order': {
                'id': order.get('id'),
                'customer': profile_res.data[0] if profile_res.data else None,
                'address': address,
                'items': order.get('order_items') or [],
                'price_breakdown': {
                    'subtotal': order.get('subtotal'),
                    'discount': order.get('discount'),
                    'shipping_fee': order.get('shipping_fee'),
                    'tax': order.get('tax'),
                    'total_amount': order.get('total_amount'),
                },
                'statuses': {
                    'payment_status': order.get('payment_status'),
                    'order_status': order.get('order_status'),
                },
                'timestamps': {
                    'created_at': order.get('created_at'),
                    'updated_at': order.get('updated_at'),
                    'status_history': order.get('status_history'),
                },
            }
        })

    def put(self, request, id: str):
        """PUT /api/orders/{id}/ - update payment_status and/or order_status."""
        supabase = get_supabase_client()

        uid = _get_uid(request)
        if not uid:
            return Response({'error': 'Authentication required'}, status=401)

        if not _is_valid_uuid(id):
            return Response({'error': 'Invalid order id'}, status=400)

        check = supabase.table('orders').select('id, status_history').eq('id', str(id)).eq('profile_id', uid).execute()
        if not check.data:
            return Response({'error': 'Order not found'}, status=404)

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
                'timestamp': payload.get('timestamp') or _now_iso(),
            })
            update_data['status_history'] = history

        if not update_data:
            return Response({'error': 'No updatable fields provided'}, status=400)

        update_data['updated_at'] = _now_iso()
        supabase.table('orders').update(update_data).eq('id', str(id)).execute()
        return Response({'updated': True, 'id': id, 'data': update_data})


class OrderCancelView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, id: str):
        supabase = get_supabase_client()

        uid = _get_uid(request)
        if not uid:
            return Response({'error': 'Authentication required'}, status=401)

        if not _is_valid_uuid(id):
            return Response({'error': 'Invalid order id'}, status=400)

        order_res = (
            supabase.table('orders')
            .select('id, payment_status, order_status, status_history')
            .eq('id', str(id))
            .eq('profile_id', uid)
            .execute()
        )
        if not order_res.data:
            existing = supabase.table('orders').select('id, profile_id').eq('id', str(id)).execute().data or []
            if existing and existing[0].get('profile_id') != uid:
                return Response({'error': 'Forbidden'}, status=403)
            return Response({'error': 'Order not found'}, status=404)

        order = order_res.data[0]
        if order.get('payment_status') == 'paid':
            return Response({'error': 'Only pending orders with pending payment can be cancelled'}, status=400)
        if order.get('order_status') != 'pending':
            return Response({'error': 'Only pending orders with pending payment can be cancelled'}, status=400)

        history = list(order.get('status_history') or [])
        history.append({'status': 'cancelled', 'timestamp': _now_iso()})

        update_data = {
            'order_status': 'cancelled',
            'status_history': history,
            'updated_at': _now_iso(),
        }
        supabase.table('orders').update(update_data).eq('id', str(id)).execute()
        return Response({'updated': True, 'order_id': str(id), 'order_status': 'cancelled'})


class OrderStatusUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, id: str):
        return OrderDetailView().put(request, id)
