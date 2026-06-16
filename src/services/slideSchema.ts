/**
 * SlideSchema —— 页面级结构化描述（AI 生成 / 前端渲染的中间层）
 *
 * 目的：让 AI 不只输出"标题+bullets"的扁平大纲，而是按页给出 layout 指令，
 * 前端再把 SlideSchema 渲染成不同视觉的 Fabric 页面。
 */
import { streamChat, type ChatMessage } from './ark'
import type { Attachment, Outline } from '@/stores/studio'

export type SlideLayout =
  | 'cover'      // 封面：超大标题 + 副标题
  | 'toc'        // 目录：左标题 + 右编号列表
  | 'content'    // 普通内容：标题 + bullet 列表
  | 'two-col'    // 双栏：左右各一组小标题+bullets
  | 'quote'      // 引言/金句
  | 'summary'    // 总结/Q&A：标题 + 三栏关键要点

export interface SlideSchema {
  layout: SlideLayout
  title: string
  subtitle?: string
  bullets?: string[]
  columns?: { heading: string; bullets: string[] }[]
  quote?: { text: string; author?: string }
  tocItems?: string[]
  pageNumber?: number
}

const SYS_SCHEMA = `你是一位资深的演示稿设计师。任务：基于已有大纲，为每一页选择合适的 layout 并生成结构化数据。

可用 layout：
- cover：封面，仅需 title + subtitle
- toc：目录，需要 title 和 tocItems（章节标题数组，3-8 项）
- content：常规内容页，需要 title 和 bullets（3-5 条，每条 25-70 字）
- two-col：对比/并列页，需要 title 和 columns（恰好 2 项，各 heading + 2-4 bullets，每条 ≥ 20 字）
- quote：金句页，需要 title 和 quote.text（30-100 字），quote.author 可选
- summary：总结页，需要 title 和 columns（2-3 项，各 heading + 1-3 bullets）

页面节奏：
1. 第 1 页固定 layout=cover
2. 若总章节数 >= 4，则第 2 页插一个 layout=toc
3. 最后一页固定 layout=summary
4. 中间页根据内容性质灵活选择 content / two-col / quote
5. 不要连续 3 页都是同一种 layout，保持视觉节奏

内容硬约束（防空洞，最重要）：
- 每条 bullet 必须 ≥ 25 字，包含至少一个：具体数字 / 公司或产品名 / 案例 / 动作方法
- 若原大纲 bullet 过短或过抽象，**请补足细节后再写入**（添加具体数字、公司、动作）
- content 页 bullets 数 ≥ 3；two-col 每列 bullets 数 ≥ 2
- 不确定的数据可加 [需核实]，但不要省略

输出严格 JSON：{ "slides": [SlideSchema, ...] }
不要 markdown 包裹、不要解释、不要前后空白。`

interface GenerateSchemaParams {
  outline: Outline
  attachments?: Attachment[]
  onProgress?: (partial: string) => void
  signal?: AbortSignal
}

/**
 * 调用 AI 把 Outline → SlideSchema[]
 * 失败时返回 null，调用方应回退到 fallbackContentSchemas
 */
export async function generateSlideSchemas(
  p: GenerateSchemaParams
): Promise<SlideSchema[] | null> {
  const outlineJson = JSON.stringify(
    p.outline.sections.map((s) => ({
      title: s.title,
      bullets: s.bullets.map((b) => b.text)
    }))
  )

  const messages: ChatMessage[] = [
    { role: 'system', content: SYS_SCHEMA },
    {
      role: 'user',
      content: `演示主题：${p.outline.topic}\n章节数：${p.outline.sections.length}\n\n大纲（JSON）：\n${outlineJson}\n\n请输出 { "slides": [...] }。`
    }
  ]

  try {
    const text = await streamChat({
      messages,
      temperature: 0.6,
      signal: p.signal,
      extra: { response_format: { type: 'json_object' } },
      onDelta: (_d, full) => p.onProgress?.(full)
    })
    const cleaned = stripCodeFence(text)
    let parsed: { slides: SlideSchema[] }
    try {
      parsed = JSON.parse(cleaned) as { slides: SlideSchema[] }
    } catch {
      // 容错：从乱文本里抓第一个 { ... } 块
      const m = cleaned.match(/\{[\s\S]*}/)
      if (!m) {
        console.warn('[slideSchema] AI 返回非 JSON：', text.slice(0, 400))
        return null
      }
      parsed = JSON.parse(m[0]) as { slides: SlideSchema[] }
    }
    if (!Array.isArray(parsed.slides) || parsed.slides.length === 0) {
      console.warn('[slideSchema] AI 输出 slides 为空')
      return null
    }
    return parsed.slides.map((s, i) => ({ ...s, pageNumber: i + 1 }))
  } catch (e) {
    console.warn('[slideSchema] AI 生成失败，使用 fallback', e)
    return null
  }
}

/**
 * Fallback：让中间页在 content / two-col / quote 之间轮换，避免每页都一样
 * 第一页 cover、若总数 ≥4 第二页 toc、最后一页 summary
 */
export function fallbackContentSchemas(outline: Outline): SlideSchema[] {
  const total = outline.sections.length
  const hasToc = total >= 4
  const result: SlideSchema[] = []

  outline.sections.forEach((s, i) => {
    if (i === 0) {
      result.push({
        layout: 'cover',
        title: s.title || outline.topic,
        subtitle: s.bullets[0]?.text,
        pageNumber: 1
      })
      return
    }
    if (hasToc && i === 1) {
      result.push({
        layout: 'toc',
        title: '目录',
        tocItems: outline.sections.slice(1, -1).map((sec) => sec.title).slice(0, 8),
        pageNumber: i + 1
      })
      return
    }
    if (i === total - 1) {
      result.push({
        layout: 'summary',
        title: s.title || '总结',
        columns: s.bullets.slice(0, 3).map((b) => ({
          heading: b.text.slice(0, 14),
          bullets: [b.text]
        })),
        pageNumber: i + 1
      })
      return
    }
    // 中间页轮换：每 4 页插一个 quote、每 3 页插一个 two-col
    const middleIdx = i - (hasToc ? 2 : 1)
    const bullets = s.bullets.map((b) => b.text)
    if (middleIdx > 0 && middleIdx % 4 === 0 && bullets[0]) {
      result.push({
        layout: 'quote',
        title: s.title,
        quote: { text: bullets[0] },
        pageNumber: i + 1
      })
    } else if (middleIdx % 3 === 0 && bullets.length >= 2) {
      const half = Math.ceil(bullets.length / 2)
      result.push({
        layout: 'two-col',
        title: s.title,
        columns: [
          { heading: '要点 A', bullets: bullets.slice(0, half) },
          { heading: '要点 B', bullets: bullets.slice(half) }
        ],
        pageNumber: i + 1
      })
    } else {
      result.push({
        layout: 'content',
        title: s.title,
        bullets,
        pageNumber: i + 1
      })
    }
  })
  return result
}

function stripCodeFence(s: string): string {
  const t = s.trim()
  if (t.startsWith('```')) {
    return t.replace(/^```[a-zA-Z]*\n?/, '').replace(/```\s*$/, '').trim()
  }
  return t
}
