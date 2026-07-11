import io
from PIL import Image
from datetime import datetime

from rest_framework.response import Response
from rest_framework.views import APIView

from api.db import get_supabase_client
from api.permissions import IsAdminSupabaseUser


ALLOWED_CONTENT_TYPES = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
}

MAX_BYTES = 5 * 1024 * 1024  # 5 MB
BUCKET_NAME = 'product-images'


def _get_uid(request):
    return request.user.get('uid') if hasattr(request, 'user') else None


def _guess_extension_from_bytes(data: bytes) -> str | None:
    try:
        img = Image.open(io.BytesIO(data))
        fmt = (img.format or "").lower()
        if fmt == "jpeg":
            return "jpg"
        return fmt
    except Exception:
        return None


class ProductImageUploadView(APIView):
    """Admin-only image upload for a product.

    POST /api/products/<id>/image/
    multipart/form-data: field name 'image'

    Saves a signed URL (1 hour expiry) to products.image_url.
    Create the Supabase Storage bucket named 'product-images' before use.
    """

    permission_classes = [IsAdminSupabaseUser]

    def post(self, request, id: str):
        supabase = get_supabase_client()

        file_obj = request.FILES.get('image')
        if not file_obj:
            return Response({'error': "Missing file field: 'image'"}, status=400)

        content_type = getattr(file_obj, 'content_type', None)
        if content_type not in ALLOWED_CONTENT_TYPES:
            return Response({'error': 'Invalid content type'}, status=400)

        data = file_obj.read()
        if len(data) > MAX_BYTES:
            return Response({'error': 'File too large (max 5MB)'}, status=400)

        guessed = _guess_extension_from_bytes(data)
        expected_ext = ALLOWED_CONTENT_TYPES[content_type]
        if guessed and guessed != expected_ext:
            return Response({'error': 'File type mismatch'}, status=400)
        if not guessed:
            return Response({'error': 'Invalid image'}, status=400)

        # Verify product exists
        check = supabase.table('products').select('id').eq('id', id).execute()
        if not check.data:
            return Response({'error': 'Not found'}, status=404)

        uid = _get_uid(request) or 'unknown'
        ext = expected_ext
        object_name = f'products/{id}/{uid}_{int(datetime.utcnow().timestamp())}.{ext}'

        bucket = supabase.storage.from_(BUCKET_NAME)

        # Upload image bytes
        bucket.upload(
            path=object_name,
            file=data,
            file_options={"content-type": content_type, "upsert": "true"},
        )

        # Generate a signed URL valid for 1 hour (3600 seconds)
        signed = bucket.create_signed_url(object_name, expires_in=3600)
        image_url = signed.get('signedURL') or signed.get('signedUrl') or signed.get('signed_url')

        # Persist URL on the product row
        supabase.table('products').update({
            'image_url': image_url,
            'updated_at': datetime.utcnow().isoformat() + 'Z',
        }).eq('id', id).execute()

        return Response({'uploaded': True, 'image_url': image_url}, status=201)
