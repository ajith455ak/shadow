"""Shadow Nexus — Backend (FastAPI + MongoDB + Claude Sonnet 4.5 via Emergent)."""
from __future__ import annotations

import logging
import os
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

import bcrypt
import jwt
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, FastAPI, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field
from starlette.middleware.cors import CORSMiddleware

from seed_data import (
    ACHIEVEMENTS,
    AVATARS,
    CHAPTERS,
    CYBER_CLASSES,
    DAILY_TEMPLATES,
    ITEMS,
    MISSIONS,
    NPCS,
    SKILLS,
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ["JWT_SECRET"]
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")

JWT_ALG = "HS256"
JWT_EXPIRY_HOURS = 24
JWT_REMEMBER_DAYS = 30

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="Shadow Nexus API")
api = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("shadow_nexus")


# ---------- Models ----------
class RegisterIn(BaseModel):
    username: str = Field(min_length=3, max_length=24)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class LoginIn(BaseModel):
    email: EmailStr
    password: str
    remember_me: bool = False


class ForgotIn(BaseModel):
    email: EmailStr


class CharacterCreateIn(BaseModel):
    name: str = Field(min_length=2, max_length=24)
    avatar_id: str
    cyber_class: str


class MissionCompleteIn(BaseModel):
    mission_id: str
    won: bool = True  # for combat missions
    puzzle_correct: bool = True


class NPCChatIn(BaseModel):
    npc_id: str
    message: str


class PersuadeIn(BaseModel):
    npc_id: str
    approach: str  # 'flatter' | 'threaten' | 'bargain' | 'sympathize'


class HackStartIn(BaseModel):
    target: Optional[str] = None  # optional target name; otherwise random


class HackCmdIn(BaseModel):
    session_id: str
    command: str


class HackCrackIn(BaseModel):
    session_id: str
    guess: str  # password guess for cracker mini-game


class HackInjectIn(BaseModel):
    session_id: str
    answer: str  # code injection answer


class SkillUnlockIn(BaseModel):
    skill_id: str


class ItemUseIn(BaseModel):
    item_id: str


# ---------- Helpers ----------
def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False


def create_token(user_id: str, remember: bool = False) -> str:
    exp = utcnow() + (timedelta(days=JWT_REMEMBER_DAYS) if remember else timedelta(hours=JWT_EXPIRY_HOURS))
    payload = {"sub": user_id, "exp": exp, "iat": utcnow()}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def decode_token(tok: str) -> str:
    try:
        payload = jwt.decode(tok, JWT_SECRET, algorithms=[JWT_ALG])
        return payload["sub"]
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


