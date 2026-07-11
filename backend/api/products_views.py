from datetime import datetime

from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.db import get_supabase_client
from api.permissions import IsAdminSupabaseUser


def _get_uid(request) -> str | None:
    return request.user.get('uid') if hasattr(request, 'user') else None


class ProductsView(APIView):

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAdminSupabaseUser()]

    def get(self, request):
        """GET /api/products/

        Supports query filters:
        - search: substring match on `name` or `title` (client-side)
        - category: exact match
        - min_price / max_price: numeric range
        - size: array-contains on `sizes`
        - color: array-contains on `colors`
        - sort: asc|desc by `price`
        """
        supabase = get_supabase_client()

        params = request.query_params or {}
        search = (params.get('search') or '').strip().lower()
        category = (params.get('category') or '').strip()
        min_price = params.get('min_price')
        max_price = params.get('max_price')
        size = (params.get('size') or '').strip()
        color = (params.get('color') or '').strip()
        sort = (params.get('sort') or '').strip().lower()

        query = supabase.table('products').select('*')

        if category:
            query = query.eq('category', category)

        if min_price is not None and min_price != '':
            try:
                query = query.gte('price', float(min_price))
            except Exception:
                pass

        if max_price is not None and max_price != '':
            try:
                query = query.lte('price', float(max_price))
            except Exception:
                pass

        # PostgreSQL array containment for TEXT[] columns
        if size:
            query = query.contains('sizes', [size])
        if color:
            query = query.contains('colors', [color])

        if sort in ['asc', 'desc']:
            query = query.order('price', desc=(sort == 'desc'))
        else:
            query = query.limit(200)

        res = query.execute()
        items = res.data or []

        # Client-side substring search (no full-text index needed)
        if search:
            items = [
                i for i in items
                if search in (i.get('name') or i.get('title') or '').lower()
            ]

        return Response({'items': items, 'count': len(items)})

    def post(self, request):
        """POST /api/products/ - create a row in the `products` table."""
        supabase = get_supabase_client()

        payload = dict(request.data or {})
        created_by = _get_uid(request)
        if created_by:
            payload.setdefault('created_by', created_by)

        payload.setdefault('created_at', datetime.utcnow().isoformat() + 'Z')
        # Ensure arrays default to empty lists for postgres TEXT[] columns
        payload.setdefault('sizes', [])
        payload.setdefault('colors', [])

        res = supabase.table('products').insert(payload).execute()
        row = res.data[0] if res.data else payload
        return Response({'id': row.get('id'), 'data': row}, status=201)


class ProductDetailView(APIView):

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAdminSupabaseUser()]

    def get(self, request, id: str):
        """GET /api/products/{id}/"""
        supabase = get_supabase_client()

        res = supabase.table('products').select('*').eq('id', id).execute()
        if not res.data:
            return Response({'error': 'Not found'}, status=404)

        return Response({'data': res.data[0]})

    def put(self, request, id: str):
        """PUT /api/products/{id}/ - replace product fields."""
        supabase = get_supabase_client()

        # Verify existence first
        check = supabase.table('products').select('id').eq('id', id).execute()
        if not check.data:
            return Response({'error': 'Not found'}, status=404)

        payload = dict(request.data or {})
        payload['updated_at'] = datetime.utcnow().isoformat() + 'Z'

        res = supabase.table('products').update(payload).eq('id', id).execute()
        row = res.data[0] if res.data else payload
        return Response({'id': id, 'data': row})

    def delete(self, request, id: str):
        """DELETE /api/products/{id}/"""
        supabase = get_supabase_client()

        check = supabase.table('products').select('id').eq('id', id).execute()
        if not check.data:
            return Response({'error': 'Not found'}, status=404)

        supabase.table('products').delete().eq('id', id).execute()
        return Response({'deleted': True, 'id': id}, status=204)
