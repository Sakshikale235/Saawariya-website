import hmac
import json
import uuid
from datetime import datetime
from decimal import Decimal

import razorpay
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.db import get_supabase_client


def _get_uid(request):
    return request.user.get('uid') if hasattr(request, 'user') else None


def _env(name: str, default=None):
    import os
    return os.environ.get(name, default)


def _require_env(name: str):
    v = _env(name)
    if v is None or v == '':
        raise RuntimeError(f"Missing required environment variable: {name}")
    return v


def _get_razorpay_config_error() -> Response | None:
    key_id = _env('RAZORPAY_KEY_ID')
    key_secret = _env('RAZORPAY_KEY_SECRET')

    if not key_id or not key_secret:
        return Response(
            {'error': 'Razorpay configuration is incomplete', 'detail': 'RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be configured.'},
            status=500,
        )
    return None


def _verify_signature(webhook_secret: str, payload: bytes, received_signature: str | None) -> bool:
    if not received_signature:
        return False
    digest = hmac.new(
        webhook_secret.encode('utf-8'),
        payload,
        digestmod='sha256',
    ).hexdigest()
    return hmac.compare_digest(digest, received_signature)


class CreateRazorpayOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        supabase = get_supabase_client()

        uid = _get_uid(request)
        if not uid:
            return Response({'error': 'Authentication required'}, status=401)

        payload = request.data or {}
        if not isinstance(payload, dict):
            return Response({'error': 'Invalid JSON body'}, status=400)

        order_id = payload.get('order_id')
        if not order_id:
            return Response({'error': 'order_id is required'}, status=400)

        try:
            uuid.UUID(str(order_id))
        except (TypeError, ValueError):
            return Response({'error': 'Invalid order id'}, status=400)

        order_res = (
            supabase.table('orders')
            .select('id, profile_id, order_status, payment_status, total_amount, razorpay_order_id')
            .eq('id', str(order_id))
            .execute()
        )
        if not order_res.data:
            return Response({'error': 'Order not found'}, status=404)

        order = order_res.data[0]
        if order.get('profile_id') != uid:
            return Response({'error': 'Forbidden'}, status=403)

        if order.get('order_status') != 'pending':
            return Response({'error': 'Only pending orders can be processed'}, status=400)

        if order.get('payment_status') != 'pending':
            return Response({'error': 'Order is not pending for payment'}, status=400)

        if order.get('razorpay_order_id'):
            return Response({'error': 'A Razorpay order already exists for this order'}, status=400)

        try:
            total_amount = Decimal(str(order.get('total_amount') or 0))
            amount_paise = int(round(total_amount * 100))
        except Exception:
            return Response({'error': 'Invalid order total amount'}, status=400)

        config_error = _get_razorpay_config_error()
        if config_error is not None:
            return config_error

        key_id = _env('RAZORPAY_KEY_ID')
        key_secret = _env('RAZORPAY_KEY_SECRET')
        public_key = _env('RAZORPAY_PUBLIC_KEY') or key_id

        try:
            client = razorpay.Client(auth=(key_id, key_secret))
            razor_order = client.order.create({
                'amount': amount_paise,
                'currency': 'INR',
                'receipt': str(order_id),
                'payment_capture': 1,
            })
        except razorpay.errors.BadRequestError as exc:
            return Response({'error': 'Razorpay order creation failed', 'detail': str(exc)}, status=502)
        except razorpay.errors.ServerErrorError as exc:
            return Response({'error': 'Razorpay service error', 'detail': str(exc)}, status=502)
        except razorpay.errors.UnauthorizedError as exc:
            return Response({'error': 'Razorpay authentication failed', 'detail': str(exc)}, status=502)
        except Exception as exc:
            return Response({'error': 'Razorpay order creation failed', 'detail': str(exc)}, status=502)

        try:
            supabase.table('orders').update({
                'razorpay_order_id': razor_order.get('id'),
                'updated_at': datetime.utcnow().isoformat() + 'Z',
            }).eq('id', str(order_id)).execute()
        except Exception as exc:
            return Response({'error': 'Unable to update order', 'detail': str(exc)}, status=500)

        return Response({
            'order_id': str(order_id),
            'razorpay_order_id': razor_order.get('id'),
            'amount': amount_paise,
            'currency': 'INR',
            'key': public_key,
        }, status=201)


class VerifyRazorpayPaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        supabase = get_supabase_client()

        uid = _get_uid(request)
        if not uid:
            return Response({'error': 'Authentication required'}, status=401)

        payload = request.data or {}
        if not isinstance(payload, dict):
            return Response({'error': 'Invalid JSON body'}, status=400)

        razorpay_order_id = payload.get('razorpay_order_id')
        razorpay_payment_id = payload.get('razorpay_payment_id')
        razorpay_signature = payload.get('razorpay_signature')
        order_id = payload.get('order_id')

        if not razorpay_order_id or not razorpay_payment_id or not razorpay_signature or not order_id:
            return Response({'error': 'razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id are required'}, status=400)

        try:
            uuid.UUID(str(order_id))
        except (TypeError, ValueError):
            return Response({'error': 'Invalid order id'}, status=400)

        order_res = (
            supabase.table('orders')
            .select('id, profile_id, order_status, payment_status, total_amount, razorpay_order_id, transaction_id, paid_at')
            .eq('id', str(order_id))
            .execute()
        )
        if not order_res.data:
            return Response({'error': 'Order not found'}, status=404)

        order = order_res.data[0]
        if order.get('profile_id') != uid:
            return Response({'error': 'Forbidden'}, status=403)

        if order.get('order_status') != 'pending':
            return Response({'error': 'Only pending orders can be processed'}, status=400)

        if order.get('payment_status') != 'pending':
            existing_payment_res = (
                supabase.table('payments')
                .select('id, status, razorpay_payment_id')
                .eq('order_id', str(order_id))
                .order('created_at', desc=True)
                .execute()
            )
            if existing_payment_res.data:
                return Response({'verified': True, 'already_processed': True, 'order_id': str(order_id), 'transaction_id': existing_payment_res.data[0].get('razorpay_payment_id')}, status=200)
            return Response({'error': 'Order is not pending for payment'}, status=400)

        stored_razorpay_order_id = str(order.get('razorpay_order_id') or '')
        if not stored_razorpay_order_id:
            return Response({'error': 'Razorpay order id is not available for this order'}, status=400)
        if stored_razorpay_order_id != str(razorpay_order_id):
            return Response({'error': 'Razorpay order id does not match'}, status=400)

        config_error = _get_razorpay_config_error()
        if config_error is not None:
            return config_error

        key_id = _env('RAZORPAY_KEY_ID')
        key_secret = _env('RAZORPAY_KEY_SECRET')
        if not key_id or not key_secret:
            return Response({'error': 'Razorpay configuration is incomplete'}, status=500)

        try:
            client = razorpay.Client(auth=(key_id, key_secret))
            utility = razorpay.utility.Utility(client)
            utility.verify_payment_signature({
                'razorpay_order_id': str(razorpay_order_id),
                'razorpay_payment_id': str(razorpay_payment_id),
                'razorpay_signature': str(razorpay_signature),
            })
        except Exception as exc:
            return Response({'error': 'Invalid payment signature', 'detail': str(exc)}, status=400)

        existing_payment_res = (
            supabase.table('payments')
            .select('id, status, razorpay_payment_id')
            .eq('razorpay_payment_id', str(razorpay_payment_id))
            .order('created_at', desc=True)
            .execute()
        )
        if existing_payment_res.data:
            return Response({'verified': True, 'already_processed': True, 'order_id': str(order_id), 'transaction_id': str(razorpay_payment_id)}, status=200)

        existing_order_payment_res = (
            supabase.table('payments')
            .select('id, status, razorpay_payment_id')
            .eq('order_id', str(order_id))
            .order('created_at', desc=True)
            .execute()
        )
        if existing_order_payment_res.data:
            return Response({'verified': True, 'already_processed': True, 'order_id': str(order_id), 'transaction_id': existing_order_payment_res.data[0].get('razorpay_payment_id')}, status=200)

        try:
            client = razorpay.Client(auth=(key_id, key_secret))
            razorpay_order = client.order.fetch(str(razorpay_order_id))
            razorpay_payment = client.payment.fetch(str(razorpay_payment_id))
        except Exception as exc:
            return Response({'error': 'Unable to verify payment with Razorpay', 'detail': str(exc)}, status=502)

        amount_paise = int(round(Decimal(str(order.get('total_amount') or 0)) * 100))
        razorpay_order_amount = int(razorpay_order.get('amount') or 0)
        razorpay_payment_amount = int(razorpay_payment.get('amount') or 0)
        if razorpay_order_amount != amount_paise or razorpay_payment_amount != amount_paise:
            return Response({'error': 'Razorpay amount does not match the stored order amount'}, status=400)

        order_items_res = (
            supabase.table('order_items')
            .select('product_id, quantity')
            .eq('order_id', str(order_id))
            .execute()
        )
        items = order_items_res.data or []
        stock_checks = []
        for item in items:
            product_id = item.get('product_id')
            quantity = int(item.get('quantity') or 0)
            if not product_id or quantity <= 0:
                continue
            product_res = (
                supabase.table('products')
                .select('id, stock')
                .eq('id', str(product_id))
                .execute()
            )
            if not product_res.data:
                return Response({'error': f'Product not found: {product_id}'}, status=404)
            current_stock = int(product_res.data[0].get('stock') or 0)
            if current_stock < quantity:
                return Response({'error': f'Insufficient stock for product {product_id}'}, status=400)
            stock_checks.append((str(product_id), quantity))

        now = datetime.utcnow().replace(microsecond=0).isoformat() + 'Z'
        payment_row_id = None
        stock_rollbacks = []
        payment_inserted = False

        try:
            payment_res = supabase.table('payments').insert({
                'order_id': str(order_id),
                'razorpay_order_id': str(razorpay_order_id),
                'razorpay_payment_id': str(razorpay_payment_id),
                'razorpay_signature': str(razorpay_signature),
                'amount': amount_paise,
                'currency': 'INR',
                'status': 'captured',
                'gateway_response': {
                    'razorpay_order_id': str(razorpay_order_id),
                    'razorpay_payment_id': str(razorpay_payment_id),
                    'verified_via': 'sdk',
                },
                'paid_at': now,
                'created_at': now,
            }).execute()
            if getattr(payment_res, 'error', None):
                raise RuntimeError(str(payment_res.error))
            payment_row = payment_res.data[0] if payment_res.data else None
            payment_row_id = payment_row.get('id') if payment_row else None
            payment_inserted = True

            for product_id, quantity in stock_checks:
                product_res = (
                    supabase.table('products')
                    .select('id, stock')
                    .eq('id', str(product_id))
                    .execute()
                )
                if not product_res.data:
                    raise RuntimeError(f'Product not found: {product_id}')
                latest_stock = int(product_res.data[0].get('stock') or 0)
                if latest_stock < quantity:
                    raise RuntimeError(f'Insufficient stock for product {product_id}')
                update_res = supabase.table('products').update({'stock': latest_stock - quantity}).eq('id', str(product_id)).execute()
                if getattr(update_res, 'error', None):
                    raise RuntimeError(str(update_res.error))
                stock_rollbacks.append((str(product_id), latest_stock))

            order_update_res = supabase.table('orders').update({
                'payment_status': 'paid',
                'order_status': 'confirmed',
                'paid_at': now,
                'transaction_id': str(razorpay_payment_id),
                'updated_at': now,
            }).eq('id', str(order_id)).execute()
            if getattr(order_update_res, 'error', None):
                raise RuntimeError(str(order_update_res.error))

            return Response({
                'verified': True,
                'order_id': str(order_id),
                'transaction_id': str(razorpay_payment_id),
                'payment_status': 'paid',
                'order_status': 'confirmed',
            }, status=200)
        except Exception as exc:
            if payment_inserted and payment_row_id:
                try:
                    supabase.table('payments').delete().eq('id', payment_row_id).execute()
                except Exception:
                    pass
            for product_id, previous_stock in reversed(stock_rollbacks):
                try:
                    supabase.table('products').update({'stock': previous_stock}).eq('id', product_id).execute()
                except Exception:
                    pass
            return Response({'error': 'Unable to finalize payment', 'detail': str(exc)}, status=500)


