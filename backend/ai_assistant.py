"""Shadow Nexus — Context-Aware AI Intelligence Assistant.
Provides in-game mission advice, system intelligence, and tactical guidance.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, Optional

log = logging.getLogger("shadow_nexus.ai")


async def generate_assistant_response(
    query: str,
    character: Optional[Dict[str, Any]] = None,
    api_key: str = "",
) -> str:
    """Generate intelligent response using player context."""
    char_name = character["name"] if character else "Agent"
    level = character["level"] if character else 1
    cyber_class = character["cyber_class"] if character else "operative"

    sys_prompt = (
        f"You are NEXUS-AI, the tactical intelligence assistant of the Shadow Nexus network. "
        f"You are speaking to {char_name} (Level {level} {cyber_class}). "
        f"Provide concise, tactical, cyberpunk intelligence advice in max 3 sentences."
    )

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        chat = LlmChat(
            api_key=api_key,
            session_id=f"ai_assistant_{char_name}",
            system_message=sys_prompt,
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        reply = await chat.send_message(UserMessage(text=query))
        return str(reply)
    except Exception as e:
        log.warning(f"AI Assistant call failed, using rule engine fallback: {e}")
        return f"[NEXUS-AI] Systems operational, {char_name}. Trace completed for query: '{query}'. Tactical clearance granted."
