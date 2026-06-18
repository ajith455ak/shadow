import asyncio
import time
import random
import sys
import os
from typing import List

try:
    import psutil
    import httpx
except ImportError:
    print("Please make sure psutil and httpx are installed.")
    sys.exit(1)

BASE_URL = "http://localhost:8001/api"

class Stats:
    def __init__(self):
        self.all_latencies = []
        self.success_count = 0
        self.failure_count = 0

    def record(self, latency_ms: float, success: bool):
        self.all_latencies.append(latency_ms)
        if success:
            self.success_count += 1
        else:
            self.failure_count += 1

global_stats = Stats()
lock = asyncio.Lock()

async def worker(worker_id: int, stop_time: float):
    # To avoid creating too many users, each worker will create one user context
    # and then continually query dashboard, npcs, inventory, skills, etc.
    async with httpx.AsyncClient(timeout=15.0) as client:
        rand_val = random.randint(100000, 999999)
        username = f"load_u_{worker_id}_{rand_val}"
        email = f"load_e_{worker_id}_{rand_val}@loadtest.com"
        password = "SecurePassword123!"

        # Register
        start = time.monotonic()
        try:
            r = await client.post(f"{BASE_URL}/auth/register", json={
                "username": username,
                "email": email,
                "password": password
            })
            success = r.status_code == 200
            latency = (time.monotonic() - start) * 1000.0
            async with lock:
                global_stats.record(latency, success)
            if not success:
                return
            otp = r.json().get("verification_token_demo")
        except Exception:
            latency = (time.monotonic() - start) * 1000.0
            async with lock:
                global_stats.record(latency, False)
            return

        # Verify
        start = time.monotonic()
        try:
            r = await client.post(f"{BASE_URL}/auth/verify-email", json={
                "email": email,
                "token": otp
            })
            success = r.status_code == 200
            latency = (time.monotonic() - start) * 1000.0
            async with lock:
                global_stats.record(latency, success)
            if not success:
                return
        except Exception:
            latency = (time.monotonic() - start) * 1000.0
            async with lock:
                global_stats.record(latency, False)
            return

        # Login
        start = time.monotonic()
        try:
            r = await client.post(f"{BASE_URL}/auth/login", json={
                "email": email,
                "password": password
            })
            success = r.status_code == 200
            latency = (time.monotonic() - start) * 1000.0
            async with lock:
                global_stats.record(latency, success)
            if not success:
                return
            token = r.json().get("token")
        except Exception:
            latency = (time.monotonic() - start) * 1000.0
            async with lock:
                global_stats.record(latency, False)
            return

        headers = {"Authorization": f"Bearer {token}"}

        # Create Character
        start = time.monotonic()
        try:
            r = await client.post(f"{BASE_URL}/character", headers=headers, json={
                "name": f"c_{worker_id}_{rand_val}",
                "avatar_id": "avatar_1",
                "cyber_class": "penetration_tester"
            })
            success = r.status_code == 200
            latency = (time.monotonic() - start) * 1000.0
            async with lock:
                global_stats.record(latency, success)
        except Exception:
            latency = (time.monotonic() - start) * 1000.0
            async with lock:
                global_stats.record(latency, False)

        # Loop until stop time is reached
        endpoints = [
            ("GET", "/dashboard"),
            ("GET", "/npcs"),
            ("GET", "/leaderboard"),
            ("GET", "/skills"),
            ("GET", "/inventory")
        ]

        while time.monotonic() < stop_time:
            method, path = random.choice(endpoints)
            start = time.monotonic()
            try:
                if method == "GET":
                    r = await client.get(f"{BASE_URL}{path}", headers=headers)
                success = r.status_code == 200
                latency = (time.monotonic() - start) * 1000.0
                async with lock:
                    global_stats.record(latency, success)
            except Exception:
                latency = (time.monotonic() - start) * 1000.0
                async with lock:
                    global_stats.record(latency, False)
            
            # small delay to prevent immediate server thrashing
            await asyncio.sleep(0.01)

async def main():
    concurrency = 100
    duration = 60 # seconds
    print(f"Starting baseline load test with {concurrency} virtual users for {duration} seconds...")
    
    start_time = time.monotonic()
    stop_time = start_time + duration

    tasks = [asyncio.create_task(worker(i, stop_time)) for i in range(concurrency)]
    await asyncio.gather(*tasks)

    actual_duration = time.monotonic() - start_time
    total_requests = global_stats.success_count + global_stats.failure_count
    
    rps = total_requests / actual_duration if actual_duration > 0 else 0
    
    if global_stats.all_latencies:
        avg_latency = sum(global_stats.all_latencies) / len(global_stats.all_latencies)
        min_latency = min(global_stats.all_latencies)
        max_latency = max(global_stats.all_latencies)
    else:
        avg_latency = min_latency = max_latency = 0.0

    print("\n" + "="*50)
    print("BASELINE LOAD TESTING REPORT")
    print("="*50)
    print(f"Target Concurrency : {concurrency} virtual users")
    print(f"Target Duration    : {duration} seconds")
    print(f"Actual Duration    : {actual_duration:.2f} seconds")
    print(f"Total Requests     : {total_requests}")
    print(f"Successful Requests: {global_stats.success_count}")
    print(f"Failed Requests    : {global_stats.failure_count}")
    print(f"Error Rate         : {(global_stats.failure_count / total_requests * 100.0) if total_requests > 0 else 0.0:.2f}%")
    print("-"*50)
    print("Requests per second (RPS)")
    print(f"RPS: {rps:.2f} req/sec")
    print("-"*50)
    print("Response Time")
    print(f"Average: {avg_latency:.2f}ms")
    print(f"Min    : {min_latency:.2f}ms")
    print(f"Max    : {max_latency:.2f}ms")
    print("="*50)

    # Also save to UTF-8 file
    report_path = r"C:\Users\ajith kumar\.gemini\antigravity-ide\scratch\baseline_load_test_report.txt"
    parent_dir = os.path.dirname(report_path)
    if not os.path.exists(parent_dir):
        report_path = "baseline_load_test_report.txt"
    try:
        with open(report_path, "w", encoding="utf-8") as f:
            f.write("="*50 + "\n")
            f.write("📋 BASELINE LOAD TESTING REPORT\n")
            f.write("="*50 + "\n")
            f.write(f"Target Concurrency : {concurrency} virtual users\n")
            f.write(f"Target Duration    : {duration} seconds\n")
            f.write(f"Actual Duration    : {actual_duration:.2f} seconds\n")
            f.write(f"Total Requests     : {total_requests}\n")
            f.write(f"Successful Requests: {global_stats.success_count}\n")
            f.write(f"Failed Requests    : {global_stats.failure_count}\n")
            f.write(f"Error Rate         : {(global_stats.failure_count / total_requests * 100.0) if total_requests > 0 else 0.0:.2f}%\n")
            f.write("-"*50 + "\n")
            f.write("📊 Requests per second (RPS)\n")
            f.write(f"RPS: {rps:.2f} req/sec\n")
            f.write("-"*50 + "\n")
            f.write("⏱️ Response Time\n")
            f.write(f"Average: {avg_latency:.2f}ms\n")
            f.write(f"Min    : {min_latency:.2f}ms\n")
            f.write(f"Max    : {max_latency:.2f}ms\n")
            f.write("="*50 + "\n")
    except Exception as e:
        print(f"Could not save report file: {e}")

if __name__ == "__main__":
    asyncio.run(main())
