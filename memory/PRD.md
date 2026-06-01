# Shadow Nexus — Product Requirements Document

## Overview
**Shadow Nexus** is a mobile-first, story-driven RPG where players become elite cyber operatives fighting *The Phantom Grid*, a rogue AI organization. The game blends cybersecurity education with classic RPG mechanics: progression, NPC conversations (AI-powered), turn-based cyber combat, inventory, skill tree, achievements, daily challenges, and a global leaderboard.

## Tech Stack
- **Frontend**: React Native + Expo (SDK 54), TypeScript, Expo Router (file-based)
- **Backend**: FastAPI + Motor (Async MongoDB)
- **AI NPCs**: Claude Sonnet 4.5 (`claude-sonnet-4-5-20250929`) via `emergentintegrations` + Emergent LLM Key
- **Auth**: Custom JWT (bcrypt password hashing, Remember Me, Forgot Password reset token)

## Core Systems Implemented
1. **Authentication** — register, login (with Remember Me 30-day token), forgot-password
2. **Character Creation** — 22 futuristic avatars × 5 Cyber Classes with class-specific stats and bonuses
3. **Dashboard HUD** — avatar, level, XP bar, coins, reputation, active mission, daily challenge progress, quick links
4. **Story Mode** — 5 chapters (The Awakening, The Dark Network, The Phantom Grid, Digital War, Final Firewall) with sequential mission chains and level gating
5. **Missions** — 12 missions across categories: Network Security, Web Security, Cryptography, Forensics, Social Engineering. Educational puzzles (port scan, SQL injection, Caesar cipher, phishing detection)
6. **NPC System** — 5 NPCs (Commander Nova, Dr. Cipher, Ghost, BYTE, Shadow King), each with unique AI persona via Claude Sonnet 4.5. Conversation history persisted per user/NPC
7. **Cyber Combat** — turn-based RPG with Exploit / Malware / Firewall (block) / Encrypt (heal) moves vs. boss enemies (5 chapter bosses)
8. **Inventory & Equipment** — 10 items (tools, equipment, consumables) with rarity tiers (Common → Legendary). 3-slot equipment (head, body, tool)
9. **Skill Tree** — 12 skills across 5 branches (Offensive, Defensive, Reverse Eng, Forensics, Cryptography). Prereqs, costs, skill points from leveling
10. **Achievements** — 10 achievements with auto-trigger detection on mission completion / level / inventory milestones
11. **Daily Challenges** — 3 per day, deterministically generated per user+date. Auto-tracked from missions/XP/boss/NPC chats
12. **Leaderboard** — global ranking by level, total XP, reputation

## Data Models (MongoDB)
- `users` — auth credentials
- `characters` — full game state (single doc per user)
- `npc_conversations` — chat history per user+NPC
- `password_resets` — reset tokens

## API Routes (all prefixed `/api`)
- `/auth/*` — register, login, me, forgot-password
- `/character` — CRUD; `/character/options` for avatar+class catalogs
- `/dashboard` — aggregated HUD data
- `/chapters`, `/chapters/{id}/missions`, `/missions/{id}`, `/missions/complete`
- `/npcs`, `/npcs/{id}`, `/npcs/chat`, `/npcs/{id}/history`
- `/inventory`, `/inventory/equip`, `/items`
- `/skills`, `/skills/unlock`
- `/achievements`
- `/daily-challenges`
- `/leaderboard`
- `/combat/{mission_id}`

## Design System
- Dark cyberpunk base (`#030305`) with neon accents: cyan `#00F0FF`, green `#00FF41`, purple `#9D00FF`, amber `#FFB000`, red `#FF003C`
- Square-edge UI (no rounded corners) for tactical aesthetic
- Glassmorphism overlays, neon glow shadows, terminal-monospace typography
- Background images: Nexus City, Cyber Academy, Dark Web Market

## Status
- ✅ All core systems implemented and wired end-to-end
- ✅ Backend reachable, auth flow works (smoke tested)
- ✅ Login screen renders with cyberpunk aesthetic

## Next Action Items
- Run testing agent for full backend + frontend validation
- Future: world map screen (locations as travel hub), more chapter content for ch3-5, in-app shop (Dark Web Market)
