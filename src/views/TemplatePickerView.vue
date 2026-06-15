<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useStudioStore, type Template } from '@/stores/studio'
import { useThemeStore } from '@/stores/theme'
import TemplateCard from '@/components/templates/TemplateCard.vue'
import TemplatePreviewModal from '@/components/templates/TemplatePreviewModal.vue'

const router = useRouter()
const studio = useStudioStore()
const theme = useThemeStore()

const categories = ['全部', '商务', '科技', '极简', '教育', '创意'] as const
type Category = (typeof categories)[number]
const activeCat = ref<Category>('全部')

const filtered = computed(() =>
  activeCat.value === '全部'
    ? studio.templates
    : studio.templates.filter((t) => t.category === activeCat.value)
)

const previewing = ref<Template | null>(null)

function selectAndContinue(id: string) {
  studio.selectTemplate(id)
  router.push('/generating')
}
</script>

<template>
  <div class="min-h-screen bg-canvas">
    <!-- 顶部 -->
    <header
      class="sticky top-0 z-20 h-14 px-6 flex items-center justify-between glass-strong border-b hairline border-b-hairline/10"
    >
      <div class="flex items-center gap-3">
        <button class="btn-ghost focus-ring h-9 px-2" @click="router.push('/outline')">←</button>
        <div
          class="w-7 h-7 rounded-md bg-brand-gradient grid place-items-center text-white text-sm font-bold"
        >A</div>
        <span class="font-medium">选择模板风格</span>
      </div>
      <div class="flex items-center gap-2">
        <button class="btn-ghost focus-ring h-9 px-3 text-sm" @click="theme.toggle()">◐</button>
        <button class="btn-ghost focus-ring h-9 px-3 text-sm" @click="router.push('/generating')">
          跳过 →
        </button>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-6 py-8 grid md:grid-cols-[200px_1fr] gap-8">
      <!-- 左：筛选 -->
      <aside class="md:sticky md:top-20 md:self-start">
        <div class="text-xs uppercase tracking-widest text-ink-500 mb-3">风格筛选</div>
        <ul class="space-y-1">
          <li v-for="c in categories" :key="c">
            <button
              class="w-full text-left h-9 px-3 rounded-sm text-sm transition-colors"
              :class="
                activeCat === c
                  ? 'bg-brand-gradient-soft text-brand-600 font-medium'
                  : 'text-ink-700 hover:bg-ink-900/[0.04]'
              "
              @click="activeCat = c"
            >{{ c }}</button>
          </li>
        </ul>

        <div class="mt-8 text-xs uppercase tracking-widest text-ink-500 mb-3">已选模板</div>
        <div
          v-if="studio.selectedTemplate"
          class="rounded-md border border-hairline/10 p-2"
        >
          <div
            class="aspect-[16/9] rounded-sm mb-2"
            :style="{ background: studio.selectedTemplate.bg }"
          />
          <div class="text-sm font-medium truncate">{{ studio.selectedTemplate.name }}</div>
          <div class="text-xs text-ink-500">{{ studio.selectedTemplate.category }}</div>
        </div>
      </aside>

      <!-- 右：网格 -->
      <section>
        <div class="flex items-center justify-between mb-4">
          <div class="text-sm text-ink-500">{{ filtered.length }} 个模板</div>
        </div>

        <div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <TemplateCard
            v-for="(t, i) in filtered"
            :key="t.id"
            :template="t"
            :selected="studio.selectedTemplateId === t.id"
            :style="{ animationDelay: `${i * 30}ms` }"
            class="animate-fade-in-up"
            @select="studio.selectTemplate(t.id)"
            @preview="previewing = t"
          />
        </div>
      </section>
    </main>

    <!-- 底部确认条 -->
    <footer
      class="fixed bottom-0 inset-x-0 h-16 z-20 glass-strong border-t hairline border-t-hairline/10"
    >
      <div class="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
        <div class="text-sm text-ink-500">
          已选：
          <span class="font-medium text-ink-900">{{ studio.selectedTemplate?.name ?? '—' }}</span>
        </div>
        <button
          class="btn-shiny focus-ring h-10 px-6"
          @click="selectAndContinue(studio.selectedTemplateId)"
        >
          应用并生成 →
        </button>
      </div>
    </footer>

    <TemplatePreviewModal
      v-if="previewing"
      :template="previewing"
      @close="previewing = null"
      @select="(id) => { studio.selectTemplate(id); previewing = null }"
    />
  </div>
</template>
