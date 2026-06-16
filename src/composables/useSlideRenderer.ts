/**
 * useSlideRenderer
 * - 把 SlideSchema 渲染成 Fabric Canvas JSON（与 Slide.fabricJson 同结构）
 * - 6 种 layout 各自有一个纯函数，输出 objects[]
 * - 不依赖 fabric runtime（仅生成 JSON），可在 store 中安全使用
 */
import type { SlideSchema, SlideLayout } from '@/services/slideSchema'

export interface RenderTheme {
  bg: string
  accent: string
  font: 'sans' | 'serif' | 'mono'
}

export const SLIDE_W = 1280
export const SLIDE_H = 720

const fontFamilyOf = (f: RenderTheme['font']) =>
  f === 'serif'
    ? 'Georgia, serif'
    : f === 'mono'
      ? 'JetBrains Mono, monospace'
      : 'Inter, PingFang SC, sans-serif'

/**
 * 解析 CSS gradient → Fabric Gradient 配置
 * 不识别时返回纯色
 */
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

function accentBar(theme: RenderTheme, x = 96, y = SLIDE_H - 80, w = 60) {
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
    name: opts.name
  }
}

// =============== 6 种 layout ===============

function renderCover(s: SlideSchema, theme: RenderTheme): unknown[] {
  const ff = fontFamilyOf(theme.font)
  const objs: unknown[] = [bg(theme)]
  objs.push(
    textbox({
      text: s.title,
      left: 96,
      top: 260,
      width: SLIDE_W - 192,
      fontSize: 80,
      fontWeight: 800,
      fontFamily: ff,
      textAlign: 'left',
      name: 'title'
    })
  )
  if (s.subtitle) {
    objs.push(
      textbox({
        text: s.subtitle,
        left: 96,
        top: 400,
        width: SLIDE_W - 192,
        fontSize: 28,
        fontWeight: 400,
        fontFamily: ff,
        fill: 'rgba(255,255,255,0.85)',
        textAlign: 'left',
        name: 'subtitle'
      })
    )
  }
  objs.push(accentBar(theme, 96, 520, 80))
  return objs
}

function renderToc(s: SlideSchema, theme: RenderTheme): unknown[] {
  const ff = fontFamilyOf(theme.font)
  const objs: unknown[] = [bg(theme)]
  objs.push(
    textbox({
      text: s.title || '目录',
      left: 96,
      top: 120,
      width: 380,
      fontSize: 56,
      fontWeight: 800,
      fontFamily: ff,
      name: 'title'
    })
  )
  objs.push(accentBar(theme, 96, 220, 60))

  const items = s.tocItems || []
  const startTop = 120
  const rowH = 64
  items.slice(0, 8).forEach((item, i) => {
    objs.push(
      textbox({
        text: String(i + 1).padStart(2, '0'),
        left: 540,
        top: startTop + i * rowH,
        width: 80,
        fontSize: 28,
        fontWeight: 700,
        fontFamily: ff,
        fill: theme.accent,
        name: `toc-num-${i}`
      })
    )
    objs.push(
      textbox({
        text: item,
        left: 640,
        top: startTop + i * rowH,
        width: SLIDE_W - 640 - 96,
        fontSize: 24,
        fontFamily: ff,
        fill: 'rgba(255,255,255,0.9)',
        name: `toc-${i}`
      })
    )
  })
  return objs
}

function renderContent(s: SlideSchema, theme: RenderTheme): unknown[] {
  const ff = fontFamilyOf(theme.font)
  const objs: unknown[] = [bg(theme)]
  objs.push(
    textbox({
      text: s.title,
      left: 96,
      top: 120,
      width: SLIDE_W - 192,
      fontSize: 48,
      fontWeight: 700,
      fontFamily: ff,
      name: 'title'
    })
  )
  objs.push(accentBar(theme, 96, 200, 48))
  ;(s.bullets || []).slice(0, 5).forEach((b, i) => {
    objs.push(
      textbox({
        text: '· ' + b,
        left: 96,
        top: 260 + i * 56,
        width: SLIDE_W - 192,
        fontSize: 24,
        fontFamily: ff,
        fill: 'rgba(255,255,255,0.88)',
        name: `bullet-${i}`
      })
    )
  })
  return objs
}

