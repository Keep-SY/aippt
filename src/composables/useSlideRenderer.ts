/**
 * useSlideRenderer
 * - 把 SlideSchema 渲染成 Fabric Canvas JSON（与 Slide.fabricJson 同结构）
 * - 6 种 layout 各自有一个纯函数，输出 objects[]
 * - 不依赖 fabric runtime（仅生成 JSON），可在 store 中安全使用
 *
 * 约束布局策略（B 方案）：
 *   1. 每个 layout 声明一个"安全可用区"（content area），渲染必须落在区域内
 *   2. 文本不写死 fontSize，而是按"字数 × 行数"反推合适字号 + 行高
 *   3. Title 太长按字数阶梯降级（48 / 40 / 32 / 28）
 *   4. Bullet 数量决定行高，多则压缩字号
 *   5. 估算高度超出区域 → 整体降一档；仍超 → 截断尾部 + …
 */
import type { SlideSchema, SlideLayout } from '@/services/slideSchema'

export interface RenderTheme {
  bg: string
  accent: string
  font: 'sans' | 'serif' | 'mono'
}

export const SLIDE_W = 1280
export const SLIDE_H = 720
const SAFE_TOP = 80
const SAFE_BOTTOM = 80
const SAFE_LEFT = 96
const SAFE_RIGHT = 96
const CONTENT_W = SLIDE_W - SAFE_LEFT - SAFE_RIGHT // 1088

const fontFamilyOf = (f: RenderTheme['font']) =>
  f === 'serif'
    ? 'Georgia, serif'
    : f === 'mono'
      ? 'JetBrains Mono, monospace'
      : 'Inter, PingFang SC, sans-serif'

/**
 * 估算中文文本在给定 fontSize / width 下需要的行数
 * 中文字宽 ≈ fontSize * 1.0；英文按 0.55；混排取均值
 */
function estimateLines(text: string, fontSize: number, width: number): number {
  if (!text) return 1
  const charsPerLine = Math.max(1, Math.floor(width / (fontSize * 0.95)))
  return Math.max(1, Math.ceil(text.length / charsPerLine))
}

/** 估算一段 textbox 渲染高度 */
function estimateTextHeight(text: string, fontSize: number, width: number, lineHeight = 1.32): number {
  return estimateLines(text, fontSize, width) * fontSize * lineHeight
}

/** 按字数选 title 字号 */
function pickTitleFontSize(text: string, scale: 'cover' | 'normal' | 'compact'): number {
  const len = text.length
  if (scale === 'cover') {
    if (len <= 12) return 80
    if (len <= 20) return 64
    if (len <= 30) return 52
    return 44
  }
  if (scale === 'normal') {
    if (len <= 14) return 48
    if (len <= 22) return 40
    if (len <= 32) return 32
    return 28
  }
  // compact
  if (len <= 14) return 40
  if (len <= 22) return 32
  return 26
}

/**
 * 按"bullet 条数 + 平均字数 + 可用高度"反推 fontSize 与行高
 * 返回 { fontSize, lineGap }；保证 ∑(每条估算高度 + lineGap) ≤ availH
 */
function fitBullets(
  texts: string[],
  width: number,
  availH: number,
  opts?: { minSize?: number; maxSize?: number }
): { fontSize: number; lineGap: number; truncated: string[] } {
  const min = opts?.minSize ?? 16
  const max = opts?.maxSize ?? 26
  const candidates = [max, max - 2, max - 4, max - 6, min + 2, min].filter((v) => v >= min)
  for (const fs of candidates) {
    const gap = Math.max(8, Math.round(fs * 0.45))
    let total = 0
    for (const t of texts) {
      total += estimateTextHeight(t, fs, width) + gap
    }
    if (total <= availH) return { fontSize: fs, lineGap: gap, truncated: texts }
  }
  // 仍放不下 → 截掉尾部
  const fs = min
  const gap = Math.max(8, Math.round(fs * 0.45))
  const out: string[] = []
  let total = 0
  for (const t of texts) {
    const h = estimateTextHeight(t, fs, width) + gap
    if (total + h > availH) break
    out.push(t)
    total += h
  }
  if (out.length < texts.length && out.length > 0) {
    out[out.length - 1] = out[out.length - 1].replace(/[。.!！?？\s]*$/, '') + '…'
  }
  return { fontSize: fs, lineGap: gap, truncated: out }
}