async def get_current_user(creds: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Dict[str, Any]:
    if not creds:
        raise HTTPException(status_code=401, detail="Missing authentication")
    user_id = decode_token(creds.credentials)
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def xp_for_level(level: int) -> int:
    """XP required to reach this level (from level-1)."""
    return 100 * level + 50 * (level - 1) * level


def total_xp_for_level(level: int) -> int:
    return sum(xp_for_level(lv) for lv in range(1, level + 1))


def level_from_total_xp(total_xp: int) -> int:
    lv = 1
    while total_xp >= total_xp_for_level(lv + 1):
        lv += 1
        if lv > 99:
            break
    return lv


def fresh_character(user_id: str, name: str, avatar_id: str, cyber_class: str) -> Dict[str, Any]:
    klass = next((c for c in CYBER_CLASSES if c["id"] == cyber_class), CYBER_CLASSES[0])
    return {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "name": name,
        "avatar_id": avatar_id,
        "cyber_class": cyber_class,
        "level": 1,
        "xp": 0,
        "total_xp": 0,
        "coins": 100,
        "reputation": 0,
        "stats": dict(klass["starting_stats"]),
        "current_chapter": "ch1",
        "completed_missions": [],
        "inventory": ["nmap_basic", "energy_pack"],
        "equipment": {"head": None, "body": None, "tool": None},
        "unlocked_skills": [],
        "skill_points": 0,
        "achievements": [],
        "npc_relations": {},
        "stats_counters": {"missions": 0, "boss_kills": 0, "npc_chats": 0, "category": {}},
        "created_at": utcnow().isoformat(),
    }


def _serialize_character(c: Dict[str, Any]) -> Dict[str, Any]:
    c = {k: v for k, v in c.items() if k != "_id"}
    return c


def daily_seed_index(user_id: str, date_str: str, slot: int) -> int:
    h = abs(hash(f"{user_id}-{date_str}-{slot}")) % len(DAILY_TEMPLATES)
    return h


def todays_challenges(user_id: str) -> List[Dict[str, Any]]:
    date_str = utcnow().date().isoformat()
    chosen_ids = set()
    out = []
    for slot in range(3):
        i = daily_seed_index(user_id, date_str, slot)
        # ensure unique
        while DAILY_TEMPLATES[i]["id"] in chosen_ids:
            i = (i + 1) % len(DAILY_TEMPLATES)
        chosen_ids.add(DAILY_TEMPLATES[i]["id"])
        out.append({**DAILY_TEMPLATES[i], "date": date_str})
    return out


# ---------- Achievements check ----------
async def check_achievements(char: Dict[str, Any]) -> List[str]:
    """Returns list of newly awarded achievement IDs."""
    new_awards = []
    owned = set(char.get("achievements", []))
    counters = char.get("stats_counters", {})
    for ach in ACHIEVEMENTS:
        if ach["id"] in owned:
            continue
        trig = ach["trigger"]
        ok = False
        if trig.startswith("missions_completed:"):
            n = int(trig.split(":")[1])
            ok = counters.get("missions", 0) >= n
        elif trig.startswith("category:"):
            _, cat, n = trig.split(":")
            ok = counters.get("category", {}).get(cat, 0) >= int(n)
        elif trig.startswith("level:"):
            ok = char["level"] >= int(trig.split(":")[1])
        elif trig.startswith("mission_completed:"):
            ok = trig.split(":")[1] in char.get("completed_missions", [])
        elif trig.startswith("items_owned:"):
            ok = len(set(char.get("inventory", []))) >= int(trig.split(":")[1])
        elif trig.startswith("skills_unlocked:"):
            ok = len(char.get("unlocked_skills", [])) >= int(trig.split(":")[1])
        if ok:
            new_awards.append(ach["id"])
            char.setdefault("achievements", []).append(ach["id"])
            apply_xp(char, ach["xp"])
    return new_awards


def apply_xp(char: Dict[str, Any], xp_gain: int) -> Dict[str, Any]:
    char["xp"] = char.get("xp", 0) + xp_gain
    char["total_xp"] = char.get("total_xp", 0) + xp_gain
    new_level = level_from_total_xp(char["total_xp"])
    leveled = new_level > char["level"]
    if leveled:
        levels_gained = new_level - char["level"]
        char["level"] = new_level
        char["skill_points"] = char.get("skill_points", 0) + levels_gained
    return {"leveled_up": leveled, "new_level": char["level"]}


# ---------- ROUTES ----------
@api.get("/")
async def root():
    return {"app": "Shadow Nexus", "status": "online", "version": "1.0.0"}


@api.post("/auth/register")
async def register(payload: RegisterIn):
    existing = await db.users.find_one({"email": payload.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    uname_taken = await db.users.find_one({"username": payload.username})
    if uname_taken:
        raise HTTPException(status_code=400, detail="Username already taken")
    user = {
        "id": str(uuid.uuid4()),
        "username": payload.username,
        "email": payload.email.lower(),
        "password_hash": hash_password(payload.password),
        "created_at": utcnow().isoformat(),
    }
    await db.users.insert_one(user)
    token = create_token(user["id"], remember=False)
    return {
        "token": token,
        "user": {"id": user["id"], "username": user["username"], "email": user["email"]},
        "has_character": False,
    }


@api.post("/auth/login")
async def login(payload: LoginIn):
    user = await db.users.find_one({"email": payload.email.lower()})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_token(user["id"], remember=payload.remember_me)
    char = await db.characters.find_one({"user_id": user["id"]}, {"_id": 0})
    return {
        "token": token,
        "user": {"id": user["id"], "username": user["username"], "email": user["email"]},
        "has_character": bool(char),
    }


@api.post("/auth/forgot-password")
async def forgot(payload: ForgotIn):
    user = await db.users.find_one({"email": payload.email.lower()})
    # Always return success for security, but include simulated reset for dev/demo
    reset_token = str(uuid.uuid4()) if user else None
    if user:
        await db.password_resets.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "token": reset_token,
            "expires_at": (utcnow() + timedelta(hours=1)).isoformat(),
            "created_at": utcnow().isoformat(),
        })
    return {
        "message": "If an account exists with this email, a reset link has been sent.",
        "reset_token_demo": reset_token,  # demo only — would be emailed in production
    }


@api.get("/auth/me")
async def me(user=Depends(get_current_user)):
    char = await db.characters.find_one({"user_id": user["id"]}, {"_id": 0})
    return {"user": user, "character": _serialize_character(char) if char else None}


# ---------- Character ----------
@api.get("/character/options")
async def character_options():
    return {"avatars": AVATARS, "classes": CYBER_CLASSES}


@api.post("/character")
async def create_character(payload: CharacterCreateIn, user=Depends(get_current_user)):
    existing = await db.characters.find_one({"user_id": user["id"]})
    if existing:
        raise HTTPException(status_code=400, detail="Character already exists")
    if payload.cyber_class not in [c["id"] for c in CYBER_CLASSES]:
        raise HTTPException(status_code=400, detail="Invalid cyber class")
    if payload.avatar_id not in [a["id"] for a in AVATARS]:
        raise HTTPException(status_code=400, detail="Invalid avatar")
    char = fresh_character(user["id"], payload.name, payload.avatar_id, payload.cyber_class)
    await db.characters.insert_one(char.copy())
    return _serialize_character(char)


@api.get("/character")
async def get_character(user=Depends(get_current_user)):
    char = await db.characters.find_one({"user_id": user["id"]}, {"_id": 0})
    if not char:
        raise HTTPException(status_code=404, detail="No character created yet")
    return _serialize_character(char)


# ---------- Dashboard ----------
@api.get("/dashboard")
async def dashboard(user=Depends(get_current_user)):
    char = await db.characters.find_one({"user_id": user["id"]}, {"_id": 0})
    if not char:
        raise HTTPException(status_code=404, detail="No character")
    next_lvl_xp = total_xp_for_level(char["level"] + 1)
    current_lvl_xp = total_xp_for_level(char["level"])
    progress = (char["total_xp"] - current_lvl_xp) / max(1, (next_lvl_xp - current_lvl_xp))
    # current mission = first uncompleted in current chapter
    chapter_missions = [m for m in MISSIONS if m["chapter_id"] == char["current_chapter"]]
    current_mission = next((m for m in chapter_missions if m["id"] not in char["completed_missions"]), None)
    challenges = todays_challenges(user["id"])
    challenge_progress = char.get("daily_progress", {}).get(utcnow().date().isoformat(), {})
    return {
        "character": _serialize_character(char),
        "xp_progress": round(progress, 4),
        "xp_to_next_level": max(0, next_lvl_xp - char["total_xp"]),
        "current_mission": current_mission,
        "daily_challenges": [
            {**c, "progress": challenge_progress.get(c["id"], 0), "completed": challenge_progress.get(f"{c['id']}_done", False)}
            for c in challenges
        ],
    }


# ---------- Chapters / Missions ----------
@api.get("/chapters")
async def list_chapters(user=Depends(get_current_user)):
    char = await db.characters.find_one({"user_id": user["id"]}, {"_id": 0})
    if not char:
        raise HTTPException(status_code=404, detail="No character")
    result = []
    for ch in CHAPTERS:
        missions = [m for m in MISSIONS if m["chapter_id"] == ch["id"]]
        done = [m for m in missions if m["id"] in char["completed_missions"]]
        unlocked = char["level"] >= ch["required_level"]
        completed = len(done) == len(missions) and len(missions) > 0
        result.append({
            **ch,
            "unlocked": unlocked,
            "completed": completed,
            "missions_total": len(missions),
            "missions_done": len(done),
            "current": ch["id"] == char["current_chapter"],
        })
    return result


@api.get("/chapters/{chapter_id}/missions")
async def chapter_missions(chapter_id: str, user=Depends(get_current_user)):
    char = await db.characters.find_one({"user_id": user["id"]}, {"_id": 0})
    if not char:
        raise HTTPException(status_code=404, detail="No character")
    missions = [m for m in MISSIONS if m["chapter_id"] == chapter_id]
    # mark which are unlocked (sequential per chapter)
    out = []
    prev_done = True
    for m in missions:
        done = m["id"] in char["completed_missions"]
        unlocked = prev_done
        out.append({**m, "completed": done, "unlocked": unlocked})
        prev_done = done
    return out


@api.get("/missions/{mission_id}")
async def get_mission(mission_id: str, user=Depends(get_current_user)):
    mission = next((m for m in MISSIONS if m["id"] == mission_id), None)
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")
    return mission


def _update_daily_progress(char: Dict[str, Any], user_id: str, *, mission_completed: Optional[Dict[str, Any]] = None,
                          xp_earned: int = 0, npc_chatted: bool = False) -> List[Dict[str, Any]]:
    date_str = utcnow().date().isoformat()
    char.setdefault("daily_progress", {}).setdefault(date_str, {})
    progress = char["daily_progress"][date_str]
    challenges = todays_challenges(user_id)
    newly_completed = []
    for c in challenges:
        cid = c["id"]
        if progress.get(f"{cid}_done"):
            continue
        m = c["metric"]
        cur = progress.get(cid, 0)
        if m == "missions" and mission_completed:
            cur += 1
        elif m == "xp":
            cur += xp_earned
        elif m == "category_cryptography" and mission_completed and mission_completed.get("category") == "cryptography":
            cur += 1
        elif m == "boss" and mission_completed and mission_completed.get("category") == "boss":
            cur += 1
        elif m == "npc_chats" and npc_chatted:
            cur += 1
        progress[cid] = cur
        if cur >= c["target"]:
            progress[f"{cid}_done"] = True
            # apply rewards
            r = c["rewards"]
            char["coins"] = char.get("coins", 0) + r.get("coins", 0)
            if r.get("xp"):
                apply_xp(char, r["xp"])
            for it in r.get("items", []):
                char.setdefault("inventory", []).append(it)
            newly_completed.append(c)
    return newly_completed


@api.post("/missions/complete")
async def complete_mission(payload: MissionCompleteIn, user=Depends(get_current_user)):
    char = await db.characters.find_one({"user_id": user["id"]}, {"_id": 0})
    if not char:
        raise HTTPException(status_code=404, detail="No character")
    mission = next((m for m in MISSIONS if m["id"] == payload.mission_id), None)
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")
    if mission["id"] in char["completed_missions"]:
        raise HTTPException(status_code=400, detail="Mission already completed")
    if mission.get("combat") and not payload.won:
        return {"success": False, "message": "You were defeated. Try again, Agent."}
    if not mission.get("combat") and not payload.puzzle_correct:
        return {"success": False, "message": "Wrong answer. Re-analyze the data."}

    rewards = mission["rewards"]
    xp_gained = rewards.get("xp", 0)
    coins_gained = rewards.get("coins", 0)
    items_gained = rewards.get("items", [])

    char["completed_missions"].append(mission["id"])
    counters = char.setdefault("stats_counters", {"missions": 0, "boss_kills": 0, "npc_chats": 0, "category": {}})
    counters["missions"] = counters.get("missions", 0) + 1
    if mission.get("combat"):
        counters["boss_kills"] = counters.get("boss_kills", 0) + 1
    cat_counts = counters.setdefault("category", {})
    cat_counts[mission["category"]] = cat_counts.get(mission["category"], 0) + 1

    char["coins"] = char.get("coins", 0) + coins_gained
    char["reputation"] = char.get("reputation", 0) + (10 if mission.get("combat") else 5)
    for it in items_gained:
        char.setdefault("inventory", []).append(it)
    level_info = apply_xp(char, xp_gained)

    # Advance chapter if all missions of current chapter done
    cur_ch = char["current_chapter"]
    ch_missions = [m for m in MISSIONS if m["chapter_id"] == cur_ch]
    if all(m["id"] in char["completed_missions"] for m in ch_missions):
        idx = next((i for i, c in enumerate(CHAPTERS) if c["id"] == cur_ch), 0)
        if idx + 1 < len(CHAPTERS):
            char["current_chapter"] = CHAPTERS[idx + 1]["id"]

    new_achs = await check_achievements(char)
    daily_done = _update_daily_progress(char, user["id"], mission_completed=mission, xp_earned=xp_gained)

    await db.characters.update_one({"user_id": user["id"]}, {"$set": char})
    return {
        "success": True,
        "xp_gained": xp_gained,
        "coins_gained": coins_gained,
        "items_gained": items_gained,
        "leveled_up": level_info["leveled_up"],
        "new_level": level_info["new_level"],
        "new_achievements": [a for a in ACHIEVEMENTS if a["id"] in new_achs],
        "daily_completed": daily_done,
        "character": _serialize_character(char),
    }


# ---------- NPCs ----------
@api.get("/npcs")
async def list_npcs():
    return [{k: v for k, v in n.items() if k != "system_prompt"} for n in NPCS]


@api.get("/npcs/trust")
async def npcs_trust_pre(user=Depends(get_current_user)):
    char = await db.characters.find_one({"user_id": user["id"]}, {"_id": 0})
    if not char:
        raise HTTPException(status_code=404, detail="No character")
    return {"trust": char.get("npc_trust", {})}


@api.get("/npcs/{npc_id}")
async def get_npc(npc_id: str):
    npc = next((n for n in NPCS if n["id"] == npc_id), None)
    if not npc:
        raise HTTPException(status_code=404, detail="NPC not found")
    return {k: v for k, v in npc.items() if k != "system_prompt"}


@api.post("/npcs/chat")
async def npc_chat(payload: NPCChatIn, user=Depends(get_current_user)):
    npc = next((n for n in NPCS if n["id"] == payload.npc_id), None)
    if not npc:
        raise HTTPException(status_code=404, detail="NPC not found")
    char = await db.characters.find_one({"user_id": user["id"]}, {"_id": 0})
    if not char:
        raise HTTPException(status_code=404, detail="No character")

    # Build context-aware system prompt
    klass = next((c for c in CYBER_CLASSES if c["id"] == char["cyber_class"]), CYBER_CLASSES[0])
    context = (
        f"\n\nCurrent player context — Name: {char['name']}, Class: {klass['name']}, "
        f"Level: {char['level']}, Current Chapter: {char['current_chapter']}, "
        f"Reputation: {char['reputation']}. Use this naturally if relevant."
    )
    system_prompt = npc["system_prompt"] + context

    session_id = f"{user['id']}-{npc['id']}"
    reply_text = ""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session_id,
            system_message=system_prompt,
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        reply_text = await chat.send_message(UserMessage(text=payload.message))
    except Exception as e:
        log.exception("LLM call failed: %s", e)
        reply_text = "[Static interference] ... Try again in a moment, Agent."

    # Save conversation
    await db.npc_conversations.update_one(
        {"user_id": user["id"], "npc_id": npc["id"]},
        {
            "$push": {
                "messages": {
                    "$each": [
                        {"role": "user", "content": payload.message, "ts": utcnow().isoformat()},
                        {"role": "assistant", "content": str(reply_text), "ts": utcnow().isoformat()},
                    ]
                }
            },
            "$setOnInsert": {
                "id": str(uuid.uuid4()),
                "user_id": user["id"],
                "npc_id": npc["id"],
                "created_at": utcnow().isoformat(),
            },
        },
        upsert=True,
    )

    # Relationship + counters
    char.setdefault("npc_relations", {})
    char["npc_relations"][npc["id"]] = char["npc_relations"].get(npc["id"], 0) + 1
    counters = char.setdefault("stats_counters", {"npc_chats": 0})
    counters["npc_chats"] = counters.get("npc_chats", 0) + 1
    _update_daily_progress(char, user["id"], npc_chatted=True)
    await db.characters.update_one({"user_id": user["id"]}, {"$set": char})

    return {"reply": str(reply_text), "npc": {k: v for k, v in npc.items() if k != "system_prompt"}}


@api.get("/npcs/{npc_id}/history")
async def npc_history(npc_id: str, user=Depends(get_current_user)):
    conv = await db.npc_conversations.find_one(
        {"user_id": user["id"], "npc_id": npc_id}, {"_id": 0}
    )
    return {"messages": (conv or {}).get("messages", [])}


# ---------- Inventory / Items ----------
@api.get("/items")
async def list_items():
    return ITEMS


@api.get("/inventory")
async def get_inventory(user=Depends(get_current_user)):
    char = await db.characters.find_one({"user_id": user["id"]}, {"_id": 0})
    if not char:
        raise HTTPException(status_code=404, detail="No character")
    counts: Dict[str, int] = {}
    for iid in char.get("inventory", []):
        counts[iid] = counts.get(iid, 0) + 1
    detailed = []
    for iid, n in counts.items():
        item = next((i for i in ITEMS if i["id"] == iid), None)
        if item:
            detailed.append({**item, "count": n})
    return {"items": detailed, "equipment": char.get("equipment", {})}


@api.post("/inventory/equip")
async def equip_item(payload: ItemUseIn, user=Depends(get_current_user)):
    char = await db.characters.find_one({"user_id": user["id"]}, {"_id": 0})
    if not char:
        raise HTTPException(status_code=404, detail="No character")
    item = next((i for i in ITEMS if i["id"] == payload.item_id), None)
    if not item or item["type"] != "equipment":
        raise HTTPException(status_code=400, detail="Item is not equippable")
    if payload.item_id not in char.get("inventory", []):
        raise HTTPException(status_code=400, detail="Item not in inventory")
    slot = item.get("slot", "tool")
    char.setdefault("equipment", {})[slot] = payload.item_id
    await db.characters.update_one({"user_id": user["id"]}, {"$set": {"equipment": char["equipment"]}})
    return {"success": True, "equipment": char["equipment"]}


# ---------- Skills ----------
@api.get("/skills")
async def list_skills(user=Depends(get_current_user)):
    char = await db.characters.find_one({"user_id": user["id"]}, {"_id": 0})
    if not char:
        raise HTTPException(status_code=404, detail="No character")
    unlocked = set(char.get("unlocked_skills", []))
    out = []
    for s in SKILLS:
        can_unlock = (
            s["id"] not in unlocked
            and char.get("skill_points", 0) >= s["cost"]
            and (s["prereq"] is None or s["prereq"] in unlocked)
        )
        out.append({**s, "unlocked": s["id"] in unlocked, "can_unlock": can_unlock})
    return {"skills": out, "skill_points": char.get("skill_points", 0)}


@api.post("/skills/unlock")
async def unlock_skill(payload: SkillUnlockIn, user=Depends(get_current_user)):
    char = await db.characters.find_one({"user_id": user["id"]}, {"_id": 0})
    if not char:
        raise HTTPException(status_code=404, detail="No character")
    skill = next((s for s in SKILLS if s["id"] == payload.skill_id), None)
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    if skill["id"] in char.get("unlocked_skills", []):
        raise HTTPException(status_code=400, detail="Skill already unlocked")
    if skill["prereq"] and skill["prereq"] not in char.get("unlocked_skills", []):
        raise HTTPException(status_code=400, detail="Prerequisite skill not unlocked")
    if char.get("skill_points", 0) < skill["cost"]:
        raise HTTPException(status_code=400, detail="Not enough skill points")
    char.setdefault("unlocked_skills", []).append(skill["id"])
    char["skill_points"] = char["skill_points"] - skill["cost"]
    new_achs = await check_achievements(char)
    await db.characters.update_one({"user_id": user["id"]}, {"$set": char})
    return {
        "success": True,
        "character": _serialize_character(char),
        "new_achievements": [a for a in ACHIEVEMENTS if a["id"] in new_achs],
    }


# ---------- Achievements ----------
@api.get("/achievements")
async def get_achievements(user=Depends(get_current_user)):
    char = await db.characters.find_one({"user_id": user["id"]}, {"_id": 0})
    owned = set((char or {}).get("achievements", []))
    return [{**a, "unlocked": a["id"] in owned} for a in ACHIEVEMENTS]


# ---------- Daily Challenges ----------
@api.get("/daily-challenges")
async def daily(user=Depends(get_current_user)):
    char = await db.characters.find_one({"user_id": user["id"]}, {"_id": 0})
    if not char:
        raise HTTPException(status_code=404, detail="No character")
    progress = char.get("daily_progress", {}).get(utcnow().date().isoformat(), {})
    out = []
    for c in todays_challenges(user["id"]):
        out.append({**c, "progress": progress.get(c["id"], 0), "completed": progress.get(f"{c['id']}_done", False)})
    return out


# ---------- Leaderboard ----------
@api.get("/leaderboard")
async def leaderboard(limit: int = 25):
    cursor = db.characters.find({}, {"_id": 0, "name": 1, "avatar_id": 1, "cyber_class": 1, "level": 1, "total_xp": 1, "reputation": 1})
    rows = await cursor.to_list(limit * 4)
    rows.sort(key=lambda r: (r.get("level", 0), r.get("total_xp", 0), r.get("reputation", 0)), reverse=True)
    return [{"rank": i + 1, **r} for i, r in enumerate(rows[:limit])]


# ---------- Combat (stateless preview) ----------
@api.get("/combat/{mission_id}")
async def combat_setup(mission_id: str, user=Depends(get_current_user)):
    mission = next((m for m in MISSIONS if m["id"] == mission_id), None)
    if not mission or not mission.get("combat"):
        raise HTTPException(status_code=404, detail="Combat mission not found")
    char = await db.characters.find_one({"user_id": user["id"]}, {"_id": 0})
    if not char:
        raise HTTPException(status_code=404, detail="No character")
    # Compute player combat stats
    base_hp = 100 + (char["level"] - 1) * 20
    base_atk = 15 + char["stats"].get("hacking", 5) + (char["level"] - 1) * 2
    base_def = 8 + char["stats"].get("networking", 5) + (char["level"] - 1)
    speed = 10 + char["stats"].get("intelligence", 5)
    # Equipment bonus
    for slot, iid in (char.get("equipment") or {}).items():
        if not iid:
            continue
        it = next((i for i in ITEMS if i["id"] == iid), None)
        if it:
            for stat, val in it.get("stats", {}).items():
                if stat == "defense":
                    base_def += val
                elif stat == "intelligence":
                    base_atk += val // 2
                elif stat == "speed":
                    speed += val
    return {
        "mission": mission,
        "player": {"hp": base_hp, "max_hp": base_hp, "attack": base_atk, "defense": base_def, "speed": speed,
                   "name": char["name"], "avatar_id": char["avatar_id"]},
        "enemy": mission["enemy"],
        "moves": [
            {"id": "exploit", "name": "Exploit", "icon": "flash", "damage": 1.2, "color": "#FF003C", "desc": "Targeted offensive payload"},
            {"id": "malware", "name": "Malware", "icon": "bug", "damage": 1.4, "color": "#9D00FF", "desc": "DoT-style attack (high risk)"},
            {"id": "firewall", "name": "Firewall", "icon": "shield", "damage": 0.5, "color": "#00FF41", "desc": "Block next attack (-60% dmg)"},
            {"id": "encrypt", "name": "Encrypt Shield", "icon": "lock-closed", "damage": 0, "color": "#00F0FF", "desc": "Heal 30 HP"},
        ],
    }


# ---------- Hacking Terminal ----------
from hack_engine import (  # noqa: E402
    HACK_TARGETS, STAGES, STAGE_LABELS, new_session, handle_command,
    attempt_crack, get_code_puzzle, check_code_answer, crack_progress_lines,
)


@api.get("/hack/targets")
async def hack_targets():
    return {"targets": HACK_TARGETS, "stages": [{"id": s, "label": STAGE_LABELS[s]} for s in STAGES]}


@api.post("/hack/start")
async def hack_start(payload: HackStartIn, user=Depends(get_current_user)):
    char = await db.characters.find_one({"user_id": user["id"]}, {"_id": 0})
    if not char:
        raise HTTPException(status_code=404, detail="No character")
    sess = new_session(user["id"], char["name"], payload.target)
    await db.hack_sessions.insert_one(sess.copy())
    return _strip(sess)


@api.get("/hack/{session_id}")
async def hack_get(session_id: str, user=Depends(get_current_user)):
    sess = await db.hack_sessions.find_one({"id": session_id, "user_id": user["id"]}, {"_id": 0})
    if not sess:
        raise HTTPException(status_code=404, detail="Hack session not found")
    return _strip(sess)


@api.post("/hack/cmd")
async def hack_cmd(payload: HackCmdIn, user=Depends(get_current_user)):
    sess = await db.hack_sessions.find_one({"id": payload.session_id, "user_id": user["id"]}, {"_id": 0})
    if not sess:
        raise HTTPException(status_code=404, detail="Hack session not found")
    out_lines, patch = handle_command(sess, payload.command)
    # Append new history
    new_hist = list(sess.get("history", [])) + out_lines
    new_hist = new_hist[-200:]  # cap
    update = {"history": new_hist, **patch}
    if "history" in patch and patch["history"] == []:
        update["history"] = []
    await db.hack_sessions.update_one({"id": sess["id"]}, {"$set": update})
    sess.update(update)
    return _strip(sess)


@api.post("/hack/crack")
async def hack_crack(payload: HackCrackIn, user=Depends(get_current_user)):
    sess = await db.hack_sessions.find_one({"id": payload.session_id, "user_id": user["id"]}, {"_id": 0})
    if not sess:
        raise HTTPException(status_code=404, detail="Hack session not found")
    ok, msg = attempt_crack(sess, payload.guess)
    new_hist = list(sess.get("history", [])) + [{"output": msg, "kind": "success" if ok else "error"}]
    update: Dict[str, Any] = {"history": new_hist[-200:]}
    if ok:
        update["password_cracked"] = True
        if sess.get("exploit_success") and sess.get("code_puzzle_solved"):
            update["stage"] = "exfil"
            update["stage_index"] = 3
            new_hist.append({"output": "[+] PRIVILEGE ESCALATION COMPLETE — proceed to EXFIL stage.", "kind": "success"})
            new_hist.append({"output": "[*] Type: exfil  — to extract the vault payload.", "kind": "hint"})
            update["history"] = new_hist[-200:]
    await db.hack_sessions.update_one({"id": sess["id"]}, {"$set": update})
    sess.update(update)
    return {"ok": ok, "message": msg, "session": _strip(sess)}


@api.get("/hack/{session_id}/crack-progress")
async def hack_crack_progress(session_id: str, user=Depends(get_current_user)):
    sess = await db.hack_sessions.find_one({"id": session_id, "user_id": user["id"]}, {"_id": 0})
    if not sess:
        raise HTTPException(status_code=404, detail="Hack session not found")
    return {"lines": crack_progress_lines(sess), "hash": sess["pw_hash"]}


@api.get("/hack/{session_id}/puzzle")
async def hack_puzzle(session_id: str, user=Depends(get_current_user)):
    sess = await db.hack_sessions.find_one({"id": session_id, "user_id": user["id"]}, {"_id": 0})
    if not sess:
        raise HTTPException(status_code=404, detail="Hack session not found")
    return get_code_puzzle(sess)


@api.post("/hack/inject")
async def hack_inject(payload: HackInjectIn, user=Depends(get_current_user)):
    sess = await db.hack_sessions.find_one({"id": payload.session_id, "user_id": user["id"]}, {"_id": 0})
    if not sess:
        raise HTTPException(status_code=404, detail="Hack session not found")
    correct = check_code_answer(sess, payload.answer)
    line = "[+] Injection accepted. Privilege chain extended." if correct else "[-] Injection rejected. Syntax check failed."
    new_hist = list(sess.get("history", [])) + [{"output": line, "kind": "success" if correct else "error"}]
    update: Dict[str, Any] = {"history": new_hist[-200:]}
    if correct:
        update["code_puzzle_solved"] = True
        if sess.get("exploit_success") and sess.get("password_cracked"):
            update["stage"] = "exfil"
            update["stage_index"] = 3
            new_hist.append({"output": "[+] PRIVILEGE ESCALATION COMPLETE — proceed to EXFIL.", "kind": "success"})
            update["history"] = new_hist[-200:]
    await db.hack_sessions.update_one({"id": sess["id"]}, {"$set": update})
    sess.update(update)
    return {"ok": correct, "session": _strip(sess)}


@api.post("/hack/complete")
async def hack_complete(payload: HackStartIn, user=Depends(get_current_user)):
    """Claim rewards once exfil_complete is true. payload.target = session_id."""
    sess = await db.hack_sessions.find_one({"id": payload.target, "user_id": user["id"]}, {"_id": 0})
    if not sess:
        raise HTTPException(status_code=404, detail="Hack session not found")
    if not sess.get("exfil_complete"):
        raise HTTPException(status_code=400, detail="Exfiltration not complete")
    if sess.get("claimed"):
        raise HTTPException(status_code=400, detail="Rewards already claimed")
    char = await db.characters.find_one({"user_id": user["id"]}, {"_id": 0})
    xp = sess["target"]["reward_xp"]
    coins = sess["target"]["reward_coins"]
    char["coins"] = char.get("coins", 0) + coins
    level_info = apply_xp(char, xp)
    # Award trust changes based on faction
    faction = sess["target"]["faction"]
    char.setdefault("npc_trust", {})
    if faction == "Helix Corp":
        char["npc_trust"]["aria"] = char["npc_trust"].get("aria", 0) - 25
        char["npc_trust"]["jin"] = char["npc_trust"].get("jin", 0) + 15
    elif faction == "Crimson Syndicate":
        char["npc_trust"]["vector"] = char["npc_trust"].get("vector", 0) - 30
    elif faction == "The Phantom Grid":
        char["npc_trust"]["shadow_king"] = char["npc_trust"].get("shadow_king", 0) - 20
        char["npc_trust"]["nova"] = char["npc_trust"].get("nova", 0) + 20

    # Drop an in-game message
    await _push_message(user["id"], sender_npc="byte",
                       text=f"Nice work jacking {sess['target']['name']}. +{xp} XP, +{coins} CR. The grid noticed.",
                       priority="info")
    if faction == "Helix Corp":
        await _push_message(user["id"], sender_npc="aria",
                           text=f"Anomaly logged. Your signature is now in our priority watch list, {char['name']}. We will speak again.",
                           priority="threat")
    await db.characters.update_one({"user_id": user["id"]}, {"$set": char})
    await db.hack_sessions.update_one({"id": sess["id"]}, {"$set": {"claimed": True}})
    return {
        "success": True,
        "xp_gained": xp,
        "coins_gained": coins,
        "leveled_up": level_info["leveled_up"],
        "new_level": level_info["new_level"],
        "trust_changes": char.get("npc_trust", {}),
    }


def _strip(sess: Dict[str, Any]) -> Dict[str, Any]:
    out = {k: v for k, v in sess.items() if k not in ("_id", "pw_plain")}
    return out


# ---------- Messenger ----------
async def _push_message(user_id: str, *, sender_npc: str, text: str, priority: str = "info") -> None:
    npc = next((n for n in NPCS if n["id"] == sender_npc), None)
    if not npc:
        return
    await db.messages.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "sender_npc": sender_npc,
        "sender_name": npc["name"],
        "sender_color": npc["color"],
        "sender_portrait": npc.get("portrait"),
        "text": text,
        "priority": priority,  # 'info' | 'warning' | 'threat' | 'tipoff'
        "read": False,
        "created_at": utcnow().isoformat(),
    })


