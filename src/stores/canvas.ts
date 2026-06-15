/**
 * Canvas store —— 暴露 Fabric 选中态 / 缩放 / 工具状态
 * 注意：Fabric Canvas 实例本身不放在 store 里（它带循环引用，proxy 化代价大）。
 * 实例由 useFabricCanvas composable 持有，store 只镜像必要的状态。
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type CanvasTool = 'select' | 'text' | 'rect' | 'ellipse' | 'image'

export interface SelectionSnapshot {
  /** 选中对象数量；0=未选中 */
  count: number
  /** 单选时的对象类型 */
  type?: string
  /** 单选时的常用属性镜像（避免组件直接持有 Fabric 对象） */
  fill?: string
  fontSize?: number
  fontFamily?: string
  fontWeight?: string | number
  textAlign?: string
  text?: string
  opacity?: number
  width?: number
  height?: number
  left?: number
  top?: number
  angle?: number
}

export const useCanvasStore = defineStore('canvas', () => {
  const tool = ref<CanvasTool>('select')
  const zoom = ref(1)
  const selection = ref<SelectionSnapshot>({ count: 0 })
  const canUndo = ref(false)
  const canRedo = ref(false)
  const dirty = ref(false)

  const hasSelection = computed(() => selection.value.count > 0)
  const isSingleSelection = computed(() => selection.value.count === 1)

  function setTool(t: CanvasTool) {
    tool.value = t
  }
  function setZoom(z: number) {
    zoom.value = Math.max(0.1, Math.min(4, z))
  }
  function setSelection(s: SelectionSnapshot) {
    selection.value = s
  }
  function setHistoryFlags(u: boolean, r: boolean) {
    canUndo.value = u
    canRedo.value = r
  }
  function markDirty(v = true) {
    dirty.value = v
  }

  return {
    tool,
    zoom,
    selection,
    canUndo,
    canRedo,
    dirty,
    hasSelection,
    isSingleSelection,
    setTool,
    setZoom,
    setSelection,
    setHistoryFlags,
    markDirty
  }
})
