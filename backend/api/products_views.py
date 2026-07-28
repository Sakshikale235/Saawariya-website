import uuid
from datetime import datetime

from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from api.db import get_supabase_client
from api.permissions import IsAdminSupabaseUser


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_uid(request) -> str | None:
    return request.user.get('uid') if hasattr(request, 'user') and isinstance(request.user, dict) else None


def _is_valid_uuid(value: str) -> bool:
    """Return True if value is a well-formed UUID string."""
    try:
        uuid.UUID(str(value))
        return True
    except (ValueError, AttributeError):
        return False


def _parse_positive_number(raw, field_name: str):
    """Convert raw to float; return (value, error_str).  Error is None on success."""
    try:
        val = float(raw)
    except (TypeError, ValueError):
        return None, f"'{field_name}' must be a number."
    if val < 0:
        return None, f"'{field_name}' must be >= 0."
    return val, None


# ---------------------------------------------------------------------------
# /api/products/  – list + create
# ---------------------------------------------------------------------------

class ProductsView(APIView):

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAdminSupabaseUser()]

    def get(self, request):
        """GET /api/products/

        Supports query filters:
        - search     : substring match on `name` or `title` (client-side)
        - category   : exact match
        - min_price / max_price : numeric range
        - size       : array-contains on `sizes`
        - color      : array-contains on `colors`
        - sort       : asc | desc by price
        """
        supabase = get_supabase_client()

        params = request.query_params or {}
        search    = (params.get('search')    or '').strip().lower()
        category  = (params.get('category')  or '').strip()
        min_price = params.get('min_price')
        max_price = params.get('max_price')
        size      = (params.get('size')      or '').strip()
        color     = (params.get('color')     or '').strip()
        sort      = (params.get('sort')      or '').strip().lower()

        query = supabase.table('products').select('*')

        if category:
            query = query.eq('category', category)

        if min_price not in (None, ''):
            try:
                query = query.gte('price', float(min_price))
            except (TypeError, ValueError):
                pass

        if max_price not in (None, ''):
            try:
                query = query.lte('price', float(max_price))
            except (TypeError, ValueError):
                pass

        # PostgreSQL array containment for TEXT[] columns
        if size:
            query = query.contains('sizes', [size])
        if color:
            query = query.contains('colors', [color])

        if sort in ('asc', 'desc'):
            query = query.order('price', desc=(sort == 'desc'))
        else:
            query = query.limit(200)

        try:
            res = query.execute()
        except Exception as exc:
            return Response({'error': f'Database error: {exc}'}, status=500)

        items = res.data or []

        # Client-side substring search (no full-text index needed)
        if search:
            items = [
                i for i in items
                if search in (i.get('name') or i.get('title') or '').lower()
            ]

        return Response({'items': items, 'count': len(items)})

    def post(self, request):
        """POST /api/products/ – create a row in the `products` table.

        Required fields: name, price
        Optional fields: title, description, category, sizes, colors,
                         stock, image_url
        """
        supabase = get_supabase_client()

        data = dict(request.data or {})

        # ── Required field validation ─────────────────────────────────────────
        name = (data.get('name') or '').strip()
        if not name:
            return Response({'error': "'name' is required."}, status=400)

        raw_price = data.get('price')
        if raw_price is None or raw_price == '':
            return Response({'error': "'price' is required."}, status=400)

        price, price_err = _parse_positive_number(raw_price, 'price')
        if price_err:
            return Response({'error': price_err}, status=400)

        # ── Optional numeric fields ───────────────────────────────────────────
        raw_stock = data.get('stock')
        if raw_stock not in (None, ''):
            stock, stock_err = _parse_positive_number(raw_stock, 'stock')
            if stock_err:
                return Response({'error': stock_err}, status=400)
            data['stock'] = int(stock)

        # ── Array field defaults ──────────────────────────────────────────────
        sizes = data.get('sizes', [])
        if isinstance(sizes, str):
            sizes = [s.strip() for s in sizes.split(',') if s.strip()]
        colors = data.get('colors', [])
        if isinstance(colors, str):
            colors = [c.strip() for c in colors.split(',') if c.strip()]

        # ── Build payload ─────────────────────────────────────────────────────
        product_id = data.get('id') or str(uuid.uuid4())

        payload = {
            'id':          product_id,
            'name':        name,
            'title':       (data.get('title') or '').strip() or name,
            'description': (data.get('description') or '').strip(),
            'price':       price,
            'category':    (data.get('category') or '').strip(),
            'sizes':       sizes,
            'colors':      colors,
            'stock':       data.get('stock', 0),
            'image_url':   data.get('image_url') or '',
            'created_at':  datetime.utcnow().isoformat() + 'Z',
            'updated_at':  datetime.utcnow().isoformat() + 'Z',
        }

        uid = _get_uid(request)
        if uid:
            payload['created_by'] = uid

        try:
            res = supabase.table('products').insert(payload).execute()
        except Exception as exc:
            return Response({'error': f'Database error: {exc}'}, status=500)

        row = res.data[0] if res.data else payload
        return Response({'id': row.get('id'), 'data': row}, status=201)


