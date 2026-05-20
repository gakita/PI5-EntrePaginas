<script setup lang="ts">
  import { computed } from 'vue'
  import type { CatalogBook } from '@/services'

  type CatalogBookWithId = CatalogBook & { googleBooksId: string }

  const props = withDefaults(defineProps<{
    books?: CatalogBook[]
    loading?: boolean
    total?: number
  }>(), {
    books: () => [],
    loading: false,
    total: 15,
  })

  const bookCards = computed(() =>
    props.books.filter((book): book is CatalogBookWithId => Boolean(book.googleBooksId)),
  )

  const skeletonCards = computed(() =>
    Array.from({ length: props.total }, (_, index) => ({ id: index + 1 })),
  )
</script>

<template>
  <section class="cards-panel">
    <div
      v-if="loading"
      v-for="card in skeletonCards"
      :key="`loading-${card.id}`"
      class="book-card book-card--loading"
    />

    <router-link
      v-else
      v-for="card in bookCards"
      :key="card.googleBooksId"
      :aria-label="`Abrir livro ${card.title || card.googleBooksId}`"
      class="book-card"
      :to="`/livros/${card.googleBooksId}`"
    >
      <img
        v-if="card.coverUrl"
        class="book-card__cover"
        :src="card.coverUrl"
        :alt="card.title ? `Capa de ${card.title}` : 'Capa do livro'"
        loading="lazy"
      >
      <div class="book-card__shade" />
      <div class="book-card__info">
        <strong>{{ card.title || 'Titulo indisponivel' }}</strong>
        <span>{{ card.author || 'Autor desconhecido' }}</span>
      </div>
    </router-link>
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
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 200 / 275;
  border-radius: 15px;
  background-color: #120d07;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  border: 1px solid transparent;
  text-decoration: none;
  overflow: hidden;
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

.book-card__cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.book-card__shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 36%, rgba(8, 6, 4, 0.82) 100%);
  pointer-events: none;
}

.book-card__info {
  position: absolute;
  left: 10px;
  right: 10px;
  bottom: 10px;
  display: grid;
  gap: 2px;
  color: #f0dfbd;
  font-family: 'Playfair Display', serif;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.75);
}

.book-card__info strong,
.book-card__info span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book-card__info strong {
  font-size: 14px;
  line-height: 1.1;
}

.book-card__info span {
  font-size: 12px;
  line-height: 1.1;
  opacity: 0.9;
}

.book-card--loading {
  background:
    linear-gradient(90deg, rgba(232, 213, 183, 0.05), rgba(232, 213, 183, 0.12), rgba(232, 213, 183, 0.05)),
    #120d07;
  background-size: 220% 100%;
  animation: loadingPulse 1.2s ease-in-out infinite;
}

@keyframes loadingPulse {
  from {
    background-position: 100% 0;
  }

  to {
    background-position: -100% 0;
  }
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
