/**
 * AI 业务能力 —— 基于 ark.ts 的高层封装
 * - 大纲生成（流式）
 * - PPT 内容生成（按章节流式产出，每页一个 Slide）
 * - 文本改写（用于 AI 助手的 6 个快捷操作）
 */
import { streamChat, type ChatMessage } from './ark'
import type { Attachment, Outline, OutlineSection } from '@/stores/studio'

const SYS_OUTLINE = `你是一位资深的演示稿架构师，作品风格接近《经济学人》图表 + 麦肯锡咨询报告。

输出格式：仅严格 JSON
{ "topic": string, "sections": [{ "title": string, "bullets": string[] }] }
不要 markdown 包裹，不要解释，不要前后空白。

章节结构（章节数 = 用户指定页数，默认 12）：
- 第 1 页 = 封面：title 简洁有力，bullets 第 1 条作副标题
- 第 2 页 = 背景 / 目录：交代脉络或行业现状
- 中间章节 = 主体内容（按主题展开）
- 倒数第 2 页 = 关键洞察 / 趋势展望
- 最后一页 = Q&A / 感谢页

每条 bullet 必须满足以下至少 2 项（用于防止内容空洞）：
1. 含具体数字 / 百分比 / 时间（如「2024 年市场规模 380 亿美元」）
2. 含真实案例 / 公司 / 产品名（如「OpenAI ChatGPT 周活破 2 亿」「Anthropic Claude」）
3. 含动作或方法论（如「采用 ReAct 框架完成工具调用」）
4. 含对比或因果（如「相比传统 RPA，错误率下降 60%」）

硬约束：
- 每条 bullet 长度 30-80 字，**不要少于 25 字**
- 每页 3-5 条 bullet，**不少于 3 条**
- title ≤ 14 字，可用动词 / 主张句，避免只是名词
- 若不确定数字真实性，可在末尾标 [需核实]，但不要拒绝写
- 封面页 / Q&A 页可放宽 bullet 字数下限`

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
  /** 用户在 Landing 页贴的参考资料（文件 / URL / 文本） */
  attachments?: Attachment[]
  onProgress?: (partial: string) => void
  signal?: AbortSignal
}

/**
 * 生成大纲（一次性 JSON）
 * 注：流式期间在 onProgress 暴露原始文本（用于 UI 展示打字机效果），完成后解析 JSON。
 */
export async function generateOutline(p: GenerateOutlineParams): Promise<Outline> {
  const userParts = [`主题：${p.topic}`, `页数：${p.pages}`]
  const refBlock = formatAttachments(p.attachments)
  if (refBlock) userParts.push(refBlock)
  userParts.push('请输出 JSON。')

  const messages: ChatMessage[] = [
    { role: 'system', content: SYS_OUTLINE },
    { role: 'user', content: userParts.join('\n') }
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
      content: `你是一位资深 PPT 内容写手，风格类似咨询公司分析报告 + 行业白皮书。

任务：基于章节标题与要点，写一段 200-360 字的页面正文 / 演讲稿。

硬约束：
- 至少包含 1 个具体数字（市场规模 / 增长率 / 案例数据 / 时间）
- 至少包含 1 个真实公司或产品名（OpenAI / Anthropic / Google / 字节 / 阿里…）
- 用 2-3 个具体场景或事实支撑每个要点，避免抽象描述
- 不要 markdown 标记、不要标题、不要列表符号，只返回连贯正文
- 若数据不确定可在末尾标 [需核实]，但不要拒绝写
- 中文行文，专业自然，不要"首先 / 其次 / 综上"这类八股结构词`
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

function formatAttachments(list?: Attachment[]): string {
  if (!list || list.length === 0) return ''
  const blocks = list.map((a, i) => {
    const head = a.kind === 'url' ? `资料 ${i + 1}（链接）：${a.name}` : `资料 ${i + 1}：${a.name}`
    return `--- ${head} ---\n${a.text}`
  })
  return [
    '以下是用户提供的参考资料，请优先据此组织内容；若资料与主题冲突，以主题为准：',
    ...blocks
  ].join('\n')
}
