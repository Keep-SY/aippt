<script setup lang="ts">
import { inject } from 'vue'
import { FabricApiKey } from '@/composables/fabricApiKey'

const api = inject(FabricApiKey)

const tools = [
  { key: 'text', icon: 'T', label: '文字', action: () => api?.addText() },
  { key: 'rect', icon: '▢', label: '矩形', action: () => api?.addRect() },
  { key: 'ellipse', icon: '◯', label: '椭圆', action: () => api?.addEllipse() },
  {
    key: 'image',
    icon: '🖼',
    label: '图片',
    action: () =>
      api?.addImage(
        'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&q=70&auto=format'
      )
  }
] as const
</script>

<template>
  <div class="glass-strong rounded-full px-2 h-11 flex items-center gap-1 shadow-md">
    <button
      v-for="t in tools"
      :key="t.key"
      class="h-8 px-3 rounded-full text-sm hover:bg-ink-900/[0.06] active:scale-95 transition-all duration-fast inline-flex items-center gap-1.5"
      :title="t.label"
      @click="t.action()"
    >
      <span class="opacity-80">{{ t.icon }}</span>
      <span class="hidden sm:inline">{{ t.label }}</span>
    </button>

    <span class="w-px h-5 bg-hairline/15 mx-1" />

    <button
      class="h-8 px-3 rounded-full text-sm hover:bg-ink-900/[0.06]"
      title="上移一层"
      @click="api?.bringForward()"
    >
      ↑
    </button>
    <button
      class="h-8 px-3 rounded-full text-sm hover:bg-ink-900/[0.06]"
      title="下移一层"
      @click="api?.sendBackward()"
    >
      ↓
    </button>

    <span class="w-px h-5 bg-hairline/15 mx-1" />

    <button
      class="h-8 px-3 rounded-full text-sm text-danger hover:bg-danger/10"
      title="删除"
      @click="api?.removeSelected()"
    >
      ✕
    </button>
  </div>
</template>
