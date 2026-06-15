/**
 * 导出工具：PNG（单页）/ PDF / PPTX
 *
 * 实现思路：
 * - 当前可见 Fabric Canvas 只持有 currentSlide 的对象
 * - 所有页的源数据存在 deck.slides[i].fabricJson
 * - 对每页临时创建一个 StaticCanvas，loadFromJSON 后 toDataURL，最后 dispose
 * - 这样不会改动用户当前在编辑的 canvas
 */
import * as fabric from 'fabric'
import jsPDF from 'jspdf'
import PptxGenJS from 'pptxgenjs'
import type { Deck, Slide } from '@/stores/deck'

const SLIDE_W = 1280
const SLIDE_H = 720

/** 把单页 JSON 渲染为 PNG dataURL（多倍率以提升清晰度） */
async function renderSlideToDataURL(slide: Slide, scale = 2): Promise<string> {
  // 离屏 canvas
  const tmp = new fabric.StaticCanvas(undefined, {
    width: SLIDE_W,
    height: SLIDE_H,
    backgroundColor: '#FFFFFF'
  })
  try {
    if (slide.fabricJson) {
      await tmp.loadFromJSON(slide.fabricJson)
    }
    tmp.renderAll()
    return tmp.toDataURL({ format: 'png', multiplier: scale })
  } finally {
    tmp.dispose()
  }
}

function downloadDataURL(dataUrl: string, filename: string) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

function safeFilename(s: string) {
  return s.replace(/[\\/:*?"<>|]+/g, '_').slice(0, 80) || 'slide'
}

/** 导出单页为 PNG */
export async function exportSlideAsPNG(slide: Slide, filename?: string) {
  const url = await renderSlideToDataURL(slide, 2)
  downloadDataURL(url, (filename ?? safeFilename(slide.title || 'slide')) + '.png')
}

/** 整本导出为 PDF（每页一张图） */
export async function exportDeckAsPDF(deck: Deck) {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [SLIDE_W, SLIDE_H],
    hotfixes: ['px_scaling']
  })
  for (let i = 0; i < deck.slides.length; i++) {
    const url = await renderSlideToDataURL(deck.slides[i], 2)
    if (i > 0) pdf.addPage([SLIDE_W, SLIDE_H], 'landscape')
    pdf.addImage(url, 'PNG', 0, 0, SLIDE_W, SLIDE_H)
  }
  pdf.save(safeFilename(deck.title) + '.pdf')
}

/** 整本导出为 PPTX（每页作为图片填满整页） */
export async function exportDeckAsPPTX(deck: Deck) {
  const pptx = new PptxGenJS()
  pptx.layout = 'LAYOUT_WIDE' // 13.33 x 7.5 inch == 16:9
  pptx.title = deck.title

  for (const s of deck.slides) {
    const url = await renderSlideToDataURL(s, 2)
    const slide = pptx.addSlide()
    slide.background = { color: 'FFFFFF' }
    slide.addImage({ data: url, x: 0, y: 0, w: 13.33, h: 7.5 })
  }
  await pptx.writeFile({ fileName: safeFilename(deck.title) + '.pptx' })
}

export type ExportFormat = 'png-current' | 'pdf' | 'pptx'
