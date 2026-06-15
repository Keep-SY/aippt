<script setup lang="ts">
import { ref } from 'vue'
import ObjectProperties from './ObjectProperties.vue'
import AIAssistant from './AIAssistant.vue'

type Tab = 'object' | 'ai'
const tab = ref<Tab>('object')
</script>

<template>
  <aside class="h-full flex flex-col bg-surface/50">
    <div class="h-10 px-2 flex items-center gap-1 border-b hairline border-b-hairline/10">
      <button
        class="flex-1 h-7 rounded-sm text-sm transition-colors"
        :class="
          tab === 'object'
            ? 'bg-ink-900/[0.06] text-ink-900 font-medium'
            : 'text-ink-500 hover:text-ink-900'
        "
        @click="tab = 'object'"
      >
        对象
      </button>
      <button
        class="flex-1 h-7 rounded-sm text-sm transition-colors"
        :class="
          tab === 'ai'
            ? 'bg-brand-gradient-soft text-brand-600 font-medium'
            : 'text-ink-500 hover:text-ink-900'
        "
        @click="tab = 'ai'"
      >
        ✨ AI 助手
      </button>
    </div>

    <div class="flex-1 overflow-y-auto">
      <ObjectProperties v-if="tab === 'object'" />
      <AIAssistant v-else />
    </div>
  </aside>
</template>