/** 解析 CSS gradient → Fabric Gradient 配置；不识别返回纯色 */
function parseGradient(css: string): unknown {
  const m = css.match(/linear-gradient\(([^,]+),(.+)\)/)
  if (!m) return css.startsWith('#') ? css : '#7C5CFF'
  const stops = m[2]
    .split(/,(?![^()]*\))/)
    .map((s) => s.trim())
    .filter(Boolean)
  if (stops.length < 2) return stops[0] || '#7C5CFF'
  return {
    type: 'linear',
    coords: { x1: 0, y1: 0, x2: SLIDE_W, y2: SLIDE_H },
    colorStops: stops.map((c, i) => ({ offset: i / (stops.length - 1), color: c }))
  }
}

function bg(theme: RenderTheme) {
  return {
    type: 'Rect',
    left: 0,
    top: 0,
    width: SLIDE_W,
    height: SLIDE_H,
    fill: parseGradient(theme.bg),
    selectable: false,
    evented: false,
    name: 'bg'
  }
}

function accentBar(theme: RenderTheme, x = SAFE_LEFT, y = SLIDE_H - 80, w = 60) {
  return {
    type: 'Rect',
    left: x,
    top: y,
    width: w,
    height: 4,
    rx: 2,
    ry: 2,
    fill: theme.accent,
    name: 'accent-bar'
  }
}

function textbox(opts: {
  text: string
  left: number
  top: number
  width: number
  fontSize: number
  fontWeight?: number
  fontFamily: string
  fill?: string
  textAlign?: 'left' | 'center' | 'right'
  name?: string
  fontStyle?: 'normal' | 'italic'
  opacity?: number
  lineHeight?: number
}) {
  return {
    type: 'Textbox',
    left: opts.left,
    top: opts.top,
    width: opts.width,
    fontSize: opts.fontSize,
    fontWeight: opts.fontWeight ?? 400,
    fontFamily: opts.fontFamily,
    fill: opts.fill ?? '#FFFFFF',
    text: opts.text,
    textAlign: opts.textAlign ?? 'left',
    fontStyle: opts.fontStyle ?? 'normal',
    opacity: opts.opacity ?? 1,
    lineHeight: opts.lineHeight ?? 1.32,
    name: opts.name
  }
}

// =============== 6 种 layout ===============

function renderCover(s: SlideSchema, theme: RenderTheme): unknown[] {
  const ff = fontFamilyOf(theme.font)
  const objs: unknown[] = [bg(theme)]
  const titleFS = pickTitleFontSize(s.title, 'cover')
  const titleLines = estimateLines(s.title, titleFS, CONTENT_W)
  const titleH = titleLines * titleFS * 1.18
  // 居中：把整体（title + 可选 subtitle）放在垂直中间
  const subtitleFS = 26
  const subtitleH = s.subtitle ? estimateTextHeight(s.subtitle, subtitleFS, CONTENT_W) : 0
  const blockH = titleH + (subtitleH ? 32 + subtitleH : 0)
  const titleTop = Math.max(SAFE_TOP, (SLIDE_H - blockH) / 2)

  objs.push(
    textbox({
      text: s.title,
      left: SAFE_LEFT,
      top: titleTop,
      width: CONTENT_W,
      fontSize: titleFS,
      fontWeight: 800,
      fontFamily: ff,
      textAlign: 'left',
      lineHeight: 1.18,
      name: 'title'
    })
  )
  if (s.subtitle) {
    objs.push(
      textbox({
        text: s.subtitle,
        left: SAFE_LEFT,
        top: titleTop + titleH + 32,
        width: CONTENT_W,
        fontSize: subtitleFS,
        fontWeight: 400,
        fontFamily: ff,
        fill: 'rgba(255,255,255,0.85)',
        textAlign: 'left',
        name: 'subtitle'
      })
    )
  }
  objs.push(accentBar(theme, SAFE_LEFT, SLIDE_H - 96, 80))
  return objs
}

