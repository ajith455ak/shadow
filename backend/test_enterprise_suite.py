import json
import urllib.request
import urllib.error

print("=== ENTERPRISE SUITE RUNTIME TEST ===")

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

# 2. 2FA Setup Request
req = urllib.request.Request(
    "http://localhost:8001/api/auth/2fa/setup",
    data=b"{}",
    headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {jwt_token}"
    }
)
res = urllib.request.urlopen(req)
tfa_data = json.loads(res.read().decode())
print("2. 2FA Setup Status:", res.status, "Secret:", tfa_data["secret"][:10] + "...", "Recovery Codes:", len(tfa_data["recovery_codes"]))

# 3. AI Assistant Query
req = urllib.request.Request(
    "http://localhost:8001/api/assistant/chat",
    data=json.dumps({"query": "What is the fastest way to breach Helix Corp?"}).encode(),
    headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {jwt_token}"
    }
)
res = urllib.request.urlopen(req)
ai_data = json.loads(res.read().decode())
print("3. AI Assistant Response Status:", res.status, "Reply:", ai_data["reply"])

# 4. Admin Audit Logs
req = urllib.request.Request(
    "http://localhost:8001/api/admin/audit-logs",
    headers={"Authorization": f"Bearer {jwt_token}"}
)
res = urllib.request.urlopen(req)
audit_data = json.loads(res.read().decode())
print("4. Admin Audit Logs Status:", res.status, "Logged Events Count:", len(audit_data["logs"]))

# 5. Admin Analytics
req = urllib.request.Request(
    "http://localhost:8001/api/admin/analytics",
    headers={"Authorization": f"Bearer {jwt_token}"}
)
res = urllib.request.urlopen(req)
analytics_data = json.loads(res.read().decode())
print("5. Admin Analytics Status:", res.status, "Metrics:", analytics_data["metrics"])

print("=== ENTERPRISE SUITE RUNTIME TEST COMPLETED SUCCESSFULLY ===")
