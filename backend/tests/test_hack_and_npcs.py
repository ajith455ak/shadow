"""Backend tests for Shadow Nexus hacking + NPC + messenger features."""
import os
import uuid
import time
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://phantom-grid.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


# ---------- fixtures ----------
@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def user_ctx(session):
    """Register a fresh user + create character; return token+headers."""
    suffix = uuid.uuid4().hex[:8]
    email = f"test_{suffix}@nexus.io"
    payload = {"username": f"tu_{suffix}", "email": email, "password": "password123"}
    r = session.post(f"{API}/auth/register", json=payload, timeout=30)
    assert r.status_code == 200, r.text
    token = r.json()["token"]
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    # Create character
    cc = session.post(
        f"{API}/character",
        json={"name": f"Agent_{suffix}", "avatar_id": "avatar_1", "cyber_class": "penetration_tester"},
        headers=headers, timeout=30,
    )
    assert cc.status_code == 200, cc.text
    return {"token": token, "headers": headers, "email": email, "user_id": r.json()["user"]["id"]}


# ---------- previous endpoints regression ----------
class TestRegression:
    def test_root(self, session):
        r = session.get(f"{API}/")
        assert r.status_code == 200
        assert r.json()["app"] == "Shadow Nexus"

    def test_auth_me(self, session, user_ctx):
        r = session.get(f"{API}/auth/me", headers=user_ctx["headers"])
        assert r.status_code == 200
        assert r.json()["character"] is not None

    def test_character(self, session, user_ctx):
        r = session.get(f"{API}/character", headers=user_ctx["headers"])
        assert r.status_code == 200
        assert r.json()["cyber_class"] == "penetration_tester"

    def test_dashboard(self, session, user_ctx):
        r = session.get(f"{API}/dashboard", headers=user_ctx["headers"])
        assert r.status_code == 200
        assert "character" in r.json()

    def test_chapters(self, session, user_ctx):
        r = session.get(f"{API}/chapters", headers=user_ctx["headers"])
        assert r.status_code == 200 and len(r.json()) == 5

    def test_inventory(self, session, user_ctx):
        r = session.get(f"{API}/inventory", headers=user_ctx["headers"])
        assert r.status_code == 200

    def test_skills(self, session, user_ctx):
        r = session.get(f"{API}/skills", headers=user_ctx["headers"])
        assert r.status_code == 200

    def test_achievements(self, session, user_ctx):
        r = session.get(f"{API}/achievements", headers=user_ctx["headers"])
        assert r.status_code == 200

    def test_daily(self, session, user_ctx):
        r = session.get(f"{API}/daily-challenges", headers=user_ctx["headers"])
        assert r.status_code == 200 and len(r.json()) == 3

    def test_leaderboard(self, session):
        r = session.get(f"{API}/leaderboard")
        assert r.status_code == 200

    def test_combat(self, session, user_ctx):
        r = session.get(f"{API}/combat/m5", headers=user_ctx["headers"])
        assert r.status_code == 200

    def test_npc_history(self, session, user_ctx):
        r = session.get(f"{API}/npcs/nova/history", headers=user_ctx["headers"])
        assert r.status_code == 200


