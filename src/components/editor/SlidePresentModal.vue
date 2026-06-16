<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as fabric from 'fabric'
import { useDeckStore } from '@/stores/deck'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ (e: 'update:open', v: boolean): void }>()

const deck = useDeckStore()
const slides = computed(() => deck.current.slides)
const idx = ref(0)
const canvasEl = ref<HTMLCanvasElement | null>(null)
let staticCanvas: fabric.StaticCanvas | null = null

const SLIDE_W = 1280
const SLIDE_H = 720

const stageStyle = ref<Record<string, string>>({})

function recalcStage() {
  const padX = 80
  const padY = 120
  const availW = window.innerWidth - padX
  const availH = window.innerHeight - padY
  const z = Math.min(availW / SLIDE_W, availH / SLIDE_H)
  stageStyle.value = {
    width: `${SLIDE_W * z}px`,
    height: `${SLIDE_H * z}px`,
    '--present-zoom': String(z)
  }
}

async function loadSlide(i: number) {
  if (!staticCanvas) return
  const json = slides.value[i]?.fabricJson
  if (!json) {
    staticCanvas.clear()
    staticCanvas.backgroundColor = '#FFFFFF'
    staticCanvas.renderAll()
    return
  }
  await staticCanvas.loadFromJSON(json)
  staticCanvas.renderAll()
}

function next() {
  if (idx.value < slides.value.length - 1) idx.value += 1
}
function prev() {
  if (idx.value > 0) idx.value -= 1
}
function close() {
  emit('update:open', false)
}

function onKey(e: KeyboardEvent) {
  if (!props.open) return
  if (e.key === 'Escape') close()
  else if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
    e.preventDefault()
    next()
  } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
    e.preventDefault()
    prev()
  }
}

watch(idx, (i) => loadSlide(i))

watch(
  () => props.open,
  async (v) => {
    if (!v) {
      staticCanvas?.dispose()
      staticCanvas = null
      return
    }
    idx.value = deck.currentIndex || 0
    recalcStage()
    await nextTick()
    if (canvasEl.value && !staticCanvas) {
      staticCanvas = new fabric.StaticCanvas(canvasEl.value, {
        width: SLIDE_W,
        height: SLIDE_H,
        backgroundColor: '#FFFFFF'
      })
    }
    await loadSlide(idx.value)
  }
)

onMounted(() => {
  window.addEventListener('keydown', onKey)
  window.addEventListener('resize', recalcStage)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('resize', recalcStage)
  staticCanvas?.dispose()
  staticCanvas = null
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-300"
      leave-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="props.open"
        class="fixed inset-0 z-[60] bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center"
        @click.self="close"
      >
        <!-- 顶部退出 -->
        <button
          class="absolute top-5 right-6 text-white/70 hover:text-white text-sm flex items-center gap-2"
          @click="close"
        >
          ESC 退出 ✕
        </button>

        <!-- 舞台 -->
        <div
          class="rounded-md overflow-hidden bg-white shadow-2xl"
          :style="stageStyle"
        >
          <div
            class="origin-top-left"
            :style="{
              width: `${SLIDE_W}px`,
              height: `${SLIDE_H}px`,
              transform: `scale(var(--present-zoom))`
            }"
          >
            <canvas ref="canvasEl" />
          </div>
        </div>

        <!-- 底部翻页 -->
        <div
          class="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 text-white/85 text-sm"
        >
          <button
            class="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 transition-colors"
            :disabled="idx === 0"
            @click="prev"
          >‹</button>
          <span class="tabular-nums w-20 text-center">
            {{ idx + 1 }} / {{ slides.length }}
          </span>
          <button
            class="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 transition-colors"
            :disabled="idx === slides.length - 1"
            @click="next"
          >›</button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
