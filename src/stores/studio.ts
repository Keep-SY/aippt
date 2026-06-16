/**
 * Outline / Template / Decks 共享数据
 * - 全部使用 mock，等接入后端再替换
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface OutlineBullet {
  id: string
  text: string
}
export interface OutlineSection {
  id: string
  title: string
  bullets: OutlineBullet[]
}
export interface Outline {
  topic: string
  pages: number
  sections: OutlineSection[]
}

export interface Template {
  id: string
  name: string
  category: '商务' | '科技' | '极简' | '教育' | '创意'
  /** 简单的渐变描述，用 CSS gradient 渲染 */
  bg: string
  accent: string
  font: 'sans' | 'serif' | 'mono'
}

export interface DeckSummary {
  id: string
  title: string
  pages: number
  template: string
  updatedAt: number
  /** 卡片预览渐变（演示用） */
  cover: string
  shared?: boolean
}

export type AttachmentKind = 'file' | 'url' | 'text'
export interface Attachment {
  id: string
  /** 显示名：文件名 / URL / "粘贴文本 #N" */
  name: string
  kind: AttachmentKind
  /** 提取后的纯文本（已截断） */
  text: string
  /** 原始字节数（仅 file 有意义） */
  bytes?: number
}

/** 单条附件最多保留多少字符（防止 prompt 爆炸） */
export const ATTACHMENT_MAX_CHARS = 8000
/** 所有附件合计最多多少字符 */
export const ATTACHMENT_TOTAL_MAX_CHARS = 24000

const uid = () => Math.random().toString(36).slice(2, 10)

function buildEmptyOutline(): Outline {
  return {
    topic: '',
    pages: 12,
    sections: []
  }
}

const TEMPLATES: Template[] = [
  { id: 'biz-purple', name: '商务紫', category: '商务', bg: 'linear-gradient(135deg,#7C5CFF,#4FA8FF)', accent: '#7C5CFF', font: 'sans' },
  { id: 'biz-deep', name: '商务深色', category: '商务', bg: 'linear-gradient(135deg,#0F1226,#2A2F4A)', accent: '#4FA8FF', font: 'sans' },
  { id: 'tech-cyan', name: '科技青', category: '科技', bg: 'linear-gradient(135deg,#00C2FF,#7C5CFF)', accent: '#00C2FF', font: 'sans' },
  { id: 'tech-grid', name: '科技网格', category: '科技', bg: 'linear-gradient(135deg,#1F2540,#3B82F6)', accent: '#3B82F6', font: 'mono' },
  { id: 'mini-light', name: '极简浅', category: '极简', bg: 'linear-gradient(135deg,#FFFFFF,#F0F2F8)', accent: '#0F1226', font: 'serif' },
  { id: 'mini-paper', name: '极简纸', category: '极简', bg: 'linear-gradient(135deg,#FAF7F2,#E8E2D6)', accent: '#0F1226', font: 'serif' },
  { id: 'edu-warm', name: '教育温暖', category: '教育', bg: 'linear-gradient(135deg,#FFD86B,#FF8E53)', accent: '#FF6B35', font: 'sans' },
  { id: 'edu-blue', name: '教育蓝', category: '教育', bg: 'linear-gradient(135deg,#A5D8FF,#4263EB)', accent: '#4263EB', font: 'sans' },
  { id: 'creative-glow', name: '创意荧光', category: '创意', bg: 'linear-gradient(135deg,#F472B6,#A78BFA)', accent: '#EC4899', font: 'sans' },
  { id: 'creative-aurora', name: '创意极光', category: '创意', bg: 'linear-gradient(135deg,#34D399,#3B82F6,#A78BFA)', accent: '#10B981', font: 'sans' },
  { id: 'biz-mono', name: '商务单色', category: '商务', bg: 'linear-gradient(135deg,#F7F8FC,#D4D7E5)', accent: '#0F1226', font: 'sans' },
  { id: 'tech-aurora', name: '科技极光', category: '科技', bg: 'linear-gradient(135deg,#7C5CFF,#00C2FF,#10B981)', accent: '#7C5CFF', font: 'sans' }
]

