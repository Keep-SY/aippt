/**
 * 全局键盘快捷键（编辑器范围内）
 * - ⌘/Ctrl + Z / Shift+Z      撤销 / 重做
 * - Delete / Backspace         删除选中
 * - 方向键                     微调位置 1px（Shift +10px）
 * - ⌘/Ctrl + D                复制选中
 * - Esc                       取消选中
 */
import { onMounted, onBeforeUnmount } from 'vue'
import type { FabricApi } from './useFabricCanvas'

export function useEditorShortcuts(api: FabricApi) {
  function isTypingTarget(t: EventTarget | null): boolean {
    if (!(t instanceof HTMLElement)) return false
    const tag = t.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA') return true
    if (t.isContentEditable) return true
    return false
  }

  function handler(e: KeyboardEvent) {
    if (isTypingTarget(e.target)) return

    const fc = api.getCanvas()
    if (!fc) return

    // 编辑文本框时不拦截
    const editing = fc.getActiveObject() as { isEditing?: boolean } | null
    if (editing?.isEditing) return

    const meta = e.metaKey || e.ctrlKey

    if (meta && e.key.toLowerCase() === 'z') {
      e.preventDefault()
      if (e.shiftKey) api.redo()
      else api.undo()
      return
    }
    if (meta && e.key.toLowerCase() === 'y') {
      e.preventDefault()
      api.redo()
      return
    }
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault()
      api.removeSelected()
      return
    }
    if (e.key === 'Escape') {
      fc.discardActiveObject()
      fc.requestRenderAll()
      return
    }
    if (meta && e.key.toLowerCase() === 'd') {
      e.preventDefault()
      const objs = fc.getActiveObjects()
      Promise.all(objs.map((o) => o.clone())).then((clones) => {
        clones.forEach((c) => {
          c.set({ left: (c.left ?? 0) + 16, top: (c.top ?? 0) + 16 })
          fc.add(c)
        })
        fc.requestRenderAll()
      })
      return
    }

    const arrow: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1]
    }
    if (arrow[e.key]) {
      e.preventDefault()
      const [dx, dy] = arrow[e.key]
      const step = e.shiftKey ? 10 : 1
      fc.getActiveObjects().forEach((o) => {
        o.set({ left: (o.left ?? 0) + dx * step, top: (o.top ?? 0) + dy * step })
        o.setCoords()
      })
      fc.requestRenderAll()
    }
  }

  onMounted(() => window.addEventListener('keydown', handler))
  onBeforeUnmount(() => window.removeEventListener('keydown', handler))
}
