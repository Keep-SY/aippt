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
- content：常规内容页，需要 title 和 bullets（2-5 条，每条 8-30 字）
- two-col：对比/并列页，需要 title 和 columns（恰好 2 项，各 heading + 2-4 bullets）
- quote：金句页，需要 title 和 quote.text（30-80 字），quote.author 可选
- summary：总结页，需要 title 和 columns（2-3 项，各 heading + 1-3 bullets）

规则：
1. 第 1 页固定 layout=cover
2. 若总章节数 >= 4，则第 2 页插一个 layout=toc
3. 最后一页固定 layout=summary
4. 中间页根据内容性质灵活选择 content / two-col / quote
5. 不要连续 3 页都是同一种 layout，保持视觉节奏

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
      onDelta: (_d, full) => p.onProgress?.(full)
    })
    const parsed = JSON.parse(stripCodeFence(text)) as { slides: SlideSchema[] }
    if (!Array.isArray(parsed.slides) || parsed.slides.length === 0) return null
    return parsed.slides.map((s, i) => ({ ...s, pageNumber: i + 1 }))
  } catch (e) {
    console.warn('[slideSchema] AI 生成失败，使用 fallback', e)
    return null
  }
}

/**
 * Fallback：把每个 OutlineSection 直接转成 layout=content
 * 第一页强制 cover，最后一页强制 summary
 */
export function fallbackContentSchemas(outline: Outline): SlideSchema[] {
  const total = outline.sections.length
  return outline.sections.map((s, i): SlideSchema => {
    if (i === 0) {
      return {
        layout: 'cover',
        title: s.title || outline.topic,
        subtitle: s.bullets[0]?.text,
        pageNumber: 1
      }
    }
    if (i === total - 1) {
      return {
        layout: 'summary',
        title: s.title || '总结',
        columns: s.bullets.slice(0, 3).map((b) => ({
          heading: b.text.slice(0, 14),
          bullets: [b.text]
        })),
        pageNumber: i + 1
      }
    }
    return {
      layout: 'content',
      title: s.title,
      bullets: s.bullets.map((b) => b.text),
      pageNumber: i + 1
    }
  })
}

function stripCodeFence(s: string): string {
  const t = s.trim()
  if (t.startsWith('```')) {
    return t.replace(/^```[a-zA-Z]*\n?/, '').replace(/```\s*$/, '').trim()
  }
  return t
}
