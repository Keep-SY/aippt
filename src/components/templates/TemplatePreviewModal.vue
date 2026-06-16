<script setup lang="ts">
import type { Template } from '@/stores/studio'
import { useStudioStore } from '@/stores/studio'

const props = defineProps<{ template: Template }>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'select', id: string): void
}>()

const studio = useStudioStore()
const previewSlides = studio.outline.sections.slice(0, 3)
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm"
      v-motion
      :initial="{ opacity: 0 }"
      :enter="{ opacity: 1, transition: { duration: 220 } }"
      @click.self="emit('close')"
    >
      <div
        class="bg-surface rounded-lg shadow-lg w-[min(960px,90vw)] max-h-[86vh] flex flex-col"
        v-motion
        :initial="{ scale: 0.96, opacity: 0 }"
        :enter="{ scale: 1, opacity: 1, transition: { duration: 320 } }"
      >
        <header class="h-14 px-5 flex items-center justify-between border-b hairline border-b-hairline/10">
          <div>
            <div class="font-medium">{{ props.template.name }}</div>
            <div class="text-xs text-ink-500">{{ props.template.category }} · 模板预览</div>
          </div>
          <div class="flex items-center gap-2">
            <button class="btn-ghost focus-ring h-9 px-3 text-sm" @click="emit('close')">取消</button>
            <button
              class="btn-shiny focus-ring h-9 px-4 text-sm"
              @click="emit('select', props.template.id)"
            >应用此模板</button>
          </div>
        </header>

        <div class="flex-1 overflow-auto p-6 space-y-4">
          <div
            v-for="(s, i) in previewSlides"
            :key="s.id"
            class="aspect-[16/9] rounded-md overflow-hidden ring-1 ring-hairline/10 p-8 flex flex-col justify-end relative"
            :style="{ background: props.template.bg }"
          >
            <div class="text-white opacity-70 text-xs">第 {{ i + 1 }} 页</div>
            <div
              class="text-white text-2xl font-bold mt-1 leading-tight"
              :class="{ 'font-serif': props.template.font === 'serif', 'font-mono': props.template.font === 'mono' }"
            >{{ s.title }}</div>
            <ul class="mt-3 space-y-1 text-white/85 text-md">
              <li v-for="b in s.bullets.slice(0, 3)" :key="b.id" class="flex items-start gap-2">
                <span
                  class="w-1.5 h-1.5 rounded-full mt-2 shrink-0"
                  :style="{ background: props.template.accent }"
                />
                <span>{{ b.text }}</span>
              </li>
            </ul>
            <div
              class="absolute bottom-6 right-6 h-1 w-12 rounded-full"
              :style="{ background: props.template.accent }"
            />
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
