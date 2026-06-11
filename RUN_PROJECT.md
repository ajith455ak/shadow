# Run Project

## Frontend

1. Copy `frontend/.env.example` to `frontend/.env` and keep `EXPO_PUBLIC_BACKEND_URL` pointed at the API you want to use.
2. From `frontend`, run `yarn install`.
3. Start the web app with `yarn web`.

The web app is verified at `http://localhost:8081`.

## Backend

1. Copy `backend/.env.example` to `backend/.env`.
2. Start a local MongoDB server, or point `MONGO_URL` at an existing MongoDB instance.
3. From `backend`, run `python -m uvicorn server:app --reload --port 8001`.

The backend cannot boot without a working MongoDB connection because `server.py` reads `MONGO_URL`, `DB_NAME`, and `JWT_SECRET` at import time.

## Notes

- Expo Doctor is clean after the dependency and config fixes.
- The frontend dependency tree now uses `ws@8.21.0`, which resolves the Expo websocket startup crash seen on the earlier install.
- Android tooling is not installed on this machine (`adb`/`emulator` are unavailable), so Android launch could not be verified here.