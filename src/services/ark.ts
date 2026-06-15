/**
 * AI service —— 豆包 / Volc Engine ARK
 * 协议：OpenAI 兼容（/chat/completions），SSE 流式输出
 *
 * 文档：https://www.volcengine.com/docs/82379/1298454
 *
 * 双模式：
 *   - 后端模式（推荐）：VITE_ARK_BASE_URL = /api/ai，由 FastAPI 持有 Key 透传
 *   - 直连模式（仅 dev）：VITE_ARK_BASE_URL = /ark，浏览器直接持 Key 经 vite proxy
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ArkConfig {
  /** 后端模式下可为空 */
  apiKey: string
  baseUrl: string
  model: string
  /** true 表示走自家后端（/api/ai 前缀），不需要前端持 Key */
  useBackend: boolean
}

export class ArkConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ArkConfigError'
  }
}

function isBackendUrl(baseUrl: string): boolean {
  return /^\/api(\/|$)/.test(baseUrl)
}

export function getArkConfig(): ArkConfig {
  const apiKey = import.meta.env.VITE_ARK_API_KEY ?? ''
  const baseUrl = import.meta.env.VITE_ARK_BASE_URL || '/api/ai'
  const model = import.meta.env.VITE_ARK_MODEL || 'doubao-1-5-pro-32k-250115'
  const useBackend = isBackendUrl(baseUrl)
  if (!useBackend && !apiKey) {
    throw new ArkConfigError(
      '直连模式缺少 VITE_ARK_API_KEY。建议改用后端：将 VITE_ARK_BASE_URL 设为 /api/ai 并启动 server/。'
    )
  }
  return { apiKey, baseUrl, model, useBackend }
}

export function isArkConfigured(): boolean {
  const baseUrl = import.meta.env.VITE_ARK_BASE_URL || '/api/ai'
  if (isBackendUrl(baseUrl)) return true // 后端是否真的就绪由请求阶段验证
  return Boolean(import.meta.env.VITE_ARK_API_KEY)
}

interface StreamOptions {
  messages: ChatMessage[]
  /** 每次模型增量 token 触发 */
  onDelta?: (delta: string, full: string) => void
  /** 完成时触发 */
  onDone?: (full: string) => void
  /** 错误 */
  onError?: (err: Error) => void
  signal?: AbortSignal
  temperature?: number
  /** 自定义额外 messages 之上的覆盖项 */
  extra?: Record<string, unknown>
}

/**
 * 流式调用豆包 chat completions
 * 返回 promise，resolve 时附带完整文本
 */
export async function streamChat(opts: StreamOptions): Promise<string> {
  const cfg = getArkConfig()
  const url = `${cfg.baseUrl}/chat/completions`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }
  if (!cfg.useBackend) {
    // 直连模式才在浏览器侧带 Key
    headers.Authorization = `Bearer ${cfg.apiKey}`
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    signal: opts.signal,
    body: JSON.stringify({
      model: cfg.model,
      messages: opts.messages,
      stream: true,
      temperature: opts.temperature ?? 0.7,
      ...(opts.extra ?? {})
    })
  })

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => '')
    const err = new Error(`Ark API ${res.status}: ${text || res.statusText}`)
    opts.onError?.(err)
    throw err
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  let full = ''

  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      // SSE：逐行解析，每条事件以空行分隔
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const raw of lines) {
        const line = raw.trim()
        if (!line || !line.startsWith('data:')) continue
        const payload = line.slice(5).trim()
        if (payload === '[DONE]') {
          opts.onDone?.(full)
          return full
        }
        try {
          const json = JSON.parse(payload)
          if (json?.error) {
            const msg =
              typeof json.error === 'string'
                ? json.error
                : json.error?.message || JSON.stringify(json.error)
            const err = new Error(`ARK upstream: ${msg}`)
            opts.onError?.(err)
            throw err
          }
          const delta: string =
            json?.choices?.[0]?.delta?.content ??
            json?.choices?.[0]?.message?.content ??
            ''
          if (delta) {
            full += delta
            opts.onDelta?.(delta, full)
          }
        } catch (e) {
          if ((e as Error).message?.startsWith('ARK upstream:')) throw e
          // 容错：忽略坏的 chunk
        }
      }
    }
    opts.onDone?.(full)
    return full
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      opts.onDone?.(full)
      return full
    }
    opts.onError?.(err as Error)
    throw err
  } finally {
    reader.releaseLock()
  }
}
