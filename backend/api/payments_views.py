import hmac
import json
from datetime import datetime

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
            return Response({'error': 'Missing uid'}, status=400)

        amount = (request.data or {}).get('amount')
        currency = (request.data or {}).get('currency', 'INR')
        order_id = (request.data or {}).get('order_id')

        if amount is None or order_id is None:
            return Response({'error': 'amount and order_id are required'}, status=400)

        try:
            amount_paise = int(amount)
        except Exception:
            return Response({'error': 'amount must be an integer (paise)'}, status=400)

        key_id = _require_env('RAZORPAY_KEY_ID')
        key_secret = _require_env('RAZORPAY_KEY_SECRET')

        client = razorpay.Client(auth=(key_id, key_secret))
        razor_order = client.order.create({
            'amount': amount_paise,
            'currency': currency,
            'receipt': str(order_id),
            'payment_capture': 1,
        })

        # Verify the order belongs to this user, then attach razorpay metadata
        check = supabase.table('orders').select('id').eq('id', str(order_id)).eq('profile_id', uid).execute()
        if not check.data:
            return Response({'error': 'Order not found'}, status=404)

        supabase.table('orders').update({
            'razorpay_order_id': razor_order.get('id'),
            'razorpay_amount': amount_paise,
            'payment_status': 'unpaid',
            'updated_at': datetime.utcnow().isoformat() + 'Z',
        }).eq('id', str(order_id)).execute()

        return Response({
            'razorpay_order_id': razor_order.get('id'),
            'currency': razor_order.get('currency'),
            'amount': razor_order.get('amount'),
            'order_id': str(order_id),
        }, status=201)


class VerifyRazorpayPaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        supabase = get_supabase_client()

        uid = _get_uid(request)
        if not uid:
            return Response({'error': 'Missing uid'}, status=400)

        payload = request.data or {}
        razorpay_order_id = payload.get('razorpay_order_id')
        razorpay_payment_id = payload.get('razorpay_payment_id')
        razorpay_signature = payload.get('razorpay_signature')
        order_id = payload.get('order_id')

        if not razorpay_order_id or not razorpay_payment_id or not razorpay_signature or not order_id:
            return Response({'error': 'razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id are required'}, status=400)

        key_secret = _require_env('RAZORPAY_KEY_SECRET')

        msg = f"{razorpay_order_id}|{razorpay_payment_id}".encode('utf-8')
        expected = hmac.new(
            key_secret.encode('utf-8'),
            msg,
            digestmod='sha256',
        ).hexdigest()

        if not hmac.compare_digest(expected, str(razorpay_signature)):
            return Response({'error': 'Invalid payment signature'}, status=400)

        check = supabase.table('orders').select('id').eq('id', str(order_id)).eq('profile_id', uid).execute()
        if not check.data:
            return Response({'error': 'Order not found'}, status=404)

        supabase.table('orders').update({
            'payment_status': 'paid',
            'transaction_id': str(razorpay_payment_id),
            'razorpay_order_id': str(razorpay_order_id),
            'updated_at': datetime.utcnow().isoformat() + 'Z',
        }).eq('id', str(order_id)).execute()

        return Response({'verified': True, 'order_id': str(order_id), 'transaction_id': str(razorpay_payment_id)}, status=200)


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
