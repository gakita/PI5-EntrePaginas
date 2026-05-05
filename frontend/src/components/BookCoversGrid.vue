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
    <router-link
      v-for="card in bookCards"
      :key="card.id"
      :aria-label="`Abrir livro ${card.id}`"
      class="book-card"
      :to="`/livros/${card.id}`"
    />
  </section>
</template>

<style scoped>
.cards-panel {
  display: grid;
  grid-template-columns: repeat(5, minmax(90px, 1fr));
  gap: 14px;
  height: 100%;
  min-height: 0;
  padding: 30px 26px;
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
  display: block;
  width: 100%;
  aspect-ratio: 200 / 275;
  border-radius: 15px;
  background-color: #120d07;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  border: 1px solid transparent;
  text-decoration: none;
}

.book-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.25);
  border-color: rgba(201, 162, 39, 0.45);
}

.book-card:focus-visible {
  outline: 2px solid #c9a227;
  outline-offset: 3px;
}

@media (max-width: 1400px) {
  .cards-panel {
    grid-template-columns: repeat(5, minmax(78px, 1fr));
    gap: 12px;
    padding: 24px 18px;
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
    gap: 16px;
    padding: 16px;
  }
}
</style>
