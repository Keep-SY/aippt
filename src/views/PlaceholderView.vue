<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()
const router = useRouter()
const title = computed(() => (route.meta.title as string) ?? '占位页面')
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-canvas">
    <div class="glass-strong rounded-xl px-10 py-12 text-center max-w-md">
      <div class="text-xs uppercase tracking-widest text-ink-500 mb-3">Coming Soon</div>
      <div class="text-xl font-semibold mb-2">{{ title }}</div>
      <p class="text-ink-500 text-sm mb-6">该模块将在后续阶段实现。</p>
      <button class="btn-ghost focus-ring" @click="router.push('/app')">← 返回首页</button>
    </div>
  </div>
</template>
