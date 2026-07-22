import json
import urllib.request

print("=== GAMEPLAY ENGINE RUNTIME TEST ===")

# 1. Login to get JWT Token
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

# 2. Get Missions List
req = urllib.request.Request(
    "http://localhost:8001/api/missions",
    headers={"Authorization": f"Bearer {jwt_token}"}
)
res = urllib.request.urlopen(req)
missions_data = json.loads(res.read().decode())
missions_list = missions_data.get("missions", [])
print("2. GET /api/missions Status:", res.status, "Seeded Missions Count:", len(missions_list))

# 3. Accept Mission m1
if missions_list:
    m_id = missions_list[0]["id"]
    req = urllib.request.Request(
        f"http://localhost:8001/api/missions/{m_id}/accept",
        data=b"{}",
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {jwt_token}"
        }
    )
    res = urllib.request.urlopen(req)
    accept_data = json.loads(res.read().decode())
    print(f"3. Accept Mission '{m_id}' Status:", res.status, "Response:", accept_data)

    # 4. Complete Mission m1
    req = urllib.request.Request(
        f"http://localhost:8001/api/missions/{m_id}/complete",
        data=b"{}",
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {jwt_token}"
        }
    )
    res = urllib.request.urlopen(req)
    complete_data = json.loads(res.read().decode())
    print(f"4. Complete Mission '{m_id}' Status:", res.status, "Response:", complete_data)

# 5. Get Daily Challenges
req = urllib.request.Request(
    "http://localhost:8001/api/daily-challenges",
    headers={"Authorization": f"Bearer {jwt_token}"}
)
res = urllib.request.urlopen(req)
daily_data = json.loads(res.read().decode())
print("5. GET /api/daily-challenges Status:", res.status, "Daily Challenges Count:", len(daily_data.get("daily_challenges", [])))

print("=== GAMEPLAY ENGINE RUNTIME TEST COMPLETED SUCCESSFULLY ===")
