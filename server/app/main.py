"""
FastAPI 应用入口
- /api/health                  健康检查（同时返回是否配置了 ARK_API_KEY）
- /api/ai/chat/completions     OpenAI 兼容的 chat/completions SSE 透传到 ARK
- /api/ai/models               返回默认模型 id（前端展示用）
"""
from __future__ import annotations

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse

from .ark import stream_chat
from .config import get_settings

app = FastAPI(title="AI PPT Backend", version="0.1.0")

settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health() -> dict:
    s = get_settings()
    return {
        "status": "ok",
        "ark_configured": s.configured,
        "default_model": s.ark_default_model,
    }


@app.get("/api/ai/models")
async def models() -> dict:
    s = get_settings()
    return {"default": s.ark_default_model}


@app.post("/api/ai/chat/completions")
async def chat_completions(request: Request) -> StreamingResponse:
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="invalid json body")

    if not isinstance(payload, dict) or "messages" not in payload:
        raise HTTPException(status_code=400, detail="missing 'messages'")

    s = get_settings()
    if not s.configured:
        return JSONResponse(
            status_code=503,
            content={"detail": "ARK_API_KEY not configured on server"},
        )

    headers = {
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",  # 禁用 nginx 缓冲，保证 SSE 实时
    }
    return StreamingResponse(
        stream_chat(payload),
        media_type="text/event-stream",
        headers=headers,
    )