function renderToc(s: SlideSchema, theme: RenderTheme): unknown[] {
  const ff = fontFamilyOf(theme.font)
  const objs: unknown[] = [bg(theme)]
  const title = s.title || '目录'
  const titleFS = pickTitleFontSize(title, 'normal')
  objs.push(
    textbox({
      text: title,
      left: SAFE_LEFT,
      top: 120,
      width: 380,
      fontSize: titleFS,
      fontWeight: 800,
      fontFamily: ff,
      name: 'title'
    })
  )
  objs.push(accentBar(theme, SAFE_LEFT, 120 + titleFS * 1.4 + 16, 60))

  const items = (s.tocItems || []).slice(0, 8)
  // 右侧编号列表区：x≈540 到 SLIDE_W-96，竖向 SAFE_TOP→SLIDE_H-SAFE_BOTTOM
  const listLeft = 540
  const listTop = 130
  const listH = SLIDE_H - listTop - SAFE_BOTTOM
  const rowH = Math.min(72, Math.max(40, listH / Math.max(items.length, 1)))
  const itemFS = rowH > 60 ? 24 : rowH > 48 ? 20 : 18
  items.forEach((item, i) => {
    objs.push(
      textbox({
        text: String(i + 1).padStart(2, '0'),
        left: listLeft,
        top: listTop + i * rowH,
        width: 80,
        fontSize: Math.round(itemFS * 1.15),
        fontWeight: 700,
        fontFamily: ff,
        fill: theme.accent,
        name: `toc-num-${i}`
      })
    )
    objs.push(
      textbox({
        text: item,
        left: listLeft + 80,
        top: listTop + i * rowH + Math.round(itemFS * 0.1),
        width: SLIDE_W - SAFE_RIGHT - listLeft - 80,
        fontSize: itemFS,
        fontFamily: ff,
        fill: 'rgba(255,255,255,0.92)',
        name: `toc-${i}`
      })
    )
  })
  return objs
}

function renderContent(s: SlideSchema, theme: RenderTheme): unknown[] {
  const ff = fontFamilyOf(theme.font)
  const objs: unknown[] = [bg(theme)]
  const titleFS = pickTitleFontSize(s.title, 'normal')
  const titleTop = 96
  const titleH = estimateTextHeight(s.title, titleFS, CONTENT_W, 1.2)
  const barTop = titleTop + titleH + 16

  objs.push(
    textbox({
      text: s.title,
      left: SAFE_LEFT,
      top: titleTop,
      width: CONTENT_W,
      fontSize: titleFS,
      fontWeight: 700,
      fontFamily: ff,
      lineHeight: 1.2,
      name: 'title'
    })
  )
  objs.push(accentBar(theme, SAFE_LEFT, barTop, 48))

  const bullets = (s.bullets || []).slice(0, 5).map((b) => '· ' + b)
  const bulletTop = barTop + 32
  const availH = SLIDE_H - SAFE_BOTTOM - bulletTop
  const fit = fitBullets(bullets, CONTENT_W, availH, { minSize: 16, maxSize: 24 })
  let cursor = bulletTop
  fit.truncated.forEach((b, i) => {
    objs.push(
      textbox({
        text: b,
        left: SAFE_LEFT,
        top: cursor,
        width: CONTENT_W,
        fontSize: fit.fontSize,
        fontFamily: ff,
        fill: 'rgba(255,255,255,0.9)',
        lineHeight: 1.4,
        name: `bullet-${i}`
      })
    )
    cursor += estimateTextHeight(b, fit.fontSize, CONTENT_W, 1.4) + fit.lineGap
  })
  return objs
}

