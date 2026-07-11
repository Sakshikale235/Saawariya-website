from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.db import get_supabase_client


class WishlistView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        supabase = get_supabase_client()

        uid = request.user.get('uid')
        res = supabase.table('wishlist_items').select('*').eq('profile_id', uid).execute()
        items = res.data or []

        return Response({'items': items})


class WishlistAddView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        supabase = get_supabase_client()

        uid = request.user.get('uid')
        product_id = (request.data or {}).get('product_id')
        if not product_id:
            return Response({'error': 'product_id is required'}, status=400)

        # UNIQUE(profile_id, product_id) — upsert ignores duplicates
        res = supabase.table('wishlist_items').upsert(
            {'profile_id': uid, 'product_id': str(product_id)},
            on_conflict='profile_id,product_id',
        ).execute()

        row = res.data[0] if res.data else {'profile_id': uid, 'product_id': str(product_id)}
        return Response({'added': True, 'product_id': str(product_id)}, status=201)


class WishlistRemoveView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, product_id: str):
        supabase = get_supabase_client()

        uid = request.user.get('uid')
        check = supabase.table('wishlist_items').select('id').eq('profile_id', uid).eq('product_id', str(product_id)).execute()
        if not check.data:
            return Response({'error': 'Not found'}, status=404)

        supabase.table('wishlist_items').delete().eq('profile_id', uid).eq('product_id', str(product_id)).execute()
        return Response({'removed': True, 'product_id': str(product_id)}, status=204)
