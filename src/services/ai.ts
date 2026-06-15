/**
 * AI 业务能力 —— 基于 ark.ts 的高层封装
 * - 大纲生成（流式）
 * - PPT 内容生成（按章节流式产出，每页一个 Slide）
 * - 文本改写（用于 AI 助手的 6 个快捷操作）
 */
import { streamChat, type ChatMessage } from './ark'
import type { Outline, OutlineSection } from '@/stores/studio'

const SYS_OUTLINE = `你是一位资深的演示稿架构师。任务：根据用户主题输出 PPT 大纲。
要求：
1. 仅输出严格的 JSON，外层是 { "topic": string, "sections": [{ "title": string, "bullets": string[] }] }
2. 不要任何 markdown 包裹、不要解释、不要前后空白
3. 章节数 = 用户指定页数（默认 12）
4. 第一页固定为封面（title 简洁有力，bullets 含一个副标题）
5. 最后一页固定为 Q&A 或感谢页
6. 中间章节每页 2-4 个 bullets，长度精炼，每条不超过 30 字`

const SYS_REWRITE: Record<string, string> = {
  rewrite: '你是一位文字编辑。请改写下列文本，保持原意但更专业、更自然。仅返回改写后的文本，不要解释。',
  expand: '你是一位文字编辑。请扩写下列文本，加入示例与细节但不偏离主题。仅返回结果。',
  shorten: '你是一位文字编辑。请压缩下列文本到一半长度，保留核心信息。仅返回结果。',
  translate: '你是一位中英互译专家。检测下列文本语种后翻译为另一种语言。仅返回译文。',
  restyle: '你是一位品牌文案。请将下列文本改成更具商务专业感的语气。仅返回结果。',
  proofread: '你是一位语文老师。修正下列文本的语法/错别字/标点，保持原意。仅返回修正版。'
} as const

export type RewriteKind = keyof typeof SYS_REWRITE

interface GenerateOutlineParams {
  topic: string
  pages: number
  onProgress?: (partial: string) => void
  signal?: AbortSignal
}

/**
 * 生成大纲（一次性 JSON）
 * 注：流式期间在 onProgress 暴露原始文本（用于 UI 展示打字机效果），完成后解析 JSON。
 */
export async function generateOutline(p: GenerateOutlineParams): Promise<Outline> {
  const messages: ChatMessage[] = [
    { role: 'system', content: SYS_OUTLINE },
    { role: 'user', content: `主题：${p.topic}\n页数：${p.pages}\n请输出 JSON。` }
  ]
  const text = await streamChat({
    messages,
    temperature: 0.6,
    signal: p.signal,
    onDelta: (_d, full) => p.onProgress?.(full)
  })

  // 容错：模型可能仍包了 ```json ... ```
  const json = stripCodeFence(text)
  const parsed = JSON.parse(json) as {
    topic?: string
    sections: { title: string; bullets: string[] }[]
  }

  const uid = () => Math.random().toString(36).slice(2, 10)
  return {
    topic: parsed.topic || p.topic,
    pages: parsed.sections.length,
    sections: parsed.sections.map((s) => ({
      id: uid(),
      title: s.title,
      bullets: (s.bullets || []).map((b) => ({ id: uid(), text: b }))
    }))
  }
}

interface ExpandSectionParams {
  outline: Outline
  section: OutlineSection
  onDelta?: (delta: string, full: string) => void
  signal?: AbortSignal
}

/**
 * 把单个章节展开为更丰富的演讲稿（slide 主体）
 * 后续可用于 Generating 阶段每页流式产出
 */
export async function expandSection(p: ExpandSectionParams): Promise<string> {
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: `你是一位 PPT 内容写手。基于章节标题与要点，写一段 80-160 字的演讲稿。语气专业自然，无 markdown，无标题。仅返回正文。`
    },
    {
      role: 'user',
      content: `主题：${p.outline.topic}\n章节：${p.section.title}\n要点：\n${p.section.bullets
        .map((b) => '- ' + b.text)
        .join('\n')}`
    }
  ]
  return streamChat({
    messages,
    temperature: 0.7,
    signal: p.signal,
    onDelta: p.onDelta
  })
}

interface RewriteParams {
  kind: RewriteKind
  text: string
  onDelta?: (delta: string, full: string) => void
  signal?: AbortSignal
}

export async function rewrite(p: RewriteParams): Promise<string> {
  const messages: ChatMessage[] = [
    { role: 'system', content: SYS_REWRITE[p.kind] },
    { role: 'user', content: p.text }
  ]
  return streamChat({
    messages,
    temperature: 0.7,
    signal: p.signal,
    onDelta: p.onDelta
  })
}

function stripCodeFence(s: string): string {
  const t = s.trim()
  if (t.startsWith('```')) {
    return t.replace(/^```[a-zA-Z]*\n?/, '').replace(/```\s*$/, '').trim()
  }
  return t
}
