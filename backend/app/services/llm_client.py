"""Unified LLM client.

Switches between Ollama (local dev) and OpenAI (prod) via USE_OPENAI env flag.
Zero code changes required — just set USE_OPENAI=true in .env.
"""

import json
import re

from openai import AsyncOpenAI

from app.config import settings


def _get_client() -> tuple[AsyncOpenAI, str]:
    """Return (client, model_name) based on USE_OPENAI setting."""
    if settings.USE_OPENAI:
        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        model = settings.OPENAI_MODEL
    else:
        client = AsyncOpenAI(
            base_url=settings.OLLAMA_BASE_URL + "/v1",
            api_key="ollama",
        )
        model = settings.OLLAMA_MODEL
    return client, model


def clean_json(text: str) -> str:
    """Strip markdown fences and extract JSON object from LLM response."""
    text = text.strip()
    text = re.sub(r"```json\s*", "", text)
    text = re.sub(r"```\s*", "", text)
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        text = match.group(0)
    # Remove trailing commas before } or ]
    text = re.sub(r",\s*([}\]])", r"\1", text)
    return text.strip()


async def chat_complete(
    messages: list[dict],
    temperature: float = 0.1,
    max_tokens: int = 2048,
) -> str:
    """Single chat completion. Returns assistant message text."""
    client, model = _get_client()
    response = await client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
    )
    return response.choices[0].message.content or ""


async def chat_complete_json(
    messages: list[dict],
    temperature: float = 0.0,
    max_tokens: int = 2048,
) -> dict:
    """Chat completion that always returns a parsed dict.

    - OpenAI: uses json_object response format for guaranteed valid JSON.
    - Ollama: parses and cleans the response manually.
    Raises ValueError if JSON cannot be parsed after cleaning.
    """
    client, model = _get_client()

    kwargs: dict = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }

    if settings.USE_OPENAI:
        kwargs["response_format"] = {"type": "json_object"}

    response = await client.chat.completions.create(**kwargs)
    raw = response.choices[0].message.content or "{}"

    try:
        return json.loads(clean_json(raw))
    except json.JSONDecodeError as e:
        raise ValueError(f"LLM returned invalid JSON: {e}\nRaw response: {raw[:300]}") from e