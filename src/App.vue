<script setup lang="ts">
import { RouterView } from 'vue-router'
import { onMounted } from 'vue'
import { useThemeStore } from '@/stores/theme'

const theme = useThemeStore()
onMounted(() => theme.init())
</script>

<template>
  <RouterView v-slot="{ Component }">
    <transition
      enter-active-class="transition-opacity duration-base ease-out"
      leave-active-class="transition-opacity duration-fast ease-out"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
      mode="out-in"
    >
      <component :is="Component" />
    </transition>
  </RouterView>
</template>