@api.get("/messenger/inbox")
async def messenger_inbox(user=Depends(get_current_user)):
    cursor = db.messages.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).limit(50)
    items = await cursor.to_list(50)
    return {"messages": items, "unread": sum(1 for m in items if not m.get("read"))}


@api.post("/messenger/read")
async def messenger_read(user=Depends(get_current_user)):
    await db.messages.update_many({"user_id": user["id"], "read": False}, {"$set": {"read": True}})
    return {"success": True}


@api.post("/messenger/seed-tipoffs")
async def messenger_seed(user=Depends(get_current_user)):
    """Drop a couple of fresh tip-offs from NPCs for the player."""
    char = await db.characters.find_one({"user_id": user["id"]}, {"_id": 0})
    if not char:
        raise HTTPException(status_code=404, detail="No character")
    await _push_message(user["id"], sender_npc="jin",
                       text=f"Heads up, {char['name']}. Helix is pushing a new patch tonight. Window opens at 02:00. Don't waste it.",
                       priority="tipoff")
    await _push_message(user["id"], sender_npc="vector",
                       text="Cute level. I just hit Phantom relay #14 in under 90 seconds. Catch up or stay sidelined.",
                       priority="threat")
    await _push_message(user["id"], sender_npc="cipher",
                       text="Remember — the network teaches what books cannot. Trace every packet like a breadcrumb home.",
                       priority="info")
    return {"success": True}


