"""
配置加载：从环境变量 / .env 读取
"""
from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache

from dotenv import load_dotenv

# 优先加载 server 目录下的 .env，再加载根目录 .env（让两套都能用）
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))
load_dotenv()


@dataclass(frozen=True)
class Settings:
    ark_api_key: str
    ark_base_url: str
    ark_default_model: str
    cors_origins: list[str]
    request_timeout_seconds: float

    @property
    def configured(self) -> bool:
        return bool(self.ark_api_key)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    origins_raw = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
    return Settings(
        ark_api_key=os.getenv("ARK_API_KEY", "").strip(),
        ark_base_url=os.getenv("ARK_BASE_URL", "https://ark.cn-beijing.volces.com/api/v3").rstrip("/"),
        ark_default_model=os.getenv("ARK_DEFAULT_MODEL", "doubao-1-5-pro-32k-250115"),
        cors_origins=[o.strip() for o in origins_raw.split(",") if o.strip()],
        request_timeout_seconds=float(os.getenv("REQUEST_TIMEOUT_SECONDS", "120")),
    )
