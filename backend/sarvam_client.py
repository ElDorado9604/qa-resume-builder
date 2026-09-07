"""
Thin wrapper around Sarvam AI's Chat Completions API.

Docs: https://docs.sarvam.ai/api-reference/open-source/chat-completions
Endpoint is OpenAI-compatible: POST https://api.sarvam.ai/v2/chat/completions
Auth: api-subscription-key header.
"""
import os
import json
from typing import Optional

import httpx

SARVAM_API_URL = "https://api.sarvam.ai/v2/chat/completions"
SARVAM_MODEL = "sarvam-30b"


class SarvamError(RuntimeError):
    pass


def _get_api_key() -> str:
    api_key = os.getenv("SARVAM_API_KEY", "").strip()
    if not api_key:
        raise SarvamError(
            "SARVAM_API_KEY is not configured on the server. "
            "AI-powered features are unavailable until it's set."
        )
    return api_key


def chat_completion(
    system_prompt: str,
    user_prompt: str,
    *,
    json_mode: bool = False,
    max_tokens: int = 800,
    temperature: float = 0.4,
) -> str:
    """
    Calls Sarvam's chat completions endpoint and returns the assistant's
    text content. Reasoning ("thinking") mode is disabled for latency,
    since resume-writing tasks don't need multi-step reasoning.
    """
    api_key = _get_api_key()

    payload = {
        "model": SARVAM_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "max_tokens": max_tokens,
        "temperature": temperature,
        "reasoning_effort": None,
    }
    if json_mode:
        payload["response_format"] = {"type": "json_object"}

    headers = {
        "Content-Type": "application/json",
        "api-subscription-key": api_key,
    }

    try:
        with httpx.Client(timeout=30.0) as client:
            response = client.post(SARVAM_API_URL, json=payload, headers=headers)
            response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        raise SarvamError(
            f"Sarvam API returned an error: {exc.response.status_code} {exc.response.text}"
        ) from exc
    except httpx.HTTPError as exc:
        raise SarvamError(f"Failed to reach Sarvam API: {exc}") from exc

    data = response.json()
    try:
        return data["choices"][0]["message"]["content"]
    except (KeyError, IndexError) as exc:
        raise SarvamError(f"Unexpected Sarvam API response shape: {data}") from exc


def chat_completion_json(
    system_prompt: str,
    user_prompt: str,
    *,
    max_tokens: int = 800,
    temperature: float = 0.4,
) -> dict:
    """
    Same as chat_completion, but parses the response as JSON. Raises
    SarvamError if the model didn't return valid JSON.
    """
    content = chat_completion(
        system_prompt,
        user_prompt,
        json_mode=True,
        max_tokens=max_tokens,
        temperature=temperature,
    )
    try:
        return json.loads(content)
    except json.JSONDecodeError as exc:
        raise SarvamError(f"Sarvam response was not valid JSON: {content}") from exc