function buildDemoDecks(): DeckSummary[] {
  const now = Date.now()
  const day = 86400000
  return [
    { id: 'd1', title: 'AI Agent 现状、技术栈与未来趋势', pages: 12, template: 'biz-purple', updatedAt: now - day * 0.2, cover: 'linear-gradient(135deg,#7C5CFF,#4FA8FF)' },
    { id: 'd2', title: 'Q2 季度复盘 · 增长引擎', pages: 18, template: 'biz-deep', updatedAt: now - day * 1.5, cover: 'linear-gradient(135deg,#0F1226,#2A2F4A)', shared: true },
    { id: 'd3', title: '产品发布 · v2.0 Aurora', pages: 9, template: 'creative-aurora', updatedAt: now - day * 3, cover: 'linear-gradient(135deg,#34D399,#3B82F6,#A78BFA)' },
    { id: 'd4', title: '硕士开题答辩稿', pages: 22, template: 'edu-blue', updatedAt: now - day * 6, cover: 'linear-gradient(135deg,#A5D8FF,#4263EB)' },
    { id: 'd5', title: '路演 BP · 种子轮', pages: 14, template: 'tech-cyan', updatedAt: now - day * 12, cover: 'linear-gradient(135deg,#00C2FF,#7C5CFF)' },
    { id: 'd6', title: '团队 OKR 同步会', pages: 8, template: 'mini-paper', updatedAt: now - day * 30, cover: 'linear-gradient(135deg,#FAF7F2,#E8E2D6)' }
  ]
}

export const useStudioStore = defineStore('studio', () => {
  // —— Outline —— //
  const outline = ref<Outline>(buildEmptyOutline())

  function setTopic(t: string) {
    outline.value.topic = t
  }
  function setPages(n: number) {
    outline.value.pages = Math.max(3, Math.min(40, n))
  }
  function addSection() {
    outline.value.sections.push({ id: uid(), title: '新章节', bullets: [] })
  }
  function removeSection(id: string) {
    outline.value.sections = outline.value.sections.filter((s) => s.id !== id)
  }
  function moveSection(from: number, to: number) {
    const arr = outline.value.sections
    if (from === to || from < 0 || to < 0 || from >= arr.length || to >= arr.length) return
    const [m] = arr.splice(from, 1)
    arr.splice(to, 0, m)
  }
  function updateSectionTitle(id: string, title: string) {
    const s = outline.value.sections.find((x) => x.id === id)
    if (s) s.title = title
  }
  function addBullet(sectionId: string) {
    const s = outline.value.sections.find((x) => x.id === sectionId)
    if (s) s.bullets.push({ id: uid(), text: '新的要点' })
  }
  function updateBullet(sectionId: string, bulletId: string, text: string) {
    const b = outline.value.sections.find((x) => x.id === sectionId)?.bullets.find((y) => y.id === bulletId)
    if (b) b.text = text
  }
  function removeBullet(sectionId: string, bulletId: string) {
    const s = outline.value.sections.find((x) => x.id === sectionId)
    if (s) s.bullets = s.bullets.filter((b) => b.id !== bulletId)
  }
  function replaceSections(sections: OutlineSection[]) {
    outline.value.sections = sections
  }

  // —— Templates —— //
  const templates = ref<Template[]>(TEMPLATES)
  const selectedTemplateId = ref<string>('biz-purple')
  const selectedTemplate = computed(() =>
    templates.value.find((t) => t.id === selectedTemplateId.value) ?? templates.value[0]
  )
  function selectTemplate(id: string) {
    selectedTemplateId.value = id
  }

  // —— Decks —— //
  const decks = ref<DeckSummary[]>(buildDemoDecks())
  function removeDeck(id: string) {
    decks.value = decks.value.filter((d) => d.id !== id)
  }
  function duplicateDeck(id: string) {
    const src = decks.value.find((d) => d.id === id)
    if (!src) return
    decks.value.unshift({ ...src, id: uid(), title: src.title + ' 副本', updatedAt: Date.now() })
  }

  // —— Attachments（Landing 页"文档"按钮的产物，作为大纲生成的参考资料） —— //
  const attachments = ref<Attachment[]>([])
  function addAttachment(a: Omit<Attachment, 'id'>): Attachment {
    const item: Attachment = { id: uid(), ...a }
    // 单条截断
    if (item.text.length > ATTACHMENT_MAX_CHARS) {
      item.text = item.text.slice(0, ATTACHMENT_MAX_CHARS)
    }
    attachments.value.push(item)
    return item
  }
  function removeAttachment(id: string) {
    attachments.value = attachments.value.filter((a) => a.id !== id)
  }
  function clearAttachments() {
    attachments.value = []
  }
  /** 合计字符数（用于 UI 提示与上限保护） */
  const attachmentTotalChars = computed(() =>
    attachments.value.reduce((sum, a) => sum + a.text.length, 0)
  )

  return {
    outline,
    setTopic,
    setPages,
    addSection,
    removeSection,
    moveSection,
    updateSectionTitle,
    addBullet,
    updateBullet,
    removeBullet,
    replaceSections,
    templates,
    selectedTemplateId,
    selectedTemplate,
    selectTemplate,
    decks,
    removeDeck,
    duplicateDeck,
    attachments,
    attachmentTotalChars,
    addAttachment,
    removeAttachment,
    clearAttachments
  }
})