class RazorpayWebhookView(APIView):
    permission_classes = []

    def post(self, request):
        supabase = get_supabase_client()

        webhook_secret = _require_env('RAZORPAY_WEBHOOK_SECRET')
        signature = request.headers.get('X-Razorpay-Signature') or request.headers.get('x-razorpay-signature')

        raw_body = request.body or b'{}'
        if not _verify_signature(webhook_secret, raw_body, signature):
            return Response({'error': 'Invalid webhook signature'}, status=400)

        try:
            event = json.loads(raw_body.decode('utf-8'))
        except Exception:
            event = request.data or {}

        event_type = event.get('event')
        payload = event.get('payload') or {}
        payment = payload.get('payment') or {}

        razorpay_payment_id = (
            payment.get('entity', {}).get('id')
            or payment.get('payment_id')
            or payment.get('id')
        )

        webhook_id = payment.get('id') or razorpay_payment_id or event.get('id')
        if not webhook_id:
            return Response({'error': 'Missing webhook id/payment id'}, status=400)

        # Idempotency: check if this webhook has already been processed
        existing_wh = supabase.table('razorpay_webhooks').select('id').eq('id', str(webhook_id)).execute()
        if existing_wh.data:
            return Response({'received': True, 'idempotent': True}, status=200)

        razorpay_order_id = (
            payment.get('entity', {}).get('order_id')
            or payment.get('order_id')
            or payment.get('order')
        )

        updated = False
        if razorpay_order_id or razorpay_payment_id:
            # Direct SQL lookup – no cross-user scan needed
            q = supabase.table('orders').select('id')
            if razorpay_order_id:
                q = q.eq('razorpay_order_id', razorpay_order_id)
            elif razorpay_payment_id:
                q = q.eq('transaction_id', str(razorpay_payment_id))

            res = q.execute()
            if res.data:
                target_id = res.data[0]['id']
                supabase.table('orders').update({
                    'payment_status': 'paid',
                    'transaction_id': str(razorpay_payment_id),
                    'updated_at': datetime.utcnow().isoformat() + 'Z',
                }).eq('id', target_id).execute()
                updated = True

        # Record webhook for idempotency
        supabase.table('razorpay_webhooks').insert({
            'id': str(webhook_id),
            'received_at': datetime.utcnow().isoformat() + 'Z',
            'event_type': event_type,
            'payment_id': str(razorpay_payment_id) if razorpay_payment_id else None,
        }).execute()

        return Response({'received': True, 'updated': updated}, status=200)