function renderTwoCol(s: SlideSchema, theme: RenderTheme): unknown[] {
  const ff = fontFamilyOf(theme.font)
  const objs: unknown[] = [bg(theme)]
  const titleFS = pickTitleFontSize(s.title, 'compact')
  const titleTop = 80
  const titleH = estimateTextHeight(s.title, titleFS, CONTENT_W, 1.2)
  const barTop = titleTop + titleH + 14

  objs.push(
    textbox({
      text: s.title,
      left: SAFE_LEFT,
      top: titleTop,
      width: CONTENT_W,
      fontSize: titleFS,
      fontWeight: 700,
      fontFamily: ff,
      lineHeight: 1.2,
      name: 'title'
    })
  )
  objs.push(accentBar(theme, SAFE_LEFT, barTop, 48))

  const cols = (s.columns || []).slice(0, 2)
  const gap = 48
  const colW = (CONTENT_W - gap) / 2
  const colTop = barTop + 36
  const colAvailH = SLIDE_H - SAFE_BOTTOM - colTop

  cols.forEach((col, ci) => {
    const x = SAFE_LEFT + ci * (colW + gap)
    const headFS = 24
    objs.push(
      textbox({
        text: col.heading,
        left: x,
        top: colTop,
        width: colW,
        fontSize: headFS,
        fontWeight: 700,
        fontFamily: ff,
        fill: theme.accent,
        lineHeight: 1.3,
        name: `col-${ci}-heading`
      })
    )
    const headH = estimateTextHeight(col.heading, headFS, colW, 1.3)
    const bullets = (col.bullets || []).slice(0, 4).map((b) => '· ' + b)
    const bAvailH = colAvailH - headH - 18
    const fit = fitBullets(bullets, colW, bAvailH, { minSize: 14, maxSize: 20 })
    let cursor = colTop + headH + 18
    fit.truncated.forEach((b, bi) => {
      objs.push(
        textbox({
          text: b,
          left: x,
          top: cursor,
          width: colW,
          fontSize: fit.fontSize,
          fontFamily: ff,
          fill: 'rgba(255,255,255,0.88)',
          lineHeight: 1.4,
          name: `col-${ci}-bullet-${bi}`
        })
      )
      cursor += estimateTextHeight(b, fit.fontSize, colW, 1.4) + fit.lineGap
    })
  })
  return objs
}

function renderQuote(s: SlideSchema, theme: RenderTheme): unknown[] {
  const ff = fontFamilyOf(theme.font)
  const objs: unknown[] = [bg(theme)]
  // 大引号
  objs.push(
    textbox({
      text: '“',
      left: SAFE_LEFT,
      top: 60,
      width: 200,
      fontSize: 200,
      fontWeight: 800,
      fontFamily: ff,
      fill: theme.accent,
      opacity: 0.55,
      lineHeight: 1,
      name: 'open-quote'
    })
  )
  const quoteText = s.quote?.text || s.title
  const quoteW = SLIDE_W - 200 - SAFE_RIGHT
  // 引言字号按长度自适应
  const len = quoteText.length
  const quoteFS = len <= 50 ? 36 : len <= 90 ? 30 : 26
  const quoteTop = 220
  const quoteH = estimateTextHeight(quoteText, quoteFS, quoteW, 1.45)
  // 上下居中：如果太长，从更高位置开始
  const top = Math.max(quoteTop, Math.min(quoteTop, (SLIDE_H - quoteH) / 2))
  objs.push(
    textbox({
      text: quoteText,
      left: 200,
      top,
      width: quoteW,
      fontSize: quoteFS,
      fontWeight: 600,
      fontFamily: ff,
      fontStyle: 'italic',
      textAlign: 'left',
      lineHeight: 1.45,
      name: 'quote-text'
    })
  )
  if (s.quote?.author) {
    objs.push(
      textbox({
        text: '— ' + s.quote.author,
        left: 200,
        top: SLIDE_H - 120,
        width: quoteW,
        fontSize: 22,
        fontFamily: ff,
        fill: 'rgba(255,255,255,0.7)',
        name: 'quote-author'
      })
    )
  }
  return objs
}

