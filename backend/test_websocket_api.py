import asyncio
import json
import urllib.request
import websockets

async def test_websocket():
    print("=== WEBSOCKET ARCHITECTURE RUNTIME TEST ===")

    # 1. Obtain JWT token via HTTP login
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

    # 2. Connect via WebSocket to /ws/chat/c100?token=<jwt>
    ws_url = f"ws://localhost:8001/ws/chat/c100?token={jwt_token}"
    print(f"2. Connecting to WebSocket Endpoint: {ws_url}")

    async with websockets.connect(ws_url) as ws:
        print("3. WebSocket Handshake Successful — Connection Established!")

        # Send Ping over WebSocket
        await ws.send(json.dumps({"type": "ping"}))
        ping_resp = await ws.recv()
        print("4. WebSocket Ping-Pong Response Received:", ping_resp)

    print("=== WEBSOCKET RUNTIME TEST COMPLETED SUCCESSFULLY ===")

if __name__ == "__main__":
    asyncio.run(test_websocket())