# ---------- NPCs ----------
class TestNPCs:
    def test_list_includes_new(self, session):
        r = session.get(f"{API}/npcs")
        assert r.status_code == 200
        npcs = r.json()
        ids = {n["id"] for n in npcs}
        # The "8 NPCs" requirement
        assert len(npcs) >= 8, f"Expected 8 NPCs got {len(npcs)}"
        for must in ("aria", "jin", "vector"):
            assert must in ids, f"Missing NPC {must}"
        for n in npcs:
            assert n.get("portrait", "").startswith("http"), f"{n['id']} missing portrait"
            assert "faction" in n and "hostile" in n and "tag" in n

    def test_npc_chat(self, session, user_ctx):
        r = session.post(f"{API}/npcs/chat",
                         json={"npc_id": "nova", "message": "Sitrep, Commander."},
                         headers=user_ctx["headers"], timeout=60)
        assert r.status_code == 200
        assert "reply" in r.json()

    def test_persuade_valid(self, session, user_ctx):
        r = session.post(f"{API}/npcs/persuade",
                         json={"npc_id": "jin", "approach": "sympathize"},
                         headers=user_ctx["headers"], timeout=60)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["approach"] == "sympathize"
        assert "delta" in data and "trust" in data and "reaction" in data
        # Verify trust persistence
        t = session.get(f"{API}/npcs/trust", headers=user_ctx["headers"])
        assert t.status_code == 200
        assert t.json()["trust"].get("jin") == data["trust"]
        # Verify reaction is non-fallback LLM (not static)
        assert data["reaction"] not in ("...", "[static]"), "LLM fallback returned"

    def test_persuade_invalid_approach(self, session, user_ctx):
        r = session.post(f"{API}/npcs/persuade",
                         json={"npc_id": "jin", "approach": "wave"},
                         headers=user_ctx["headers"])
        assert r.status_code == 400


# ---------- Messenger ----------
class TestMessenger:
    def test_seed_and_inbox(self, session, user_ctx):
        r = session.post(f"{API}/messenger/seed-tipoffs", headers=user_ctx["headers"])
        assert r.status_code == 200
        inbox = session.get(f"{API}/messenger/inbox", headers=user_ctx["headers"])
        assert inbox.status_code == 200
        msgs = inbox.json()["messages"]
        senders = {m["sender_npc"] for m in msgs}
        for s in ("jin", "vector", "cipher"):
            assert s in senders
        assert inbox.json()["unread"] >= 3

    def test_mark_read(self, session, user_ctx):
        r = session.post(f"{API}/messenger/read", headers=user_ctx["headers"])
        assert r.status_code == 200
        inbox = session.get(f"{API}/messenger/inbox", headers=user_ctx["headers"]).json()
        assert inbox["unread"] == 0