function renderSummary(s: SlideSchema, theme: RenderTheme): unknown[] {
  const ff = fontFamilyOf(theme.font)
  const objs: unknown[] = [bg(theme)]
  const title = s.title || '总结'
  const titleFS = pickTitleFontSize(title, 'normal')
  const titleTop = 80
  const titleH = estimateTextHeight(title, titleFS, CONTENT_W, 1.2)

  objs.push(
    textbox({
      text: title,
      left: SAFE_LEFT,
      top: titleTop,
      width: CONTENT_W,
      fontSize: titleFS,
      fontWeight: 800,
      fontFamily: ff,
      textAlign: 'center',
      lineHeight: 1.2,
      name: 'title'
    })
  )
  const cols = (s.columns || []).slice(0, 3)
  const n = cols.length || 1
  const gap = 32
  const colW = (CONTENT_W - gap * (n - 1)) / n
  const colTop = titleTop + titleH + 60
  const colAvailH = SLIDE_H - SAFE_BOTTOM - colTop

  cols.forEach((col, ci) => {
    const x = SAFE_LEFT + ci * (colW + gap)
    // 编号
    objs.push(
      textbox({
        text: String(ci + 1).padStart(2, '0'),
        left: x,
        top: colTop,
        width: colW,
        fontSize: 52,
        fontWeight: 800,
        fontFamily: ff,
        fill: theme.accent,
        textAlign: 'left',
        lineHeight: 1.1,
        name: `sum-num-${ci}`
      })
    )
    const headFS = 22
    objs.push(
      textbox({
        text: col.heading,
        left: x,
        top: colTop + 70,
        width: colW,
        fontSize: headFS,
        fontWeight: 700,
        fontFamily: ff,
        lineHeight: 1.3,
        name: `sum-heading-${ci}`
      })
    )
    const headH = estimateTextHeight(col.heading, headFS, colW, 1.3)
    const bullets = (col.bullets || []).slice(0, 3).map((b) => '· ' + b)
    const bAvailH = colAvailH - 70 - headH - 14
    const fit = fitBullets(bullets, colW, bAvailH, { minSize: 13, maxSize: 17 })
    let cursor = colTop + 70 + headH + 14
    fit.truncated.forEach((b, bi) => {
      objs.push(
        textbox({
          text: b,
          left: x,
          top: cursor,
          width: colW,
          fontSize: fit.fontSize,
          fontFamily: ff,
          fill: 'rgba(255,255,255,0.85)',
          lineHeight: 1.4,
          name: `sum-${ci}-bullet-${bi}`
        })
      )
      cursor += estimateTextHeight(b, fit.fontSize, colW, 1.4) + fit.lineGap
    })
  })
  return objs
}

const RENDERERS: Record<SlideLayout, (s: SlideSchema, t: RenderTheme) => unknown[]> = {
  cover: renderCover,
  toc: renderToc,
  content: renderContent,
  'two-col': renderTwoCol,
  quote: renderQuote,
  summary: renderSummary
}

/**
 * 把 SlideSchema 转成 Fabric Canvas JSON（直接可塞入 Slide.fabricJson）
 */
export function renderSchemaToFabricJson(
  schema: SlideSchema,
  theme: RenderTheme
): unknown {
  const render = RENDERERS[schema.layout] ?? RENDERERS.content
  const objects = render(schema, theme)
  return {
    version: '6.0.0',
    background: '#FFFFFF',
    objects
  }
}
