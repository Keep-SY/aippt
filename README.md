# AI Slide Studio

> 一个用大模型生成、编辑、导出 PPT 的 Web 应用。对标 Kimi PPT、WPS AI PPT。
> Vue 3 + TypeScript + Fabric.js（前端）· FastAPI（后端代理）· 火山引擎方舟 Doubao（默认）

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Vue 3](https://img.shields.io/badge/Vue-3.4-42b883)](https://vuejs.org)
[![TypeScript](https://img.shields.io/badge/TS-5.5-3178c6)](https://www.typescriptlang.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688)](https://fastapi.tiangolo.com)

---

## 功能

- **一句话生成大纲**：输入主题与页数，AI 流式产出大纲（标题 + 要点），支持拖拽排序
- **AI 润色**：选中文本一键改写 / 扩写 / 精简 / 翻译 / 校对
- **模板风格**：12 套预设（商务 / 科技 / 极简 / 教育 / 创意），可即时切换
- **画布编辑**：基于 Fabric.js 的可拖拽幻灯片编辑器，文本 / 形状 / 图片
- **导出**：PDF（jsPDF）、PPTX（pptxgenjs）、PNG（按页）
- **后端代理**：API Key 仅存于服务端，浏览器侧不接触密钥
- **流式 SSE**：前后端打通的 OpenAI 兼容协议，逐 token 渲染

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Vue 3 · TypeScript · Vite · Pinia · Vue Router · TailwindCSS · Fabric.js · @vueuse/motion |
| 后端 | Python 3.11 · FastAPI · httpx · uvicorn |
| 模型 | 火山引擎方舟（豆包 Doubao）· OpenAI 兼容协议 |
| 导出 | jsPDF · pptxgenjs |

## 5 分钟跑起来

### 0. 准备

- Node.js **20.10+**（推荐 22 LTS）；建议用 [fnm](https://github.com/Schniz/fnm) / nvm 管理
- pnpm 9（`corepack enable && corepack prepare pnpm@9.12.3 --activate`）
- Python **3.11**（推荐用 conda；pip venv 也行）
- 火山引擎方舟 [API Key](https://console.volcengine.com/ark)

### 1. 后端

```bash
# 进入 server 目录
cd server

# 创建虚拟环境（任选一种）
conda create -n aippt python=3.11 -y && conda activate aippt
# 或 python -m venv .venv && .venv\Scripts\activate   # Windows

# 安装依赖
pip install -r requirements.txt -i https://mirrors.aliyun.com/pypi/simple/

# 配置 .env
cp .env.example .env
# 编辑 .env，填入 ARK_API_KEY，根据需要调整 ARK_DEFAULT_MODEL

# 启动
uvicorn app.main:app --reload --port 8000
```

健康检查：

```bash
curl http://localhost:8000/api/health
# {"status":"ok","ark_configured":true,"default_model":"..."}
```

### 2. 前端

```bash
# 回到项目根
cd ..

# 配置 .env.local
cp .env.example .env.local
# 默认即 VITE_ARK_BASE_URL=/api/ai，走后端代理；通常无需改

# 安装依赖并启动
pnpm install
pnpm dev          # http://localhost:5173
```

打开浏览器，输入主题（例如「用 12 页讲清楚 AI Agent 的现状」），点 **生成 PPT**。

## 模型选择

`ARK_DEFAULT_MODEL`（后端 `.env`）和 `VITE_ARK_MODEL`（前端 `.env.local`）支持：

| 类型 | 示例 | 说明 |
|---|---|---|
| 模型 ID | `doubao-1-5-pro-32k-250115` | 注意末尾日期版本号必填 |
| 模型 ID | `doubao-seed-1-6-251015` | Seed 系列最新 |
| 推理接入点 | `ep-20250xxx-xxxxx` | 在火山控制台「在线推理」创建后获取，最稳 |

> 前端的 `VITE_ARK_MODEL` 会**覆盖**后端默认值。两边保持一致最省事。

## 目录

```
aippt/
├── src/                       # 前端源码
│   ├── views/                 # Landing / Outline / Templates / Generating / Editor / Decks
│   ├── components/            # 各页面对应的组件
│   ├── composables/           # useFabricCanvas、useEditorShortcuts 等
│   ├── services/
│   │   ├── ark.ts             # OpenAI 兼容 SSE 客户端（双模式：后端代理 / 浏览器直连）
│   │   ├── ai.ts              # 业务级封装：generateOutline / expandSection / rewrite
│   │   └── export.ts          # PDF / PPTX / PNG 导出
│   ├── stores/                # Pinia：studio / deck / canvas / theme
│   └── styles/                # Design tokens + Tailwind
├── server/                    # FastAPI 后端
│   ├── app/
│   │   ├── main.py            # 路由
│   │   ├── ark.py             # ARK SSE 透传
│   │   └── config.py          # 环境变量加载
│   ├── requirements.txt
│   └── README.md              # 后端独立 README（含 PyCharm/conda 配置）
├── DESIGN.md                  # UI/UX 设计稿
├── tailwind.config.ts
├── vite.config.ts             # /api → :8000，/ark → ARK 直连（备用）
└── package.json
```

## 工作流

```
Landing (输入主题)
  └─→ Outline (AI 流式起草大纲，可拖拽 / 改写 / 增减)
        └─→ Templates (选模板风格)
              └─→ Generating (逐章节流式扩写、配图占位、写入 deck)
                    └─→ Editor (Fabric 画布编辑，AI 助手 6 个快捷操作)
                          └─→ Export (PDF / PPTX / PNG)
```

## 路线图

- [x] v0.1 工程骨架 + Design Tokens
- [x] v0.2 Editor 三栏 + Fabric.js 双向绑定
- [x] v0.3 Landing / Outline / Templates / Decks 页面
- [x] v0.4 Generating 流程 + AI 接入 + 导出
- [x] v0.5 FastAPI 后端代理（API Key 后端持有，SSE 透传）
- [ ] v0.6 用户系统 + 演示稿持久化（SQLite / Postgres）
- [ ] v0.7 模板市场（用户自建模板 + 缩略图自动生成）
- [ ] v0.8 协作（CRDT / WebSocket）
- [ ] v1.0 智能配图（替换占位图为真实生成图 / 图库检索）

## 安全

- **API Key 永远不进仓库**：`.env`、`.env.local`、`server/.env` 均在 `.gitignore` 中
- 提交前运行 `git status` 确认没有 `.env` 出现在 staging
- 真上线请加：鉴权（JWT / Session）、限流（slowapi / Redis）、用量记录、审计日志、HTTPS、CSP

## 常见问题

**前端 "Unexpected end of JSON input"**
后端 SSE 把 ARK 错误打到日志了。看 uvicorn 终端的 `ARK upstream error` 行，多半是模型名错或 Key 失效。

**改了 `.env` 没生效**
- 后端：uvicorn 的 `--reload` 只看 `.py`，必须 Ctrl+C 重启
- 前端：vite 启动时读一次 env，必须重启 `pnpm dev`

**模型 404 "InvalidEndpointOrModel.NotFound"**
模型名拼写不对。`Doubao-1.5-pro-32k`（错） vs `doubao-1-5-pro-32k-250115`（对）。或换成推理接入点 `ep-xxxxxx`。

**Windows PowerShell `pnpm 不是命令`**
`$env:Path += ";$env:APPDATA\npm"; pnpm -v`，或永久写进用户环境变量后重启所有终端窗口。

## 贡献

欢迎 PR。建议先开 issue 讨论方向。代码风格：
- 前端：Vue 3 `<script setup lang="ts">`，TypeScript 严格模式
- 后端：FastAPI + 类型注解，httpx 异步

## License

[Apache License 2.0](LICENSE)

---

**Inspired by** Kimi PPT · WPS AI PPT · Gamma · Tome
