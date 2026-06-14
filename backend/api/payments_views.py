import hmac
import json
from datetime import datetime

import razorpay
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.apps import _initialize_firebase_app
from firebase_admin import firestore


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



def _order_doc_ref(db, uid: str, order_id: str):
    # Your orders model: orders/<uid>/items/<id>
    return db.collection('orders').document(uid).collection('items').document(str(order_id))


class CreateRazorpayOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        _initialize_firebase_app()
        db = firestore.client()

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

        # Create Razorpay order (server-side)
        razor_order = client.order.create({
            'amount': amount_paise,
            'currency': currency,
            'receipt': str(order_id),
            'payment_capture': 1,
        })

        # Store razorpay order id on our order doc (helps webhook matching)
        # Keep minimal: merge field on the existing order doc.
        doc_ref = _order_doc_ref(db, uid, order_id)
        snap = doc_ref.get()
        if not snap.exists:
            return Response({'error': 'Order not found'}, status=404)

        doc_ref.set({
            'razorpay_order_id': razor_order.get('id'),
            'razorpay_amount': amount_paise,
            'payment_status': 'unpaid',
            'updated_at': datetime.utcnow().isoformat() + 'Z',
        }, merge=True)

        return Response({
            'razorpay_order_id': razor_order.get('id'),
            'currency': razor_order.get('currency'),
            'amount': razor_order.get('amount'),
            'order_id': str(order_id),
        }, status=201)


class VerifyRazorpayPaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        _initialize_firebase_app()
        db = firestore.client()

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

        webhook_secret = _require_env('RAZORPAY_WEBHOOK_SECRET')
        key_id = _require_env('RAZORPAY_KEY_ID')
        key_secret = _require_env('RAZORPAY_KEY_SECRET')

        # Razorpay signature verification convention:
        # For server-side verification of payment, Razorpay commonly uses
        # HMAC SHA256 of (order_id + '|' + payment_id) with secret.
        msg = f"{razorpay_order_id}|{razorpay_payment_id}".encode('utf-8')
        expected = hmac.new(
            key_secret.encode('utf-8'),
            msg,
            digestmod='sha256',
        ).hexdigest()


        if not hmac.compare_digest(expected, str(razorpay_signature)):
            return Response({'error': 'Invalid payment signature'}, status=400)

        # Update our order doc
        doc_ref = _order_doc_ref(db, uid, order_id)
        snap = doc_ref.get()
        if not snap.exists:
            return Response({'error': 'Order not found'}, status=404)

        # Store transaction_id/payment_id + mark paid.
        doc_ref.set({
            'payment_status': 'paid',
            'transaction_id': str(razorpay_payment_id),
            'razorpay_order_id': str(razorpay_order_id),
            'updated_at': datetime.utcnow().isoformat() + 'Z',
        }, merge=True)

        # Minimal response; webhook still should be source of truth.
        return Response({'verified': True, 'order_id': str(order_id), 'transaction_id': str(razorpay_payment_id)}, status=200)


class RazorpayWebhookView(APIView):

    # Webhook should be accessible without Firebase auth.
    permission_classes = []

    def post(self, request):
        _initialize_firebase_app()
        db = firestore.client()

        webhook_secret = _require_env('RAZORPAY_WEBHOOK_SECRET')
        signature = request.headers.get('X-Razorpay-Signature') or request.headers.get('x-razorpay-signature')

        raw_body = request.body or b'{}'
        if not _verify_signature(webhook_secret, raw_body, signature):
            return Response({'error': 'Invalid webhook signature'}, status=400)

        try:
            event = json.loads(raw_body.decode('utf-8'))
        except Exception:
            # If body isn't JSON, DRF may have parsed it.
            event = request.data or {}

        event_type = event.get('event')
        payload = event.get('payload') or {}
        payment = payload.get('payment') or {}

        razorpay_payment_id = payment.get('entity', {}).get('id') or payment.get('payment_id') or payment.get('id')

        # Idempotency: Razorpay event has a unique id/ created_at fields.
        # We'll store processed webhook ids in a separate collection.
        # Prefer `payload.payment.id` if present; fall back to payment_id.
        webhook_id = payment.get('id') or razorpay_payment_id or event.get('id')
        if not webhook_id:
            return Response({'error': 'Missing webhook id/payment id'}, status=400)

        processed_ref = db.collection('razorpay_webhooks').document(str(webhook_id))
        if processed_ref.get().exists:
            return Response({'received': True, 'idempotent': True}, status=200)

        # Determine our internal order_id.
        # We stored Razorpay order receipt as `order_id`.
        razorpay_order_id = payment.get('entity', {}).get('order_id') or payment.get('order_id') or payment.get('order')


        # We need to find which user's order doc to update.
        # Minimal approach: scan orders/<uid>/items where razorpay_order_id matches.
        # NOTE: this is not optimal but minimal code.
        orders_col = db.collection('orders')
        updated = False

        for user_doc in orders_col.stream():
            uid = user_doc.id
            items_ref = orders_col.document(uid).collection('items')
            for snap in items_ref.stream():
                data = snap.to_dict() or {}
                if data.get('razorpay_order_id') == razorpay_order_id or data.get('razorpay_payment_id') == razorpay_payment_id:
                    snap.reference.set({
                        'payment_status': 'paid',
                        'transaction_id': str(razorpay_payment_id),
                        'updated_at': datetime.utcnow().isoformat() + 'Z',
                    }, merge=True)
                    updated = True
                    break
            if updated:
                break

        if not updated:
            # Still mark webhook as processed to avoid loops.
            processed_ref.set({'received_at': datetime.utcnow().isoformat() + 'Z', 'event_type': event_type})
            return Response({'received': True, 'updated': False}, status=200)

        processed_ref.set({'received_at': datetime.utcnow().isoformat() + 'Z', 'event_type': event_type, 'payment_id': str(razorpay_payment_id)})

        return Response({'received': True, 'updated': True}, status=200)

