import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * Slide / Deck 数据模型
 * - 真正的视觉数据存于 fabricJson（整页 Fabric Canvas 的 toJSON 序列化）
 * - elements 字段保留，未来拆分语义化对象（标题/正文/图）便于 AI 改写时定位
 */
export interface SlideElement {
  id: string
  type: 'text' | 'image' | 'shape' | 'chart' | 'icon'
  meta?: { editable?: boolean; aiTag?: string }
}

export interface Slide {
  id: string
  title: string
  /** Fabric Canvas 整页序列化 */
  fabricJson?: unknown
  elements: SlideElement[]
  background?: string
}

export interface Deck {
  id: string
  title: string
  slides: Slide[]
  template?: string
  updatedAt: number
}

const SLIDE_W = 1280
const SLIDE_H = 720

/** 临时 ID 生成（生产应用 nanoid/uuid） */
const uid = () => Math.random().toString(36).slice(2, 10)

function buildDemoDeck(): Deck {
  const mkSlide = (title: string, subtitle?: string): Slide => ({
    id: uid(),
    title,
    elements: [],
    fabricJson: {
      version: '6.0.0',
      objects: [
        {
          type: 'Textbox',
          left: 96,
          top: 220,
          width: SLIDE_W - 192,
          fontSize: 64,
          fontWeight: 700,
          fontFamily: 'Inter, PingFang SC, sans-serif',
          fill: '#0F1226',
          text: title,
          textAlign: 'left'
        },
        ...(subtitle
          ? [
              {
                type: 'Textbox',
                left: 96,
                top: 320,
                width: SLIDE_W - 192,
                fontSize: 24,
                fontFamily: 'Inter, PingFang SC, sans-serif',
                fill: '#6B7088',
                text: subtitle,
                textAlign: 'left'
              }
            ]
          : []),
        {
          type: 'Rect',
          left: 96,
          top: 560,
          width: 80,
          height: 6,
          rx: 3,
          ry: 3,
          fill: '#7C5CFF'
        }
      ],
      background: '#FFFFFF'
    }
  })

  return {
    id: uid(),
    title: 'AI Agent 现状、技术栈与未来趋势',
    template: 'business-purple',
    updatedAt: Date.now(),
    slides: [
      mkSlide('AI Agent 全景', '从 LLM 到自治系统'),
      mkSlide('什么是 Agent？', '定义、边界、与 Chatbot 的区别'),
      mkSlide('技术栈拆解', 'Memory · Planning · Tool Use · Reflection'),
      mkSlide('真实落地案例', '客服 / 编码 / 研究 / 自动化'),
      mkSlide('未来趋势 & Q&A', '感谢聆听')
    ]
  }
}

