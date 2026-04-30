<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  total?: number
}>(), {
  total: 15,
})

const bookCards = computed(() =>
  Array.from({ length: props.total }, (_, index) => ({ id: index + 1 })),
)
</script>

<template>
  <section class="cards-panel">
    <article
      v-for="card in bookCards"
      :key="card.id"
      class="book-card"
    />
  </section>
</template>

<style scoped>
.cards-panel {
  display: grid;
  grid-template-columns: repeat(5, minmax(90px, 1fr));
  gap: 10px;
  height: 100%;
  min-height: 0;
  padding: 18px 18px;
  border: 1px solid rgba(232, 213, 183, 0.25);
  border-radius: 15px;
  background: rgba(42, 31, 20, 0.75);
  box-shadow: 0 6px 3px rgba(0, 0, 0, 0.25);
  justify-content: stretch;
  overflow-y: auto;
  overscroll-behavior: contain;
  align-content: start;
  scrollbar-width: thin;
  scrollbar-color: #c9a227 transparent;
}

.cards-panel::-webkit-scrollbar {
  width: 10px;
}

.cards-panel::-webkit-scrollbar-track {
  background: transparent;
}

.cards-panel::-webkit-scrollbar-thumb {
  background-color: #c9a227;
  border-radius: 999px;
  border: 2px solid transparent;
  background-clip: padding-box;
}

.cards-panel::-webkit-scrollbar-thumb:hover {
  background-color: #d8b64a;
}

.book-card {
  width: 100%;
  aspect-ratio: 200 / 250;
  border-radius: 15px;
  background-color: #120d07;
}

@media (max-width: 1400px) {
  .cards-panel {
    grid-template-columns: repeat(5, minmax(78px, 1fr));
    gap: 10px;
    padding: 16px 14px;
  }
}

@media (max-width: 1080px) {
  .cards-panel {
    grid-template-columns: repeat(3, minmax(120px, 1fr));
    justify-content: initial;
  }
}

@media (max-width: 760px) {
  .cards-panel {
    grid-template-columns: repeat(2, minmax(120px, 1fr));
    gap: 12px;
    padding: 16px;
  }
}
</style>
