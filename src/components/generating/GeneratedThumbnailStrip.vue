<script setup lang="ts">
interface Item {
  index: number
  title: string
  bullets: string[]
  partial?: string
}
defineProps<{ items: Item[] }>()
</script>

<template>
  <div class="overflow-x-auto -mx-2 px-2 pb-2">
    <ul class="flex gap-3 min-w-max">
      <li
        v-for="item in items"
        :key="item.index"
        class="w-[220px] shrink-0 rounded-md ring-1 ring-hairline/10 bg-surface overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-base"
        v-motion
        :initial="{ opacity: 0, x: 24 }"
        :enter="{ opacity: 1, x: 0, transition: { duration: 320 } }"
      >
        <!-- 16:9 -->
        <div
          class="aspect-[16/9] p-3 flex flex-col justify-end relative"
          style="background: linear-gradient(135deg, #0F1226, #2A2F4A)"
        >
          <div class="text-white/60 text-[10px]">第 {{ item.index + 1 }} 页</div>
          <div class="text-white text-xs font-bold leading-tight line-clamp-2">
            {{ item.title }}
          </div>
          <div class="absolute bottom-2 right-3 h-0.5 w-6 rounded-full bg-brand-500" />
        </div>
        <!-- 流式正文 -->
        <div class="p-2.5 text-[11px] text-ink-700 h-16 overflow-hidden leading-snug">
          <span>{{ item.partial || item.bullets[0] || '生成中...' }}</span>
          <span
            v-if="!item.partial || item.partial.length < 4"
            class="inline-block w-1 h-3 ml-0.5 align-middle bg-brand-500 animate-pulse"
          />
        </div>
      </li>
    </ul>
  </div>
</template>