export const useDeckStore = defineStore('deck', () => {
  const current = ref<Deck>(buildDemoDeck())
  const currentIndex = ref(0)

  const currentSlide = computed(() => current.value.slides[currentIndex.value])
  const slideSize = computed(() => ({ width: SLIDE_W, height: SLIDE_H }))

  function selectSlide(index: number) {
    if (index < 0 || index >= current.value.slides.length) return
    currentIndex.value = index
  }

  function addSlide() {
    const slide: Slide = {
      id: uid(),
      title: '新页面',
      elements: [],
      fabricJson: { version: '6.0.0', objects: [], background: '#FFFFFF' }
    }
    current.value.slides.push(slide)
    currentIndex.value = current.value.slides.length - 1
    current.value.updatedAt = Date.now()
  }

  function duplicateSlide(index: number) {
    const src = current.value.slides[index]
    if (!src) return
    const clone: Slide = JSON.parse(JSON.stringify(src))
    clone.id = uid()
    clone.title = src.title + ' 副本'
    current.value.slides.splice(index + 1, 0, clone)
    currentIndex.value = index + 1
    current.value.updatedAt = Date.now()
  }

  function removeSlide(index: number) {
    if (current.value.slides.length <= 1) return
    current.value.slides.splice(index, 1)
    if (currentIndex.value >= current.value.slides.length) {
      currentIndex.value = current.value.slides.length - 1
    }
    current.value.updatedAt = Date.now()
  }

  function moveSlide(from: number, to: number) {
    const slides = current.value.slides
    if (from === to || from < 0 || to < 0 || from >= slides.length || to >= slides.length) return
    const [moved] = slides.splice(from, 1)
    slides.splice(to, 0, moved)
    currentIndex.value = to
    current.value.updatedAt = Date.now()
  }

  /** 由 Editor 在 Fabric 修改后调用，把当前页 Canvas 的 JSON 写回 */
  function patchCurrentSlide(json: unknown) {
    const s = currentSlide.value
    if (!s) return
    s.fabricJson = json
    current.value.updatedAt = Date.now()
  }

  function setTitle(title: string) {
    current.value.title = title
    current.value.updatedAt = Date.now()
  }

  /**
   * 用 outline + template 配色构建整本 deck
   * - outline: { topic, sections: [{ title, bullets }] }
   * - templateBg: CSS gradient 字符串（用作每页背景）
   * - accent: 强调色（hex），用于装饰条
   */
  function buildFromOutline(
    outline: { topic: string; sections: { title: string; bullets: { text: string }[] }[] },
    template: { bg: string; accent: string; font: 'sans' | 'serif' | 'mono' }
  ) {
    const fontFamily =
      template.font === 'serif'
        ? 'Georgia, serif'
        : template.font === 'mono'
          ? 'JetBrains Mono, monospace'
          : 'Inter, PingFang SC, sans-serif'

    const slides: Slide[] = outline.sections.map((s, idx) => ({
      id: uid(),
      title: s.title,
      elements: [],
      fabricJson: {
        version: '6.0.0',
        // background 通过 backgroundImage 注入更靠谱，但 Fabric loadFromJSON 不支持 CSS gradient。
        // 这里 fallback 用浅色背景 + 一个全屏渐变矩形铺底
        background: '#FFFFFF',
        objects: [
          // 底色矩形（模拟模板背景）
          {
            type: 'Rect',
            left: 0,
            top: 0,
            width: SLIDE_W,
            height: SLIDE_H,
            // Fabric 6 支持 fill 为 gradient 对象
            fill: parseGradient(template.bg),
            selectable: false,
            evented: false,
            name: 'bg'
          },
          {
            type: 'Textbox',
            left: 96,
            top: idx === 0 ? 280 : 120,
            width: SLIDE_W - 192,
            fontSize: idx === 0 ? 72 : 48,
            fontWeight: 700,
            fontFamily,
            fill: '#FFFFFF',
            text: s.title,
            textAlign: 'left',
            name: 'title'
          },
          ...(s.bullets || []).slice(0, 5).map((b, bi) => ({
            type: 'Textbox' as const,
            left: 96,
            top: (idx === 0 ? 380 : 220) + bi * 56,
            width: SLIDE_W - 192,
            fontSize: idx === 0 ? 28 : 24,
            fontFamily,
            fill: 'rgba(255,255,255,0.88)',
            text: idx === 0 ? b.text : '· ' + b.text,
            textAlign: 'left',
            name: `bullet-${bi}`
          })),
          // 装饰条
          {
            type: 'Rect',
            left: 96,
            top: SLIDE_H - 100,
            width: 60,
            height: 4,
            rx: 2,
            ry: 2,
            fill: template.accent,
            name: 'accent-bar'
          }
        ]
      }
    }))

    current.value = {
      id: uid(),
      title: outline.topic,
      slides,
      updatedAt: Date.now()
    }
    currentIndex.value = 0
  }

  return {
    current,
    currentIndex,
    currentSlide,
    slideSize,
    selectSlide,
    addSlide,
    duplicateSlide,
    removeSlide,
    moveSlide,
    patchCurrentSlide,
    setTitle,
    buildFromOutline
  }
})

/**
 * 解析 CSS gradient 字符串为 Fabric Gradient 配置
 * 仅支持 linear-gradient(angle, color1, color2, ...) 这种最常见形式
 * 不识别时返回纯色（第一个 color 或灰色）
 */
function parseGradient(css: string): unknown {
  const m = css.match(/linear-gradient\(([^,]+),(.+)\)/)
  if (!m) return '#7C5CFF'
  const stops = m[2]
    .split(/,(?![^()]*\))/)
    .map((s) => s.trim())
    .filter(Boolean)
  if (stops.length < 2) return stops[0] || '#7C5CFF'
  // Fabric Gradient（type linear，左上到右下作为简化）
  return {
    type: 'linear',
    coords: { x1: 0, y1: 0, x2: 1280, y2: 720 },
    colorStops: stops.map((c, i) => ({ offset: i / (stops.length - 1), color: c }))
  }
}
