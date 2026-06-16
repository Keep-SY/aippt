<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useResizeObserver } from '@vueuse/core'
import { useDeckStore } from '@/stores/deck'
import { useCanvasStore } from '@/stores/canvas'
import { useFabricCanvas } from '@/composables/useFabricCanvas'
import { useEditorShortcuts } from '@/composables/useEditorShortcuts'
import CanvasToolbar from './CanvasToolbar.vue'
import SelectionFloatingToolbar from './SelectionFloatingToolbar.vue'

const emit = defineEmits<{
  (e: 'ready', api: ReturnType<typeof useFabricCanvas>): void
}>()

const deck = useDeckStore()
const canvasStore = useCanvasStore()

const stageRef = ref<HTMLDivElement | null>(null)
const canvasEl = ref<HTMLCanvasElement | null>(null)
const wrapperEl = ref<HTMLDivElement | null>(null)

const slideSize = computed(() => deck.slideSize)

const api = useFabricCanvas(canvasEl, {
  width: slideSize.value.width,
  height: slideSize.value.height
})
useEditorShortcuts(api)

/** 自适应缩放：保留 64px padding，按宽高较小者计算 fit zoom */
function fitZoom() {
  if (!stageRef.value) return
  const padX = 80
  const padY = 80
  const availW = stageRef.value.clientWidth - padX
  const availH = stageRef.value.clientHeight - padY - 56 /* toolbar */
  const z = Math.min(availW / slideSize.value.width, availH / slideSize.value.height)
  canvasStore.setZoom(Math.max(0.2, Math.min(2, z)))
}

useResizeObserver(stageRef, fitZoom)

onMounted(() => {
  api.init()
  fitZoom()
  emit('ready', api)
})

/** 浮动工具栏定位：bounds 是 canvas 坐标，乘以 zoom 即得到 wrapper 内偏移 */
const toolbarStyle = computed(() => {
  const b = canvasStore.selection.bounds
  if (!b) return { display: 'none' }
  const z = canvasStore.zoom
  const left = (b.left + b.width / 2) * z
  const top = b.top * z - 44
  return {
    left: `${left}px`,
    top: `${Math.max(top, -8)}px`,
    transform: 'translateX(-50%)'
  }
})
</script>

<template>
  <section ref="stageRef" class="relative h-full flex flex-col bg-canvas overflow-hidden">
    <!-- 工具条（浮在画布上方） -->
    <div class="absolute top-4 left-1/2 -translate-x-1/2 z-10">
      <CanvasToolbar />
    </div>

    <!-- 画布舞台 -->
    <div class="flex-1 flex items-center justify-center min-h-0 min-w-0 overflow-auto">
      <div
        ref="wrapperEl"
        class="bg-white rounded-md shadow-lg ring-1 ring-hairline/10 relative"
        :style="{
          width: `${slideSize.width * canvasStore.zoom}px`,
          height: `${slideSize.height * canvasStore.zoom}px`
        }"
      >
        <div
          class="origin-top-left"
          :style="{
            width: `${slideSize.width}px`,
            height: `${slideSize.height}px`,
            transform: `scale(${canvasStore.zoom})`
          }"
        >
          <canvas ref="canvasEl" />
        </div>

        <!-- 文本浮动工具栏 -->
        <div
          v-show="canvasStore.selection.bounds"
          class="absolute z-20 pointer-events-auto"
          :style="toolbarStyle"
        >
          <SelectionFloatingToolbar />
        </div>
      </div>
    </div>

    <!-- 缩放控制（右下） -->
    <div
      class="absolute bottom-4 right-4 flex items-center gap-1 glass rounded-full px-2 h-9 text-sm"
    >
      <button
        class="w-7 h-7 rounded-full hover:bg-ink-900/[0.06] grid place-items-center"
        title="缩小"
        @click="canvasStore.setZoom(canvasStore.zoom - 0.1)"
      >
        −
      </button>
      <span class="w-12 text-center tabular-nums text-ink-700">
        {{ Math.round(canvasStore.zoom * 100) }}%
      </span>
      <button
        class="w-7 h-7 rounded-full hover:bg-ink-900/[0.06] grid place-items-center"
        title="放大"
        @click="canvasStore.setZoom(canvasStore.zoom + 0.1)"
      >
        +
      </button>
      <span class="w-px h-4 bg-hairline/15 mx-1" />
      <button
        class="px-2 h-7 rounded-full hover:bg-ink-900/[0.06] text-xs"
        title="自适应"
        @click="fitZoom"
      >
        适应
      </button>
    </div>
  </section>
</template>