# ---------- Hacking ----------
class TestHack:
    def test_targets(self, session):
        r = session.get(f"{API}/hack/targets")
        assert r.status_code == 200
        d = r.json()
        assert len(d["targets"]) == 3
        labels = {s["id"] for s in d["stages"]}
        assert labels == {"recon", "exploit", "privesc", "exfil"}

    def test_full_chain_and_complete(self, session, user_ctx):
        h = user_ctx["headers"]
        # Start with helix_corp_perimeter
        r = session.post(f"{API}/hack/start",
                         json={"target": "helix_corp_perimeter"}, headers=h)
        assert r.status_code == 200
        sess = r.json()
        sid = sess["id"]
        assert sess["stage"] == "recon"
        assert len(sess["nodes"]) == 6
        ip = sess["target"]["ip"]

        # GET session
        g = session.get(f"{API}/hack/{sid}", headers=h)
        assert g.status_code == 200 and g.json()["id"] == sid

        # nmap → recon→exploit
        r = session.post(f"{API}/hack/cmd",
                         json={"session_id": sid, "command": f"nmap {ip}"}, headers=h)
        assert r.status_code == 200
        assert r.json()["stage"] == "exploit"
        assert "8080" in r.json()["discovered_ports"]

        # exploit wrong port stays in exploit
        r = session.post(f"{API}/hack/cmd",
                         json={"session_id": sid, "command": "exploit 22"}, headers=h)
        assert r.status_code == 200
        assert r.json()["stage"] == "exploit"
        assert r.json()["exploit_success"] is False

        # exploit 8080 → privesc
        r = session.post(f"{API}/hack/cmd",
                         json={"session_id": sid, "command": "exploit 8080"}, headers=h)
        assert r.status_code == 200
        d = r.json()
        assert d["exploit_success"] is True
        assert d["stage"] == "privesc"

        # puzzle
        p = session.get(f"{API}/hack/{sid}/puzzle", headers=h)
        assert p.status_code == 200
        puz = p.json()
        assert "options" in puz and len(puz["options"]) >= 2
        correct = puz["options"][0]
        # Wrong answer first
        bad = session.post(f"{API}/hack/inject",
                          json={"session_id": sid, "answer": "console.log(1)"}, headers=h)
        assert bad.status_code == 200 and bad.json()["ok"] is False
        # Correct answer
        good = session.post(f"{API}/hack/inject",
                           json={"session_id": sid, "answer": correct}, headers=h)
        assert good.status_code == 200 and good.json()["ok"] is True
        assert good.json()["session"]["code_puzzle_solved"] is True

        # crack progress
        cp = session.get(f"{API}/hack/{sid}/crack-progress", headers=h)
        assert cp.status_code == 200
        lines = cp.json()["lines"]
        # Extract candidate passwords from the lines (format: "<hash>  ← <pw>")
        candidates = [ln.split("←", 1)[-1].strip() for ln in lines if "←" in ln]
        assert len(candidates) >= 5
        # Wrong guess
        wrong = session.post(f"{API}/hack/crack",
                            json={"session_id": sid, "guess": "definitely_not"}, headers=h)
        assert wrong.status_code == 200 and wrong.json()["ok"] is False
        # Try each candidate to find the real one (dictionary list ALWAYS contains it)
        cracked = False
        for cand in candidates:
            r = session.post(f"{API}/hack/crack",
                            json={"session_id": sid, "guess": cand}, headers=h)
            assert r.status_code == 200
            if r.json()["ok"]:
                cracked = True
                assert r.json()["session"]["stage"] == "exfil"
                break
        assert cracked, "Real password not found in dictionary"

        # Complete should fail before exfil
        cf = session.post(f"{API}/hack/complete",
                         json={"target": sid}, headers=h)
        assert cf.status_code == 400

        # exfil command
        r = session.post(f"{API}/hack/cmd",
                         json={"session_id": sid, "command": "exfil"}, headers=h)
        assert r.status_code == 200
        assert r.json()["exfil_complete"] is True

        # baseline trust before complete
        t0 = session.get(f"{API}/npcs/trust", headers=h).json()["trust"]
        aria0 = t0.get("aria", 0)
        jin0 = t0.get("jin", 0)

        # complete
        ok = session.post(f"{API}/hack/complete",
                        json={"target": sid}, headers=h)
        assert ok.status_code == 200, ok.text
        data = ok.json()
        assert data["xp_gained"] == 350 and data["coins_gained"] == 200

        # trust changes (Helix → aria -25, jin +15)
        t1 = data["trust_changes"]
        assert t1.get("aria", 0) == aria0 - 25
        assert t1.get("jin", 0) == jin0 + 15

        # cannot claim twice
        again = session.post(f"{API}/hack/complete",
                            json={"target": sid}, headers=h)
        assert again.status_code == 400

        # Inbox should have BYTE celebration + ARIA threat
        inbox = session.get(f"{API}/messenger/inbox", headers=h).json()
        senders = {m["sender_npc"] for m in inbox["messages"]}
        assert "byte" in senders
        assert "aria" in senders

    def test_terminal_misc_commands(self, session, user_ctx):
        h = user_ctx["headers"]
        r = session.post(f"{API}/hack/start", json={"target": "phantom_relay"}, headers=h)
        sid = r.json()["id"]
        ip = r.json()["target"]["ip"]
        for cmd in ["help", f"ping {ip}", f"traceroute {ip}", "ls", "cat .bash_history",
                    "chmod 777 file", "map", "decrypt abcXYZ", "clear"]:
            rr = session.post(f"{API}/hack/cmd",
                             json={"session_id": sid, "command": cmd}, headers=h)
            assert rr.status_code == 200, f"Command {cmd} failed: {rr.text}"
