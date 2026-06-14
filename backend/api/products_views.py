from datetime import datetime

from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.apps import _initialize_firebase_app

from firebase_admin import firestore


def _get_uid(request) -> str | None:
    return request.user.get('uid') if hasattr(request, 'user') else None


from api.permissions import IsAdminFirebaseUser


class ProductsView(APIView):
    permission_classes = [IsAdminFirebaseUser]

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAdminFirebaseUser()]






    def get(self, request):
        """GET /api/products/

        Supports query filters (Firestore-friendly):
        - search: substring match on `name` or `title` (client-side fallback)
        - category: exact match on `category`
        - min_price / max_price: numeric range on `price`
        - size: array-contains on `sizes`
        - color: array-contains on `colors`
        - sort: asc|desc by `price`

        Note: Firestore limitations apply (range + array filters may require indexes).
        """
        _initialize_firebase_app()
        db = firestore.client()

        q = db.collection('products')

        params = request.query_params or {}
        search = (params.get('search') or '').strip().lower()
        category = (params.get('category') or '').strip()
        min_price = params.get('min_price')
        max_price = params.get('max_price')
        size = (params.get('size') or '').strip()
        color = (params.get('color') or '').strip()
        sort = (params.get('sort') or '').strip().lower()

        if category:
            q = q.where('category', '==', category)

        # Range on price
        if min_price is not None and min_price != '':
            try:
                q = q.where('price', '>=', float(min_price))
            except Exception:
                pass
        if max_price is not None and max_price != '':
            try:
                q = q.where('price', '<=', float(max_price))
            except Exception:
                pass

        # Array contains
        if size:
            q = q.where('sizes', 'array_contains', size)
        if color:
            q = q.where('colors', 'array_contains', color)

        if sort in ['asc', 'desc']:
            q = q.order_by('price', direction=firestore.Query.DESCENDING if sort == 'desc' else firestore.Query.ASCENDING)
        else:
            q = q.limit(200)

        docs = q.stream()
        items = []
        for doc in docs:
            data = doc.to_dict() or {}
            data['id'] = doc.id

            if search:
                name = (data.get('name') or data.get('title') or '').lower()
                if search not in name:
                    continue

            items.append(data)

        return Response({'items': items, 'count': len(items)})


    def post(self, request):
        """POST /api/products/ - create document in `products` collection."""
        _initialize_firebase_app()
        db = firestore.client()

        payload = request.data or {}
        created_by = _get_uid(request)
        if created_by:
            payload.setdefault('createdBy', created_by)

        payload.setdefault('createdAt', datetime.utcnow().isoformat() + 'Z')

        doc_ref = db.collection('products').document()
        doc_ref.set(payload)

        return Response({'id': doc_ref.id, 'data': payload}, status=201)


class ProductDetailView(APIView):
    permission_classes = [IsAdminFirebaseUser]

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return super().get_permissions()


    def get(self, request, id: str):

        """GET /api/products/{id}/ - fetch a single document."""
        _initialize_firebase_app()
        db = firestore.client()

        doc_ref = db.collection('products').document(id)
        snap = doc_ref.get()
        if not snap.exists:
            return Response({'error': 'Not found'}, status=404)

        data = snap.to_dict() or {}
        data['id'] = snap.id
        return Response({'data': data})

    def put(self, request, id: str):
        """PUT /api/products/{id}/ - replace document fields."""
        _initialize_firebase_app()
        db = firestore.client()

        payload = request.data or {}

        doc_ref = db.collection('products').document(id)
        if not doc_ref.get().exists:
            return Response({'error': 'Not found'}, status=404)

        payload.setdefault('updatedAt', datetime.utcnow().isoformat() + 'Z')

        doc_ref.set(payload)
        return Response({'id': id, 'data': payload})

    def delete(self, request, id: str):
        """DELETE /api/products/{id}/ - delete a document."""
        _initialize_firebase_app()
        db = firestore.client()

        doc_ref = db.collection('products').document(id)
        snap = doc_ref.get()
        if not snap.exists:
            return Response({'error': 'Not found'}, status=404)

        doc_ref.delete()
        return Response({'deleted': True, 'id': id}, status=204)

