<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  imageUrl?: string
  width?: string
  height?: string
  top?: string
  left?: string
  opacity?: number
}>(), {
  imageUrl: 'https://www.figma.com/api/mcp/asset/b7d1eec3-115a-432f-8eae-4e8636b8554c',
  width: '777px',
  height: '777px',
  top: '-185px',
  left: '50%',
  opacity: 0.8,
})

const glowStyle = computed(() => ({
  top: props.top,
  left: props.left,
  width: props.width,
  height: props.height,
  opacity: props.opacity,
  backgroundImage: `url('${props.imageUrl}')`,
}))
</script>

<template>
  <div class="catalog-glow" :style="glowStyle" />
</template>

<style scoped>
.catalog-glow {
  position: absolute;
  transform: translateX(-50%);
  background-size: cover;
  background-position: center;
  pointer-events: none;
  z-index: 0;
}
</style>
