<script setup lang="ts">
import { useDeckStore } from '@/stores/deck'
import SlideThumbnail from './SlideThumbnail.vue'

const deck = useDeckStore()
</script>

<template>
  <aside class="h-full flex flex-col bg-surface/40">
    <div class="h-10 px-3 flex items-center justify-between text-xs text-ink-500">
      <span>{{ deck.current.slides.length }} 页</span>
    </div>

    <div class="flex-1 overflow-y-auto px-3 pb-3 space-y-3">
      <SlideThumbnail
        v-for="(slide, idx) in deck.current.slides"
        :key="slide.id"
        :index="idx"
        :slide="slide"
        :active="idx === deck.currentIndex"
        @click="deck.selectSlide(idx)"
        @duplicate="deck.duplicateSlide(idx)"
        @remove="deck.removeSlide(idx)"
      />
    </div>

    <button
      class="m-3 h-10 rounded-md border border-dashed border-hairline/20 text-sm text-ink-500 hover:bg-ink-900/[0.04] hover:text-ink-900 transition-colors focus-ring"
      @click="deck.addSlide()"
    >
      + 新增页
    </button>
  </aside>
</template>
