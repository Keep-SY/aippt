/**
 * useFabricCanvas
 * - 创建 Fabric Canvas 实例（持有在 closure 中，不放进 reactive 防止 proxy 化）
 * - 双向同步：Canvas 变更 → deck.fabricJson；deck 切页 → 反序列化
 * - 镜像选中态到 canvas store，供属性面板消费
 */
import { onBeforeUnmount, watch, type Ref } from 'vue'
import * as fabric from 'fabric'
import { useDeckStore } from '@/stores/deck'
import { useCanvasStore, type SelectionSnapshot } from '@/stores/canvas'
import { useCanvasHistory } from './useCanvasHistory'

interface Options {
  width: number
  height: number
}

export function useFabricCanvas(elRef: Ref<HTMLCanvasElement | null>, opts: Options) {
  const deck = useDeckStore()
  const canvasStore = useCanvasStore()

  let fc: fabric.Canvas | null = null
  let suppressSync = false
  const history = useCanvasHistory()

  function snapshotSelection(): SelectionSnapshot {
    if (!fc) return { count: 0 }
    const active = fc.getActiveObjects()
    if (active.length === 0) return { count: 0 }
    if (active.length > 1) return { count: active.length }
    const o = active[0] as fabric.Object & {
      fontSize?: number
      fontFamily?: string
      fontWeight?: string | number
      fontStyle?: string
      underline?: boolean
      textAlign?: string
      text?: string
    }
    const r = o.getBoundingRect()
    return {
      count: 1,
      type: o.type,
      fill: o.fill as string | undefined,
      fontSize: o.fontSize,
      fontFamily: o.fontFamily,
      fontWeight: o.fontWeight,
      fontStyle: o.fontStyle,
      underline: o.underline,
      textAlign: o.textAlign,
      text: o.text,
      opacity: o.opacity,
      width: o.width,
      height: o.height,
      left: o.left,
      top: o.top,
      angle: o.angle,
      bounds: { left: r.left, top: r.top, width: r.width, height: r.height }
    }
  }

  function persist() {
    if (!fc || suppressSync) return
    const json = fc.toJSON(['name', 'aiTag'])
    deck.patchCurrentSlide(json)
    history.push(json)
    canvasStore.setHistoryFlags(history.canUndo(), history.canRedo())
    canvasStore.markDirty(true)
  }

  function bindEvents() {
    if (!fc) return
    fc.on('selection:created', () => canvasStore.setSelection(snapshotSelection()))
    fc.on('selection:updated', () => canvasStore.setSelection(snapshotSelection()))
    fc.on('selection:cleared', () => canvasStore.setSelection({ count: 0 }))
    fc.on('object:modified', persist)
    fc.on('object:added', persist)
    fc.on('object:removed', persist)
    fc.on('object:moving', () => canvasStore.setSelection(snapshotSelection()))
    fc.on('object:scaling', () => canvasStore.setSelection(snapshotSelection()))
    fc.on('object:rotating', () => canvasStore.setSelection(snapshotSelection()))
    fc.on('text:changed', () => canvasStore.setSelection(snapshotSelection()))
  }

  async function loadCurrent() {
    if (!fc) return
    const slide = deck.currentSlide
    suppressSync = true
    try {
      if (slide?.fabricJson) {
        await fc.loadFromJSON(slide.fabricJson)
      } else {
        fc.clear()
        fc.backgroundColor = '#FFFFFF'
      }
      fc.renderAll()
      history.reset(fc.toJSON(['name', 'aiTag']))
      canvasStore.setHistoryFlags(false, false)
      canvasStore.setSelection({ count: 0 })
    } finally {
      suppressSync = false
    }
  }

  function init() {
    if (!elRef.value) return
    fc = new fabric.Canvas(elRef.value, {
      width: opts.width,
      height: opts.height,
      backgroundColor: '#FFFFFF',
      preserveObjectStacking: true,
      selection: true
    })
    bindEvents()
    loadCurrent()
  }

  function dispose() {
    if (!fc) return
    fc.dispose()
    fc = null
  }

  watch(
    () => deck.currentIndex,
    () => loadCurrent()
  )

  onBeforeUnmount(dispose)

  function getCanvas() {
    return fc
  }

  function addText(text = '点击编辑文字', x = 100, y = 100) {
    if (!fc) return
    const t = new fabric.Textbox(text, {
      left: x,
      top: y,
      width: 360,
      fontSize: 32,
      fontFamily: 'Inter, PingFang SC, sans-serif',
      fill: '#0F1226'
    })
    fc.add(t)
    fc.setActiveObject(t)
    fc.requestRenderAll()
  }

  function addRect() {
    if (!fc) return
    const r = new fabric.Rect({
      left: 200,
      top: 200,
      width: 240,
      height: 140,
      rx: 12,
      ry: 12,
      fill: 'rgba(124,92,255,0.12)',
      stroke: '#7C5CFF',
      strokeWidth: 2
    })
    fc.add(r)
    fc.setActiveObject(r)
    fc.requestRenderAll()
  }

  function addEllipse() {
    if (!fc) return
    const e = new fabric.Ellipse({
      left: 220,
      top: 220,
      rx: 90,
      ry: 90,
      fill: 'rgba(79,168,255,0.18)',
      stroke: '#4FA8FF',
      strokeWidth: 2
    })
    fc.add(e)
    fc.setActiveObject(e)
    fc.requestRenderAll()
  }

  function addImage(url: string) {
    if (!fc) return
    fabric.FabricImage.fromURL(url, { crossOrigin: 'anonymous' }).then((img) => {
      img.set({ left: 100, top: 100 })
      img.scaleToWidth(420)
      fc!.add(img)
      fc!.setActiveObject(img)
      fc!.requestRenderAll()
    })
  }

  function removeSelected() {
    if (!fc) return
    fc.getActiveObjects().forEach((o) => fc!.remove(o))
    fc.discardActiveObject()
    fc.requestRenderAll()
  }

  function updateSelectedProp(props: Record<string, unknown>) {
    if (!fc) return
    const objs = fc.getActiveObjects()
    objs.forEach((o) => o.set(props))
    fc.requestRenderAll()
    persist()
    canvasStore.setSelection(snapshotSelection())
  }

  function bringForward() {
    if (!fc) return
    fc.getActiveObjects().forEach((o) => fc!.bringObjectForward(o))
    fc.requestRenderAll()
    persist()
  }
  function sendBackward() {
    if (!fc) return
    fc.getActiveObjects().forEach((o) => fc!.sendObjectBackwards(o))
    fc.requestRenderAll()
    persist()
  }

  function undo() {
    if (!fc) return
    const json = history.undo()
    if (!json) return
    suppressSync = true
    fc.loadFromJSON(json).then(() => {
      fc!.renderAll()
      suppressSync = false
      canvasStore.setHistoryFlags(history.canUndo(), history.canRedo())
    })
  }
  function redo() {
    if (!fc) return
    const json = history.redo()
    if (!json) return
    suppressSync = true
    fc.loadFromJSON(json).then(() => {
      fc!.renderAll()
      suppressSync = false
      canvasStore.setHistoryFlags(history.canUndo(), history.canRedo())
    })
  }

  return {
    init,
    dispose,
    getCanvas,
    addText,
    addRect,
    addEllipse,
    addImage,
    removeSelected,
    updateSelectedProp,
    bringForward,
    sendBackward,
    undo,
    redo
  }
}

export type FabricApi = ReturnType<typeof useFabricCanvas>
