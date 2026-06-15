<script setup lang="ts">
import { useDeckStore } from '@/stores/deck'
import { useCanvasStore } from '@/stores/canvas'

const deck = useDeckStore()
const canvas = useCanvasStore()
</script>

<template>
  <footer
    class="h-7 shrink-0 px-4 flex items-center justify-between text-[11px] text-ink-500 border-t hairline border-t-hairline/10 bg-surface/40"
  >
    <div class="flex items-center gap-3">
      <span>Page {{ deck.currentIndex + 1 }} / {{ deck.current.slides.length }}</span>
      <span>·</span>
      <span>{{ deck.slideSize.width }}×{{ deck.slideSize.height }}</span>
      <span>·</span>
      <span>缩放 {{ Math.round(canvas.zoom * 100) }}%</span>
    </div>
    <div class="flex items-center gap-2">
      <span v-if="canvas.dirty" class="flex items-center gap-1">
        <span class="w-1.5 h-1.5 rounded-full bg-warning animate-breathe" />
        正在保存…
      </span>
      <span v-else class="flex items-center gap-1 text-success">
        <span class="w-1.5 h-1.5 rounded-full bg-success" />
        已同步
      </span>
      <span class="hidden md:inline">⌘Z 撤销 · Del 删除 · 方向键微调</span>
    </div>
  </footer>
</template>
