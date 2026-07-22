import json
import urllib.request
import urllib.error

print("=== PUSH NOTIFICATION API RUNTIME TEST ===")

# 1. Login to get token
req = urllib.request.Request(
    "http://localhost:8001/api/auth/login",
    data=json.dumps({
        "email": "testagent99@nexus.io",
        "password": "Password123!",
        "remember_me": True
    }).encode(),
    headers={"Content-Type": "application/json"}
)
res = urllib.request.urlopen(req)
login_data = json.loads(res.read().decode())
jwt_token = login_data["token"]
print("1. Login Success — JWT Token obtained.")

# 2. Register Push Token
fake_push_token = "ExponentPushToken[TestToken123456789]"
req = urllib.request.Request(
    "http://localhost:8001/api/push/register",
    data=json.dumps({
        "expo_push_token": fake_push_token,
        "device_name": "Test Android Device",
        "platform": "android"
    }).encode(),
    headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {jwt_token}"
    }
)
res = urllib.request.urlopen(req)
print("2. Push Register Status:", res.status, res.read().decode())

# 3. Get Registered Tokens
req = urllib.request.Request(
    "http://localhost:8001/api/push/me",
    headers={"Authorization": f"Bearer {jwt_token}"}
)
res = urllib.request.urlopen(req)
tokens_data = json.loads(res.read().decode())
print("3. Push Me Registered Tokens:", res.status, tokens_data)

# 4. Dispatch Test Push Alert
req = urllib.request.Request(
    "http://localhost:8001/api/push/test",
    data=b"{}",
    headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {jwt_token}"
    }
)
res = urllib.request.urlopen(req)
print("4. Push Test Dispatch Result:", res.status, res.read().decode())

# 5. Unregister Push Token
req = urllib.request.Request(
    "http://localhost:8001/api/push/unregister",
    data=json.dumps({"expo_push_token": fake_push_token}).encode(),
    headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {jwt_token}"
    }
)
res = urllib.request.urlopen(req)
print("5. Push Unregister Status:", res.status, res.read().decode())

print("=== PUSH NOTIFICATION API RUNTIME TEST COMPLETED ===")
