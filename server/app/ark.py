"""
ARK (火山引擎方舟) 客户端：SSE 透传

前端把 OpenAI 兼容的 chat/completions 请求体发到 /api/ai/chat，
后端补上 Authorization 头，再把上游 SSE 字节流原样转发回浏览器。
"""
from __future__ import annotations

import json
import logging
from typing import Any, AsyncIterator

import httpx

from .config import get_settings

log = logging.getLogger("ark")


async def stream_chat(payload: dict[str, Any]) -> AsyncIterator[bytes]:
    """以 SSE 透传方式调用 ARK chat/completions。

    payload 必须包含 messages，stream 会被强制为 True。
    model 缺省时使用 ARK_DEFAULT_MODEL。
    """
    settings = get_settings()
    if not settings.configured:
        raise RuntimeError("ARK_API_KEY 未配置，请在 server/.env 填写")

    body = dict(payload)
    body["stream"] = True
    body.setdefault("model", settings.ark_default_model)

    url = f"{settings.ark_base_url}/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.ark_api_key}",
        "Content-Type": "application/json",
        "Accept": "text/event-stream",
    }

    log.info("ARK request → model=%s url=%s", body.get("model"), url)

    timeout = httpx.Timeout(settings.request_timeout_seconds, connect=10.0)
    async with httpx.AsyncClient(timeout=timeout) as client:
        async with client.stream("POST", url, json=body, headers=headers) as resp:
            if resp.status_code >= 400:
                text = (await resp.aread()).decode("utf-8", errors="replace")
                log.error("ARK upstream error %s: %s", resp.status_code, text)
                err = json.dumps(
                    {"status": resp.status_code, "message": text[:500]},
                    ensure_ascii=False,
                )
                yield f"data: {{\"error\": {err}}}\n\n".encode("utf-8")
                yield b"data: [DONE]\n\n"
                return
            async for chunk in resp.aiter_bytes():
                if chunk:
                    yield chunk

