<script setup lang="ts">
import { inject, ref } from 'vue'
import { useRouter } from 'vue-router'
import { onClickOutside } from '@vueuse/core'
import { useDeckStore } from '@/stores/deck'
import { useCanvasStore } from '@/stores/canvas'
import { useThemeStore } from '@/stores/theme'
import { FabricApiKey } from '@/composables/fabricApiKey'
import { exportDeckAsPDF, exportDeckAsPPTX, exportSlideAsPNG } from '@/services/export'

const router = useRouter()
const deck = useDeckStore()
const canvas = useCanvasStore()
const theme = useThemeStore()
const api = inject(FabricApiKey)

const exportOpen = ref(false)
const exportRef = ref<HTMLElement | null>(null)
const exporting = ref<null | 'png' | 'pdf' | 'pptx'>(null)
onClickOutside(exportRef, () => (exportOpen.value = false))

async function doExport(kind: 'png' | 'pdf' | 'pptx') {
  if (exporting.value) return
  exporting.value = kind
  exportOpen.value = false
  try {
    // 在导出前先把当前页 canvas 的最新状态写回 deck.fabricJson
    // （正常情况下 object 事件已实时同步，这里是兜底）
    const fc = api?.getCanvas()
    if (fc) deck.patchCurrentSlide(fc.toJSON(['name', 'aiTag']))

    if (kind === 'png') {
      const slide = deck.currentSlide
      if (slide) await exportSlideAsPNG(slide, deck.current.title + '_p' + (deck.currentIndex + 1))
    } else if (kind === 'pdf') {
      await exportDeckAsPDF(deck.current)
    } else {
      await exportDeckAsPPTX(deck.current)
    }
  } catch (e) {
    alert('导出失败：' + (e as Error).message)
  } finally {
    exporting.value = null
  }
}
</script>

<template>
  <header
    class="h-14 shrink-0 flex items-center justify-between px-4 glass-strong border-b hairline border-b-hairline/10 z-20"
  >
    <!-- 左：返回 + 标题 -->
    <div class="flex items-center gap-3 min-w-0">
      <button
        class="btn-ghost focus-ring h-9 px-2"
        title="返回首页"
        @click="router.push('/')"
      >←</button>
      <div
        class="w-7 h-7 rounded-md bg-brand-gradient grid place-items-center text-white text-sm font-bold"
      >A</div>
      <input
        :value="deck.current.title"
        class="bg-transparent outline-none font-medium truncate min-w-0 max-w-[360px] px-2 py-1 rounded-sm hover:bg-ink-900/[0.04] focus-visible:bg-ink-900/[0.04] focus-ring"
        @input="(e) => deck.setTitle((e.target as HTMLInputElement).value)"
      />
      <span class="text-xs text-ink-500 hidden md:inline">
        · {{ canvas.dirty ? '未保存' : '已保存' }}
      </span>
    </div>

    <!-- 中：撤销/重做 -->
    <div class="flex items-center gap-1">
      <button
        class="btn-ghost focus-ring h-9 w-9 p-0 disabled:opacity-40"
        :disabled="!canvas.canUndo"
        title="撤销 ⌘Z"
        @click="api?.undo()"
      >⤺</button>
      <button
        class="btn-ghost focus-ring h-9 w-9 p-0 disabled:opacity-40"
        :disabled="!canvas.canRedo"
        title="重做 ⌘⇧Z"
        @click="api?.redo()"
      >⤻</button>
    </div>

    <!-- 右：动作 -->
    <div class="flex items-center gap-2">
      <button class="btn-ghost focus-ring h-9 px-3 text-sm" @click="theme.toggle()">◐</button>
      <button class="btn-ghost focus-ring h-9 px-3 text-sm" title="演示">▶ 播放</button>

      <!-- 导出 dropdown -->
      <div ref="exportRef" class="relative">
        <button
          class="btn-shiny focus-ring h-9 px-4 text-sm disabled:opacity-60"
          :disabled="!!exporting"
          @click="exportOpen = !exportOpen"
        >
          <template v-if="exporting">
            <span class="inline-block w-3 h-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            导出中…
          </template>
          <template v-else>⤓ 导出 ▾</template>
        </button>

        <transition
          enter-active-class="transition-all duration-base ease-out"
          leave-active-class="transition-all duration-fast ease-out"
          enter-from-class="opacity-0 -translate-y-1"
          leave-to-class="opacity-0"
        >
          <div
            v-if="exportOpen"
            class="absolute right-0 top-11 w-56 glass-strong rounded-md shadow-md p-1 text-sm z-30"
          >
            <button
              class="w-full text-left h-9 px-3 rounded-sm hover:bg-ink-900/[0.06] flex items-center justify-between"
              @click="doExport('pdf')"
            >
              <span>PDF · 整本</span>
              <span class="text-xs text-ink-500">.pdf</span>
            </button>
            <button
              class="w-full text-left h-9 px-3 rounded-sm hover:bg-ink-900/[0.06] flex items-center justify-between"
              @click="doExport('pptx')"
            >
              <span>PowerPoint · 整本</span>
              <span class="text-xs text-ink-500">.pptx</span>
            </button>
            <div class="my-1 h-px bg-hairline/10" />
            <button
              class="w-full text-left h-9 px-3 rounded-sm hover:bg-ink-900/[0.06] flex items-center justify-between"
              @click="doExport('png')"
            >
              <span>当前页图片</span>
              <span class="text-xs text-ink-500">.png</span>
            </button>
          </div>
        </transition>
      </div>

      <div class="w-8 h-8 rounded-full bg-ink-900/10 grid place-items-center text-xs">U</div>
    </div>
  </header>
</template>
