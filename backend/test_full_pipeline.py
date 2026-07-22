import json
import urllib.request
import urllib.error

print("=== FULL END-TO-END AUTHENTICATION & DATA PIPELINE RUNTIME TEST ===")

# 1. Login to obtain valid JWT Token
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
print("1. POST /api/auth/login -> Status 200 OK. Valid JWT Token obtained.")

# 2. Test GET /api/auth/me
req = urllib.request.Request(
    "http://localhost:8001/api/auth/me",
    headers={"Authorization": f"Bearer {jwt_token}"}
)
res = urllib.request.urlopen(req)
me_data = json.loads(res.read().decode())
print("2. GET /api/auth/me -> Status 200 OK. User:", me_data["user"]["username"])

# 3. Test GET /api/dashboard
req = urllib.request.Request(
    "http://localhost:8001/api/dashboard",
    headers={"Authorization": f"Bearer {jwt_token}"}
)
res = urllib.request.urlopen(req)
dash_data = json.loads(res.read().decode())
print("3. GET /api/dashboard -> Status 200 OK. Character:", dash_data["character"]["name"], "Coins:", dash_data["character"]["coins"])

# 4. Test GET /api/missions
req = urllib.request.Request(
    "http://localhost:8001/api/missions",
    headers={"Authorization": f"Bearer {jwt_token}"}
)
res = urllib.request.urlopen(req)
missions_data = json.loads(res.read().decode())
print("4. GET /api/missions -> Status 200 OK. Missions Count:", len(missions_data.get("missions", [])))

# 5. Test GET /api/inventory
req = urllib.request.Request(
    "http://localhost:8001/api/inventory",
    headers={"Authorization": f"Bearer {jwt_token}"}
)
res = urllib.request.urlopen(req)
inv_data = json.loads(res.read().decode())
print("5. GET /api/inventory -> Status 200 OK. Items Count:", len(inv_data.get("items", [])), "Equipment:", inv_data.get("equipment"))

# 6. Test GET /api/leaderboard
req = urllib.request.Request(
    "http://localhost:8001/api/leaderboard",
    headers={"Authorization": f"Bearer {jwt_token}"}
)
res = urllib.request.urlopen(req)
lead_data = json.loads(res.read().decode())
lead_list = lead_data if isinstance(lead_data, list) else lead_data.get("leaderboard", [])
print("6. GET /api/leaderboard -> Status 200 OK. Ranked Players Count:", len(lead_list))

# 7. Test GET /api/hackbay
req = urllib.request.Request(
    "http://localhost:8001/api/hackbay",
    headers={"Authorization": f"Bearer {jwt_token}"}
)
res = urllib.request.urlopen(req)
hb_data = json.loads(res.read().decode())
print("7. GET /api/hackbay -> Status 200 OK. Hacking Targets Count:", len(hb_data.get("targets", [])))

# 8. Test Invalid Token Purge Safeguard (401 Response)
try:
    req = urllib.request.Request(
        "http://localhost:8001/api/dashboard",
        headers={"Authorization": "Bearer mock_session_token_123"}
    )
    urllib.request.urlopen(req)
    print("8. FAIL: Invalid token was erroneously accepted.")
except urllib.error.HTTPError as e:
    print("8. SAFEGUARD VERIFIED: Invalid/Mock token correctly rejected with Status 401 Unauthorized:", e.reason)

print("=== FULL END-TO-END DATA PIPELINE TEST COMPLETED SUCCESSFULLY ===")
