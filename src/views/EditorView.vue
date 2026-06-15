<script setup lang="ts">
import { ref, provide } from 'vue'
import EditorTopBar from '@/components/editor/EditorTopBar.vue'
import EditorSidebar from '@/components/editor/EditorSidebar.vue'
import EditorCanvas from '@/components/editor/EditorCanvas.vue'
import EditorPropertyPanel from '@/components/editor/EditorPropertyPanel.vue'
import EditorStatusBar from '@/components/editor/EditorStatusBar.vue'
import { FabricApiKey } from '@/composables/fabricApiKey'
import type { FabricApi } from '@/composables/useFabricCanvas'

/**
 * EditorView
 * 容器只负责布局和分发 Fabric API。
 * Fabric 实例在 EditorCanvas 内创建，通过 emit 把 api 提到这里 provide。
 */
const fabricApi = ref<FabricApi | null>(null)

provide(
  FabricApiKey,
  new Proxy({} as FabricApi, {
    get(_, prop) {
      const api = fabricApi.value
      if (!api) return undefined
      return Reflect.get(api as object, prop)
    }
  })
)

function onApiReady(api: FabricApi) {
  fabricApi.value = api
}
</script>

<template>
  <div class="h-screen w-screen flex flex-col bg-canvas overflow-hidden">
    <EditorTopBar />

    <div class="flex-1 flex min-h-0">
      <!-- 左：缩略图列表 -->
      <EditorSidebar class="w-[200px] shrink-0 border-r hairline border-r-hairline/10" />

      <!-- 中：画布 -->
      <EditorCanvas class="flex-1 min-w-0" @ready="onApiReady" />

      <!-- 右：属性面板 -->
      <EditorPropertyPanel
        class="w-[320px] shrink-0 border-l hairline border-l-hairline/10"
      />
    </div>

    <EditorStatusBar />
  </div>
</template>
