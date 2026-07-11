from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.db import get_supabase_client


class CartView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        supabase = get_supabase_client()

        uid = request.user.get('uid')
        res = supabase.table('cart_items').select('*').eq('profile_id', uid).execute()
        items = res.data or []

        return Response({'items': items})


class CartAddView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        supabase = get_supabase_client()

        uid = request.user.get('uid')
        data = request.data or {}
        product_id = data.get('product_id')
        quantity = data.get('quantity', 1)
        size = data.get('size') or None
        color = data.get('color') or None

        if not product_id:
            return Response({'error': 'product_id is required'}, status=400)

        try:
            quantity = int(quantity)
        except Exception:
            return Response({'error': 'quantity must be an integer'}, status=400)

        # Check if already in cart (same product + size + color)
        q = (
            supabase.table('cart_items')
            .select('id, quantity')
            .eq('profile_id', uid)
            .eq('product_id', str(product_id))
        )
        if size:
            q = q.eq('size', size)
        else:
            q = q.is_('size', 'null')
        if color:
            q = q.eq('color', color)
        else:
            q = q.is_('color', 'null')

        existing = q.execute()

        if existing.data:
            row = existing.data[0]
            new_qty = (row.get('quantity') or 0) + quantity
            supabase.table('cart_items').update({'quantity': new_qty}).eq('id', row['id']).execute()
        else:
            supabase.table('cart_items').insert({
                'profile_id': uid,
                'product_id': str(product_id),
                'quantity': quantity,
                'size': size,
                'color': color,
            }).execute()

        return Response({'added': True, 'product_id': str(product_id), 'quantity': quantity}, status=201)


class CartUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        supabase = get_supabase_client()

        uid = request.user.get('uid')
        data = request.data or {}
        product_id = data.get('product_id')
        quantity = data.get('quantity')

        if not product_id:
            return Response({'error': 'product_id is required'}, status=400)
        if quantity is None:
            return Response({'error': 'quantity is required'}, status=400)

        try:
            quantity = int(quantity)
        except Exception:
            return Response({'error': 'quantity must be an integer'}, status=400)

        check = supabase.table('cart_items').select('id').eq('profile_id', uid).eq('product_id', str(product_id)).execute()
        if not check.data:
            return Response({'error': 'Not found'}, status=404)

        supabase.table('cart_items').update({'quantity': quantity}).eq('profile_id', uid).eq('product_id', str(product_id)).execute()
        return Response({'updated': True, 'product_id': str(product_id), 'quantity': quantity})


class CartRemoveView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, product_id: str):
        supabase = get_supabase_client()

        uid = request.user.get('uid')
        check = supabase.table('cart_items').select('id').eq('profile_id', uid).eq('product_id', str(product_id)).execute()
        if not check.data:
            return Response({'error': 'Not found'}, status=404)

        supabase.table('cart_items').delete().eq('profile_id', uid).eq('product_id', str(product_id)).execute()
        return Response({'removed': True, 'product_id': str(product_id)}, status=204)
