# TODO

- [x] Refactor Firebase Admin initialization to use `backend/firebase-admin-sdk.json` with `credentials.Certificate()`.
- [x] Update `backend/api/apps.py` to provide a single `_initialize_firebase_app()` helper.
- [x] Update `backend/api/auth.py` to remove env-var based initialization and call the shared helper.
- [x] Update `backend/api/views.py` to remove env-var based initialization and call the shared helper.

- [ ] Quick manual test: `GET /api/health/` and `POST /api/firestore-test/` with a valid Firebase ID token.
- [ ] Ensure `backend/firebase-admin-sdk.json` is the real Firebase service account JSON (not placeholders).