# ---------- NPC Trust / Persuasion ----------
PERSUADE_OUTCOMES = {
    "ally": {
        "flatter": +6,
        "sympathize": +8,
        "bargain": +3,
        "threaten": -10,
    },
    "mentor": {"flatter": +3, "sympathize": +5, "bargain": +2, "threaten": -8},
    "informant": {"flatter": +4, "sympathize": +9, "bargain": +6, "threaten": -12},
    "companion": {"flatter": +10, "sympathize": +6, "bargain": +2, "threaten": -15},
    "rival": {"flatter": -3, "sympathize": -1, "bargain": +4, "threaten": +2},
    "boss": {"flatter": -5, "sympathize": -3, "bargain": -1, "threaten": +1},
}


@api.post("/npcs/persuade")
async def npc_persuade(payload: PersuadeIn, user=Depends(get_current_user)):
    npc = next((n for n in NPCS if n["id"] == payload.npc_id), None)
    if not npc:
        raise HTTPException(status_code=404, detail="NPC not found")
    if payload.approach not in ("flatter", "threaten", "bargain", "sympathize"):
        raise HTTPException(status_code=400, detail="Invalid approach")
    char = await db.characters.find_one({"user_id": user["id"]}, {"_id": 0})
    if not char:
        raise HTTPException(status_code=404, detail="No character")
    table = PERSUADE_OUTCOMES.get(npc.get("tag", "ally"), PERSUADE_OUTCOMES["ally"])
    delta = table[payload.approach]
    # Skill check: social engineering stat modifier
    social = char.get("stats", {}).get("social_engineering", 5)
    if delta > 0:
        delta += (social - 5) // 2
    char.setdefault("npc_trust", {})
    cur = char["npc_trust"].get(npc["id"], 0)
    new_val = max(-100, min(100, cur + delta))
    char["npc_trust"][npc["id"]] = new_val
    await db.characters.update_one({"user_id": user["id"]}, {"$set": {"npc_trust": char["npc_trust"]}})

    # Generate reaction line via LLM
    klass = next((c for c in CYBER_CLASSES if c["id"] == char["cyber_class"]), CYBER_CLASSES[0])
    sys_prompt = (
        npc["system_prompt"]
        + f"\n\nThe player ({char['name']}, {klass['name']}) just attempted to {payload.approach} you. "
        f"Current trust toward player: {new_val} of 100. "
        f"Respond in-character to this attempt. ONE short line, max 2 sentences."
    )
    reply = "..."
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"persuade-{user['id']}-{npc['id']}-{uuid.uuid4().hex[:6]}",
            system_message=sys_prompt,
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        reply = await chat.send_message(UserMessage(text=f"[Player chose: {payload.approach}]"))
    except Exception as e:
        log.warning("Persuade LLM fail: %s", e)
        reply = "[static]"

    return {
        "approach": payload.approach,
        "delta": delta,
        "trust": new_val,
        "reaction": str(reply),
    }


@api.get("/npcs/trust")
async def npcs_trust(user=Depends(get_current_user)):
    char = await db.characters.find_one({"user_id": user["id"]}, {"_id": 0})
    if not char:
        raise HTTPException(status_code=404, detail="No character")
    return {"trust": char.get("npc_trust", {})}


# Include router & middleware
app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    # Indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("username", unique=True)
    await db.characters.create_index("user_id", unique=True)
    await db.npc_conversations.create_index([("user_id", 1), ("npc_id", 1)])
    log.info("Shadow Nexus backend started.")


@app.on_event("shutdown")
async def shutdown():
    client.close()
