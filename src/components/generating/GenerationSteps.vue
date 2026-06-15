<script setup lang="ts">
type StepStatus = 'pending' | 'active' | 'done' | 'error'

defineProps<{
  steps: { key: string; label: string; status: StepStatus }[]
  currentPage: number
  totalPages: number
}>()
</script>

<template>
  <ul class="space-y-2">
    <li
      v-for="s in steps"
      :key="s.key"
      class="flex items-center gap-3 text-sm transition-colors duration-base"
      :class="{
        'text-ink-500': s.status === 'pending',
        'text-ink-900 font-medium': s.status === 'active',
        'text-success': s.status === 'done',
        'text-danger': s.status === 'error'
      }"
    >
      <!-- 状态图标 -->
      <span
        class="w-5 h-5 rounded-full grid place-items-center text-xs shrink-0"
        :class="{
          'bg-ink-100 text-ink-500': s.status === 'pending',
          'bg-brand-gradient-soft text-brand-600 animate-breathe': s.status === 'active',
          'bg-success text-white': s.status === 'done',
          'bg-danger text-white': s.status === 'error'
        }"
      >
        <template v-if="s.status === 'done'">✓</template>
        <template v-else-if="s.status === 'error'">!</template>
        <template v-else-if="s.status === 'active'">⟳</template>
        <template v-else>○</template>
      </span>

      <span class="flex-1">
        {{ s.label }}
        <span v-if="s.key === 'pages' && s.status === 'active'" class="ml-1 text-ink-500">
          {{ currentPage }} / {{ totalPages }}
        </span>
      </span>
    </li>
  </ul>
</template>
