from rest_framework.response import Response
from rest_framework.views import APIView

from api.db import get_supabase_client
from api.permissions import IsAdminSupabaseUser
from datetime import datetime


class AdminOrdersView(APIView):
    """Admin endpoint: list all orders across all users."""

    permission_classes = [IsAdminSupabaseUser]

    def get(self, request):
        supabase = get_supabase_client()

        # Single query – no cross-user subcollection scan needed
        res = supabase.table('orders').select('*, order_items(*)').execute()
        items = res.data or []

        return Response({'items': items})


class AdminOrderStatusUpdateView(APIView):
    """Admin endpoint: update an order's status by order id."""

    permission_classes = [IsAdminSupabaseUser]

    VALID_STATUSES = {'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'}

    def put(self, request, id: str):
        supabase = get_supabase_client()

        payload = request.data or {}
        new_status = payload.get('order_status')
        if new_status not in self.VALID_STATUSES:
            return Response({'error': 'Invalid order_status'}, status=400)

        check = supabase.table('orders').select('id, status_history').eq('id', id).execute()
        if not check.data:
            return Response({'error': 'Not found'}, status=404)

        existing = check.data[0]
        history = list(existing.get('status_history') or [])
        history.append({
            'status': new_status,
            'timestamp': datetime.utcnow().isoformat() + 'Z',
        })

        supabase.table('orders').update({
            'order_status': new_status,
            'status_history': history,
            'updated_at': datetime.utcnow().isoformat() + 'Z',
        }).eq('id', id).execute()

        return Response({'updated': True, 'data': {**existing, 'order_status': new_status}})