function renderTwoCol(s: SlideSchema, theme: RenderTheme): unknown[] {
  const ff = fontFamilyOf(theme.font)
  const objs: unknown[] = [bg(theme)]
  objs.push(
    textbox({
      text: s.title,
      left: 96,
      top: 96,
      width: SLIDE_W - 192,
      fontSize: 44,
      fontWeight: 700,
      fontFamily: ff,
      name: 'title'
    })
  )
  objs.push(accentBar(theme, 96, 170, 48))

  const cols = (s.columns || []).slice(0, 2)
  const colW = (SLIDE_W - 96 * 2 - 48) / 2
  cols.forEach((col, ci) => {
    const x = 96 + ci * (colW + 48)
    objs.push(
      textbox({
        text: col.heading,
        left: x,
        top: 240,
        width: colW,
        fontSize: 28,
        fontWeight: 700,
        fontFamily: ff,
        fill: theme.accent,
        name: `col-${ci}-heading`
      })
    )
    ;(col.bullets || []).slice(0, 4).forEach((b, bi) => {
      objs.push(
        textbox({
          text: '· ' + b,
          left: x,
          top: 300 + bi * 50,
          width: colW,
          fontSize: 20,
          fontFamily: ff,
          fill: 'rgba(255,255,255,0.86)',
          name: `col-${ci}-bullet-${bi}`
        })
      )
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
      left: 96,
      top: 80,
      width: 200,
      fontSize: 220,
      fontWeight: 800,
      fontFamily: ff,
      fill: theme.accent,
      opacity: 0.6,
      name: 'open-quote'
    })
  )
  objs.push(
    textbox({
      text: s.quote?.text || s.title,
      left: 200,
      top: 240,
      width: SLIDE_W - 200 - 96,
      fontSize: 38,
      fontWeight: 600,
      fontFamily: ff,
      fontStyle: 'italic',
      textAlign: 'left',
      name: 'quote-text'
    })
  )
  if (s.quote?.author) {
    objs.push(
      textbox({
        text: '— ' + s.quote.author,
        left: 200,
        top: SLIDE_H - 140,
        width: SLIDE_W - 200 - 96,
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
  objs.push(
    textbox({
      text: s.title || '总结',
      left: 96,
      top: 96,
      width: SLIDE_W - 192,
      fontSize: 48,
      fontWeight: 800,
      fontFamily: ff,
      textAlign: 'center',
      name: 'title'
    })
  )
  const cols = (s.columns || []).slice(0, 3)
  const n = cols.length || 1
  const totalW = SLIDE_W - 96 * 2
  const gap = 32
  const colW = (totalW - gap * (n - 1)) / n
  cols.forEach((col, ci) => {
    const x = 96 + ci * (colW + gap)
    // 编号
    objs.push(
      textbox({
        text: String(ci + 1).padStart(2, '0'),
        left: x,
        top: 240,
        width: colW,
        fontSize: 56,
        fontWeight: 800,
        fontFamily: ff,
        fill: theme.accent,
        textAlign: 'left',
        name: `sum-num-${ci}`
      })
    )
    objs.push(
      textbox({
        text: col.heading,
        left: x,
        top: 320,
        width: colW,
        fontSize: 24,
        fontWeight: 700,
        fontFamily: ff,
        name: `sum-heading-${ci}`
      })
    )
    ;(col.bullets || []).slice(0, 3).forEach((b, bi) => {
      objs.push(
        textbox({
          text: '· ' + b,
          left: x,
          top: 380 + bi * 44,
          width: colW,
          fontSize: 18,
          fontFamily: ff,
          fill: 'rgba(255,255,255,0.82)',
          name: `sum-${ci}-bullet-${bi}`
        })
      )
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
