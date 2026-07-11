from datetime import datetime

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.db import get_supabase_client


class ReviewsByProductView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, product_id: str):
        supabase = get_supabase_client()

        res = supabase.table('reviews').select('*').eq('product_id', str(product_id)).execute()
        items = res.data or []

        return Response({'items': items})

    def post(self, request, product_id: str = None):
        supabase = get_supabase_client()

        uid = request.user.get('uid')
        payload = request.data or {}

        pid = product_id or payload.get('product_id')
        rating = payload.get('rating')
        review_text = payload.get('review_text')

        if not pid:
            return Response({'error': 'product_id is required'}, status=400)
        if rating is None:
            return Response({'error': 'rating is required'}, status=400)

        try:
            rating = float(rating)
        except Exception:
            return Response({'error': 'rating must be a number'}, status=400)

        data = {
            'product_id': str(pid),
            'profile_id': uid,
            'rating': rating,
            'review_text': review_text,
            'created_at': datetime.utcnow().isoformat() + 'Z',
        }

        res = supabase.table('reviews').insert(data).execute()
        row = res.data[0] if res.data else data
        return Response({'id': row.get('id'), 'data': row}, status=201)
