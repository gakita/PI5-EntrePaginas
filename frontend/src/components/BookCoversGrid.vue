<script setup lang="ts">
import { computed } from 'vue'
import type { CatalogBook } from '@/services'

const props = withDefaults(defineProps<{
  books?: CatalogBook[]
  total?: number
  currentPage?: number
  totalPages?: number
}>(), {
  total: 15,
  books: () => [],
  currentPage: 1,
  totalPages: 1,
})

const emit = defineEmits<{
  pageChange: [page: number]
}>()

const bookCards = computed(() => {
  if (props.books.length > 0) {
    return props.books.map((book, index) => ({
      id: book.googleBooksId || `${index + 1}`,
      title: book.title || 'Título indisponível',
      author: book.author || '',
      coverUrl: book.coverUrl || '',
      isPlaceholder: false,
    }))
  }

  return Array.from({ length: props.total }, (_, index) => ({
    id: index + 1,
    title: '',
    author: '',
    coverUrl: '',
    isPlaceholder: true,
  }))
})
</script>

<template>
  <section class="cards-panel">
    <div class="cards-panel__scroll">
      <article
        v-for="card in bookCards"
        :key="card.id"
        class="book-card"
        :class="{ 'book-card--placeholder': card.isPlaceholder }"
      >
        <div v-if="!card.isPlaceholder" class="book-card__cover">
          <img
            v-if="card.coverUrl"
            :src="card.coverUrl"
            :alt="card.title"
            class="book-card__image"
          />
        </div>
      </article>
    </div>

    <div v-if="totalPages > 1" class="pagination">
      <button
        class="pagination__btn pagination__btn--prev"
        :disabled="currentPage === 1"
        @click="emit('pageChange', currentPage - 1)"
      >
        <v-icon size="18">mdi-chevron-left</v-icon>
      </button>

      <div class="pagination__info">
        <span>Página {{ currentPage }} de {{ totalPages }}</span>
      </div>

      <button
        class="pagination__btn pagination__btn--next"
        :disabled="currentPage === totalPages"
        @click="emit('pageChange', currentPage + 1)"
      >
        <v-icon size="18">mdi-chevron-right</v-icon>
      </button>
    </div>
  </section>
</template>

<style scoped>
.cards-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: 14px;
  border: 1px solid rgba(232, 213, 183, 0.25);
  border-radius: 15px;
  background: rgba(42, 31, 20, 0.75);
  box-shadow: 0 6px 3px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}

.cards-panel__scroll {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(5, minmax(90px, 1fr));
  column-gap: 10px;
  row-gap: 190px;
  justify-content: stretch;
  overflow-y: auto;
  overscroll-behavior: contain;
  align-content: start;
  scrollbar-width: thin;
  scrollbar-color: #c9a227 transparent;
}

.cards-panel__scroll::-webkit-scrollbar {
  width: 10px;
}

.cards-panel__scroll::-webkit-scrollbar-track {
  background: transparent;
}

.cards-panel__scroll::-webkit-scrollbar-thumb {
  background-color: #c9a227;
  border-radius: 999px;
  border: 2px solid transparent;
  background-clip: padding-box;
}

.cards-panel__scroll::-webkit-scrollbar-thumb:hover {
  background-color: #d8b64a;
}

.book-card {
  position: relative;
  width: 100%;
  aspect-ratio: 200 / 250;
  border-radius: 15px;
  overflow: hidden;
  background-color: #120d07;
  box-shadow: inset 0 0 0 1px rgba(232, 213, 183, 0.08);
}

.book-card__cover {
  position: absolute;
  inset: 5px;
  border-radius: 10px;
  overflow: hidden;
  background: linear-gradient(145deg, #20160d 0%, #120d07 100%);
}

.book-card__image {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  object-position: center;
}

.book-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(17, 12, 7, 0) 0%, rgba(17, 12, 7, 0.28) 100%);
  pointer-events: none;
}

.book-card:not(.book-card--placeholder) {
  background-size: cover;
  background-position: center;
}

.book-card--placeholder {
  background:
    radial-gradient(circle at top, rgba(201, 162, 39, 0.16), transparent 58%),
    linear-gradient(145deg, #20160d 0%, #120d07 100%);
}

.book-card--placeholder::after {
  content: '';
  position: absolute;
  inset: 12px;
  border-radius: 11px;
  border: 1px solid rgba(232, 213, 183, 0.08);
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 10px 8px 2px;
  margin-top: 10px;
  border-top: 1px solid rgba(232, 213, 183, 0.15);
  background: rgba(42, 31, 20, 0.18);
}

.pagination__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid rgba(232, 213, 183, 0.2);
  border-radius: 8px;
  background: rgba(42, 31, 20, 0.5);
  color: #e8d5b7;
  cursor: pointer;
  transition: all 0.2s ease;
}

.pagination__btn:hover:not(:disabled) {
  background: rgba(201, 162, 39, 0.2);
  border-color: rgba(201, 162, 39, 0.4);
  color: #c9a227;
}

.pagination__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination__info {
  font-size: 12px;
  color: #9b8a75;
  font-weight: 500;
  letter-spacing: 0.3px;
  min-width: 120px;
  text-align: center;
}

@media (max-width: 1400px) {
  .cards-panel__scroll {
    grid-template-columns: repeat(5, minmax(78px, 1fr));
    column-gap: 10px;
    row-gap: 190px;
  }
}

@media (max-width: 1080px) {
  .cards-panel__scroll {
    grid-template-columns: repeat(3, minmax(120px, 1fr));
    justify-content: initial;
  }
}

@media (max-width: 760px) {
  .cards-panel {
    padding: 12px;
  }

  .cards-panel__scroll {
    grid-template-columns: repeat(2, minmax(120px, 1fr));
    column-gap: 12px;
    row-gap: 190px;
  }
}
</style>