# ---------------------------------------------------------------------------
# /api/products/<id>/  – retrieve, update, delete
# ---------------------------------------------------------------------------

class ProductDetailView(APIView):

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAdminSupabaseUser()]

    def _validate_id(self, id: str):
        """Return an error Response if `id` looks invalid, else None."""
        if not id or id.strip() == '':
            return Response({'error': 'Product ID is required.'}, status=400)
        # IDs can be UUID or any non-empty TEXT string – just reject obviously
        # bad values (empty / too long).
        if len(id) > 200:
            return Response({'error': 'Invalid product ID.'}, status=400)
        return None

    def get(self, request, id: str):
        """GET /api/products/<id>/"""
        err = self._validate_id(id)
        if err:
            return err

        supabase = get_supabase_client()
        try:
            res = supabase.table('products').select('*').eq('id', id).execute()
        except Exception as exc:
            return Response({'error': f'Database error: {exc}'}, status=500)

        if not res.data:
            return Response({'error': 'Product not found.'}, status=404)

        return Response({'data': res.data[0]})

    def put(self, request, id: str):
        """PUT /api/products/<id>/ – update product fields."""
        err = self._validate_id(id)
        if err:
            return err

        supabase = get_supabase_client()

        # Verify existence first
        try:
            check = supabase.table('products').select('id').eq('id', id).execute()
        except Exception as exc:
            return Response({'error': f'Database error: {exc}'}, status=500)

        if not check.data:
            return Response({'error': 'Product not found.'}, status=404)

        data = dict(request.data or {})

        if not data:
            return Response({'error': 'No fields provided to update.'}, status=400)

        # ── Validate price if provided ────────────────────────────────────────
        if 'price' in data:
            price, price_err = _parse_positive_number(data['price'], 'price')
            if price_err:
                return Response({'error': price_err}, status=400)
            data['price'] = price

        # ── Validate stock if provided ────────────────────────────────────────
        if 'stock' in data:
            stock, stock_err = _parse_positive_number(data['stock'], 'stock')
            if stock_err:
                return Response({'error': stock_err}, status=400)
            data['stock'] = int(stock)

        # ── Normalise array fields if provided as comma-separated strings ─────
        if 'sizes' in data and isinstance(data['sizes'], str):
            data['sizes'] = [s.strip() for s in data['sizes'].split(',') if s.strip()]
        if 'colors' in data and isinstance(data['colors'], str):
            data['colors'] = [c.strip() for c in data['colors'].split(',') if c.strip()]

        # Protect immutable fields
        data.pop('id', None)
        data.pop('created_at', None)
        data.pop('created_by', None)

        data['updated_at'] = datetime.utcnow().isoformat() + 'Z'

        try:
            res = supabase.table('products').update(data).eq('id', id).execute()
        except Exception as exc:
            return Response({'error': f'Database error: {exc}'}, status=500)

        row = res.data[0] if res.data else {**data, 'id': id}
        return Response({'id': id, 'data': row})

    def delete(self, request, id: str):
        """DELETE /api/products/<id>/"""
        err = self._validate_id(id)
        if err:
            return err

        supabase = get_supabase_client()

        try:
            check = supabase.table('products').select('id').eq('id', id).execute()
        except Exception as exc:
            return Response({'error': f'Database error: {exc}'}, status=500)

        if not check.data:
            return Response({'error': 'Product not found.'}, status=404)

        try:
            supabase.table('products').delete().eq('id', id).execute()
        except Exception as exc:
            return Response({'error': f'Database error: {exc}'}, status=500)

        # Return 200 with confirmation body (204 drops the body silently)
        return Response({'deleted': True, 'id': id}, status=200)
