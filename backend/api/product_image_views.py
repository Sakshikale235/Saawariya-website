import imghdr
from datetime import datetime

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.apps import _initialize_firebase_app
from api.permissions import IsAdminFirebaseUser

from firebase_admin import storage, firestore


ALLOWED_CONTENT_TYPES = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
}

MAX_BYTES = 5 * 1024 * 1024  # 5MB


def _get_uid(request):
    return request.user.get('uid') if hasattr(request, 'user') else None


def _guess_extension_from_bytes(data: bytes) -> str | None:
    # imghdr is limited; still useful as a fallback.
    kind = imghdr.what(None, h=data)
    if not kind:
        return None
    return kind


class ProductImageUploadView(APIView):
    """Admin-only image upload for a product.

    POST /api/products/<id>/image/
    multipart/form-data: field name 'image'

    Saves download URL to products/<id>.image_url
    """

    permission_classes = [IsAdminFirebaseUser]

    def post(self, request, id: str):
        _initialize_firebase_app()
        db = firestore.client()

        file_obj = request.FILES.get('image')
        if not file_obj:
            return Response({'error': "Missing file field: 'image'"}, status=400)

        content_type = getattr(file_obj, 'content_type', None)
        if content_type not in ALLOWED_CONTENT_TYPES:
            return Response({'error': 'Invalid content type'}, status=400)

        data = file_obj.read()
        if len(data) > MAX_BYTES:
            return Response({'error': 'File too large (max 5MB)'}, status=400)

        # Minimal type validation using header sniffing.
        # If it fails, reject.
        guessed = _guess_extension_from_bytes(data)
        expected_ext = ALLOWED_CONTENT_TYPES[content_type]
        if guessed and guessed != expected_ext:
            return Response({'error': 'File type mismatch'}, status=400)
        if not guessed:
            return Response({'error': 'Invalid image'}, status=400)

        ext = expected_ext
        uid = _get_uid(request) or 'unknown'

        bucket = storage.bucket()
        object_name = f'products/{id}/{uid}_{int(datetime.utcnow().timestamp())}.{ext}'
        blob = bucket.blob(object_name)

        blob.upload_from_string(data, content_type=content_type)

        # Public download URL if bucket allows, otherwise this returns a signed URL.
        # Minimal approach: generate a signed URL for safety.
        # Note: users should ensure the bucket rules allow signed URLs.
        image_url = blob.generate_signed_url(expiration=3600, method='GET')

        # Save to product doc
        doc_ref = db.collection('products').document(id)
        if not doc_ref.get().exists:
            return Response({'error': 'Not found'}, status=404)

        doc_ref.set({'image_url': image_url, 'updatedAt': datetime.utcnow().isoformat() + 'Z'}, merge=True)

        return Response({'uploaded': True, 'image_url': image_url}, status=201)

