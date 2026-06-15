# AI PPT Backend (FastAPI)

最小化的后端骨架：负责 **API Key 代管 + SSE 透传** 到火山引擎方舟（豆包）。

## 为什么要后端

- 浏览器打包后的 JS 任何人都能读，API Key 不能放进前端。
- 第三方 API 通常拒绝跨域，开发期靠 Vite proxy 绕过，生产没这层。
- 计费、限流、审计都需要服务端把关。

## 目录

```
server/
├── app/
│   ├── __init__.py
│   ├── main.py        # FastAPI 路由
│   ├── config.py      # 环境变量加载
│   └── ark.py         # ARK SSE 客户端（透传）
├── .env.example
├── requirements.txt
└── README.md
```

## 安装（conda）

推荐 Python 3.11（FastAPI / httpx 全兼容；3.12 也可）。

```bash
# 1) 创建环境
conda create -n aippt python=3.11 -y
conda activate aippt

# 2) 安装依赖
cd server
pip install -r requirements.txt -i https://mirrors.aliyun.com/pypi/simple/
```

### 在 PyCharm 中绑定该解释器

1. **File → Settings → Project: aippt → Python Interpreter**
2. 右上角齿轮 → **Add Interpreter → Conda Environment → Existing environment**
3. Interpreter 选：`<你的 conda 安装路径>/envs/aippt/python.exe`
   - 用 `conda info --envs` 可以看到具体路径
4. 把 `server/` 目录右键设为 **Sources Root**（这样 `from app.xxx` 不会标红）
5. 创建运行配置：
   - Type: **FastAPI**（PyCharm Pro）或 **Python**
   - 若用 Python 类型：Module name 填 `uvicorn`，Parameters 填 `app.main:app --reload --port 8000`，Working directory 选 `server/`

## 配置

```bash
cp .env.example .env
# 编辑 .env，把 ARK_API_KEY 填上
```

## 运行

```bash
uvicorn app.main:app --reload --port 8000
```

健康检查：

```bash
curl http://localhost:8000/api/health
# {"status":"ok","ark_configured":true,"default_model":"..."}
```

## 接口

### `GET /api/health`
返回服务状态和是否已配置 Key。

### `GET /api/ai/models`
返回默认模型 id，前端展示用。

### `POST /api/ai/chat`
OpenAI 兼容的 chat/completions，**body 透传**到 ARK，**SSE 流式返回**。

请求示例：
```json
{
  "model": "doubao-1-5-pro-32k-250115",
  "messages": [
    {"role": "system", "content": "你是一个助手"},
    {"role": "user",   "content": "用三句话介绍北京"}
  ],
  "temperature": 0.7
}
```

响应：`text/event-stream`，按 OpenAI 协议每帧 `data: {...}\n\n`，最终 `data: [DONE]`。

## 与前端联调

前端 `.env.local` 改成走后端：

```
VITE_ARK_BASE_URL=/api/ai
# VITE_ARK_API_KEY 可留空（后端持有）
```

`vite.config.ts` 已配 `/api` 反代到 `http://localhost:8000`。

## 部署提示

- 真上线请加：鉴权（JWT/Session）、限流（slowapi/Redis）、用量记录、审计日志。
- 反向代理（nginx/caddy）注意关闭对 `/api/ai/chat` 的响应缓冲，保证 SSE 实时。
- ARK 的「推理接入点」id 形如 `ep-xxxxxxxx`，可直接作为 `model` 字段值。
