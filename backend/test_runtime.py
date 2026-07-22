import json
import urllib.request
import urllib.error

print("=== STARTING RUNTIME EXECUTION VERIFICATION ===")

# 1. Health Check
res = urllib.request.urlopen("http://localhost:8001/api/health")
print("1. Health Check Status:", res.status, res.read().decode())

# 2. Registration
req = urllib.request.Request(
    "http://localhost:8001/api/auth/register",
    data=json.dumps({
        "username": "AuditAgent88",
        "email": "auditagent88@nexus.io",
        "password": "Password123!"
    }).encode(),
    headers={"Content-Type": "application/json"}
)
res = urllib.request.urlopen(req)
body = json.loads(res.read().decode())
print("2. Registration Status:", res.status, "User ID:", body["user"]["id"], "OTP:", body.get("verification_token_demo"))

# 3. OTP Verification
req = urllib.request.Request(
    "http://localhost:8001/api/auth/verify-email",
    data=json.dumps({
        "email": "auditagent88@nexus.io",
        "token": body["verification_token_demo"]
    }).encode(),
    headers={"Content-Type": "application/json"}
)
res = urllib.request.urlopen(req)
print("3. Verification Status:", res.status, res.read().decode())

# 4. Login & JWT Issuance
req = urllib.request.Request(
    "http://localhost:8001/api/auth/login",
    data=json.dumps({
        "email": "auditagent88@nexus.io",
        "password": "Password123!",
        "remember_me": True
    }).encode(),
    headers={"Content-Type": "application/json"}
)
res = urllib.request.urlopen(req)
login_data = json.loads(res.read().decode())
jwt_token = login_data["token"]
print("4. Login Status:", res.status, "JWT Issued:", jwt_token[:30] + "...")

# 5. Authenticated /auth/me Request with Valid JWT
req = urllib.request.Request(
    "http://localhost:8001/api/auth/me",
    headers={"Authorization": f"Bearer {jwt_token}"}
)
res = urllib.request.urlopen(req)
print("5. Protected Endpoint Access Status:", res.status, res.read().decode())

# 6. Rejection of Invalid Token (mock_session_token_123)
req = urllib.request.Request(
    "http://localhost:8001/api/auth/me",
    headers={"Authorization": "Bearer mock_session_token_123"}
)
try:
    urllib.request.urlopen(req)
except urllib.error.HTTPError as e:
    print("6. Invalid Token Rejection Status:", e.code, e.read().decode())

print("=== RUNTIME VERIFICATION COMPLETED ===")
