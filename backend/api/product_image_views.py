import io
from datetime import datetime

from PIL import Image
from rest_framework.response import Response
from rest_framework.views import APIView

from api.db import get_supabase_client
from api.permissions import IsAdminSupabaseUser


ALLOWED_CONTENT_TYPES = {
    'image/jpeg': 'jpg',
    'image/png':  'png',
    'image/webp': 'webp',
}

MAX_BYTES   = 5 * 1024 * 1024   # 5 MB
BUCKET_NAME = 'product-images'


def _get_uid(request):
    return request.user.get('uid') if hasattr(request, 'user') and isinstance(request.user, dict) else None


def _guess_extension_from_bytes(data: bytes) -> str | None:
    """Return the image format extension inferred from raw bytes, or None."""
    try:
        img = Image.open(io.BytesIO(data))
        fmt = (img.format or '').lower()
        return 'jpg' if fmt == 'jpeg' else fmt or None
    except Exception:
        return None


class ProductImageUploadView(APIView):
    """Admin-only image upload for a product.

    POST /api/products/<id>/image/
    Content-Type: multipart/form-data
    Form field   : image  (JPEG / PNG / WEBP, max 5 MB)

    Saves a public URL to products.image_url.
    Requires the Supabase Storage bucket 'product-images' to exist and be
    set to **public** (or grant public read via bucket policy).
    """

    permission_classes = [IsAdminSupabaseUser]

    def post(self, request, id: str):
        supabase = get_supabase_client()

        # ── Validate ID ───────────────────────────────────────────────────────
        if not id or not id.strip():
            return Response({'error': 'Product ID is required.'}, status=400)

        # ── Validate file field ───────────────────────────────────────────────
        file_obj = request.FILES.get('image')
        if not file_obj:
            return Response({'error': "Missing file field: 'image'."}, status=400)

        content_type = getattr(file_obj, 'content_type', None)
        if content_type not in ALLOWED_CONTENT_TYPES:
            return Response(
                {'error': f"Invalid content type '{content_type}'. Allowed: jpeg, png, webp."},
                status=400,
            )

        # ── Read and size-check ───────────────────────────────────────────────
        data = file_obj.read()
        if len(data) > MAX_BYTES:
            return Response({'error': 'File too large (max 5 MB).'}, status=400)
        if len(data) == 0:
            return Response({'error': 'Uploaded file is empty.'}, status=400)

        # ── Verify image bytes match declared content-type ────────────────────
        guessed     = _guess_extension_from_bytes(data)
        expected_ext = ALLOWED_CONTENT_TYPES[content_type]
        if not guessed:
            return Response({'error': 'Could not read uploaded file as a valid image.'}, status=400)
        if guessed != expected_ext:
            return Response(
                {'error': f'Content-type mismatch: declared {content_type} but file is {guessed}.'},
                status=400,
            )

        # ── Verify product exists ─────────────────────────────────────────────
        try:
            check = supabase.table('products').select('id').eq('id', id).execute()
        except Exception as exc:
            return Response({'error': f'Database error: {exc}'}, status=500)

        if not check.data:
            return Response({'error': 'Product not found.'}, status=404)

        # ── Build storage path ────────────────────────────────────────────────
        uid         = _get_uid(request) or 'unknown'
        ts          = int(datetime.utcnow().timestamp())
        object_name = f'products/{id}/{uid}_{ts}.{expected_ext}'

        bucket = supabase.storage.from_(BUCKET_NAME)

        # ── Upload ────────────────────────────────────────────────────────────
        try:
            bucket.upload(
                path=object_name,
                file=data,
                file_options={'content-type': content_type, 'upsert': 'true'},
            )
        except Exception as exc:
            return Response({'error': f'Storage upload failed: {exc}'}, status=500)

        # ── Build public URL (no expiry, preferred) ───────────────────────────
        try:
            public_resp = bucket.get_public_url(object_name)
            # SDK v2 returns a plain string; v1 may return a dict
            if isinstance(public_resp, str):
                image_url = public_resp
            elif isinstance(public_resp, dict):
                image_url = (
                    public_resp.get('publicURL')
                    or public_resp.get('publicUrl')
                    or public_resp.get('public_url')
                )
            else:
                image_url = str(public_resp)
        except Exception:
            # Fallback: generate a signed URL valid for 1 year (31 536 000 s)
            try:
                signed      = bucket.create_signed_url(object_name, expires_in=31_536_000)
                image_url   = (
                    signed.get('signedURL')
                    or signed.get('signedUrl')
                    or signed.get('signed_url')
                ) if isinstance(signed, dict) else str(signed)
            except Exception as exc2:
                return Response({'error': f'Failed to generate image URL: {exc2}'}, status=500)

        if not image_url:
            return Response({'error': 'Could not obtain a URL for the uploaded image.'}, status=500)

        # ── Persist URL on the product row ────────────────────────────────────
        try:
            supabase.table('products').update({
                'image_url':  image_url,
                'updated_at': datetime.utcnow().isoformat() + 'Z',
            }).eq('id', id).execute()
        except Exception as exc:
            # Upload succeeded but DB update failed – return both facts
            return Response(
                {
                    'uploaded':  True,
                    'image_url': image_url,
                    'warning':   f'Image uploaded but product record not updated: {exc}',
                },
                status=207,
            )

        return Response({'uploaded': True, 'image_url': image_url}, status=201)
