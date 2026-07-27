from datetime import datetime

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.db import get_supabase_client


def _get_uid(request) -> str | None:
    return request.user.get('uid') if hasattr(request, 'user') else None


def _success(message: str, data: dict, status: int = 200):
    return Response({'success': True, 'message': message, 'data': data}, status=status)


def _validation(errors: dict, status: int = 400):
    return Response({'success': False, 'errors': errors}, status=status)


def _error(message: str, status: int = 500):
    return Response({'success': False, 'message': message}, status=status)


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_or_create_profile(self, supabase, uid: str, email: str | None, full_name: str | None):
        res = supabase.table('profiles').select('*').eq('id', uid).execute()
        if res.data:
            return dict(res.data[0])

        now_iso = datetime.utcnow().isoformat() + 'Z'
        payload = {
            'id': uid,
            'user_id': uid,
            'email': email,
            'full_name': full_name,
            'created_at': now_iso,
            'updated_at': now_iso,
        }

        # Avoid duplicates via PK conflict on `id`
        upsert_res = supabase.table('profiles').upsert(payload, on_conflict='id').execute()
        if upsert_res.data:
            return dict(upsert_res.data[0])

        return payload

    def get(self, request):
        supabase = get_supabase_client()

        uid = _get_uid(request)
        if not uid:
            return _error('Missing uid', status=400)

        email = request.user.get('email') if hasattr(request, 'user') else None
        full_name = request.user.get('full_name') if hasattr(request, 'user') else None

        existed = bool(supabase.table('profiles').select('id').eq('id', uid).execute().data)
        profile = self._get_or_create_profile(supabase, uid=uid, email=email, full_name=full_name)

        if not existed:
            print(f"profile auto-created uid={uid}")

        return _success('Profile retrieved.', profile, status=200)

    def put(self, request):
        supabase = get_supabase_client()

        uid = _get_uid(request)
        if not uid:
            return _error('Missing uid', status=400)

        payload = request.data
        if payload is None:
            return _validation({'body': 'Body is required.'}, status=400)
        if not isinstance(payload, dict):
            return _validation({'body': 'Invalid JSON body'}, status=400)

        # Never accept user_id from the request body.
        if payload.get('user_id') is not None:
            return _validation({'user_id': 'user_id cannot be set by the client.'}, status=400)

        # Also never accept changing `id`
        if 'id' in payload and payload.get('id') != uid:
            return _validation({'id': 'id cannot be changed by client.'}, status=400)

        payload.pop('user_id', None)
        payload.pop('addresses', None)
        payload.pop('id', None)

        errors: dict[str, str] = {}

        full_name = payload.get('full_name')
        if full_name is None or not str(full_name).strip():
            errors['full_name'] = 'Full name is required.'
        else:
            full_name = str(full_name).strip()
            if len(full_name) > 100:
                errors['full_name'] = 'Full name must be at most 100 characters.'

        phone = payload.get('phone', None)
        if phone is not None and str(phone).strip() != '':
            phone_str = str(phone).strip()
            if ''.join([c for c in phone_str if c.isdigit()]) != phone_str:
                errors['phone'] = 'Phone must contain digits only.'
            else:
                if not (10 <= len(phone_str) <= 15):
                    errors['phone'] = 'Phone length must be between 10 and 15 digits.'
                phone = phone_str
        else:
            phone = None

        gender = payload.get('gender', None)
        if gender is None:
            errors['gender'] = 'Gender is required.'
        else:
            gender_str = str(gender).strip()
            allowed = {
                'Male',
                'Female',
                'Other',
                'Prefer not to say',
                'male',
                'female',
                'other',
                'prefer not to say',
                'prefer_not_to_say',
                'prefer-not-to-say',
            }
            if gender_str not in allowed:
                # normalize common inputs
                gl = gender_str.lower().replace('_', ' ').replace('-', ' ')
                mapping = {
                    'male': 'Male',
                    'female': 'Female',
                    'other': 'Other',
                    'prefer not to say': 'Prefer not to say',
                }
                if gl in mapping:
                    gender = mapping[gl]
                else:
                    errors['gender'] = 'Gender must be one of: Male, Female, Other, Prefer not to say.'
            else:
                if gender_str.lower() in ['male']:
                    gender = 'Male'
                elif gender_str.lower() in ['female']:
                    gender = 'Female'
                elif gender_str.lower() in ['other']:
                    gender = 'Other'
                elif gender_str.lower().replace('_', ' ').replace('-', ' ') in ['prefer not to say']:
                    gender = 'Prefer not to say'

        dob = payload.get('date_of_birth', None)
        if dob is None or str(dob).strip() == '':
            errors['date_of_birth'] = 'date_of_birth is required.'
        else:
            dob_str = str(dob).strip()
            try:
                dob_dt = datetime.fromisoformat(dob_str)
                if dob_dt.date() > datetime.utcnow().date():
                    errors['date_of_birth'] = 'date_of_birth cannot be in the future.'
            except ValueError:
                errors['date_of_birth'] = 'date_of_birth must be a valid ISO date (YYYY-MM-DD).'

        if errors:
            print(f"profile validation failed uid={uid} errors={errors}")
            return _validation(errors, status=400)

        # Ensure profile exists
        self._get_or_create_profile(
            supabase,
            uid=uid,
            email=request.user.get('email') if hasattr(request, 'user') else None,
            full_name=request.user.get('full_name') if hasattr(request, 'user') else None,
        )

        update_payload = {
            'id': uid,
            'user_id': uid,
            'full_name': full_name,
            'phone': phone,
            'gender': gender,
            'date_of_birth': str(dob).strip(),
            'updated_at': datetime.utcnow().isoformat() + 'Z',
        }

        try:
            res = supabase.table('profiles').upsert(update_payload, on_conflict='id').execute()
            row = res.data[0] if res.data else update_payload
            print(f"profile updated uid={uid}")
            return _success('Profile updated successfully.', row, status=200)
        except Exception:
            print(f"profile update failed uid={uid}")
            return _error('Internal server error', status=500)

