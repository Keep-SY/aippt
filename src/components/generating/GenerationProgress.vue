<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ value: number }>()

const SIZE = 180
const STROKE = 10
const R = (SIZE - STROKE) / 2
const CIRC = 2 * Math.PI * R

const offset = computed(() => CIRC * (1 - Math.max(0, Math.min(100, props.value)) / 100))
</script>

<template>
  <div class="relative grid place-items-center">
    <svg :width="SIZE" :height="SIZE" class="-rotate-90">
      <defs>
        <linearGradient id="ring" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#7C5CFF" />
          <stop offset="100%" stop-color="#4FA8FF" />
        </linearGradient>
      </defs>
      <circle
        :cx="SIZE / 2"
        :cy="SIZE / 2"
        :r="R"
        fill="none"
        stroke="rgb(15 18 38 / 0.06)"
        :stroke-width="STROKE"
      />
      <circle
        :cx="SIZE / 2"
        :cy="SIZE / 2"
        :r="R"
        fill="none"
        stroke="url(#ring)"
        :stroke-width="STROKE"
        stroke-linecap="round"
        :stroke-dasharray="CIRC"
        :stroke-dashoffset="offset"
        class="transition-[stroke-dashoffset] duration-slow ease-out"
      />
    </svg>
    <div class="absolute inset-0 grid place-items-center">
      <div class="text-center">
        <div class="text-3xl font-semibold tabular-nums text-gradient">
          {{ Math.round(props.value) }}
          <span class="text-lg align-top">%</span>
        </div>
        <div class="text-xs text-ink-500 mt-1">progress</div>
      </div>
    </div>
  </div>
</template>
