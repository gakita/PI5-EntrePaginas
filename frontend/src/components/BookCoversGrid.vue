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

const bookDetailsCacheKey = 'entre-paginas:book-details'

function cacheBookForDetails(book: CatalogBook) {
  if (!book.googleBooksId) return

  try {
    const cachedBooks = JSON.parse(sessionStorage.getItem(bookDetailsCacheKey) || '{}')
    cachedBooks[book.googleBooksId] = book
    sessionStorage.setItem(bookDetailsCacheKey, JSON.stringify(cachedBooks))
  } catch {
    // Cache is only a navigation fallback; ignore storage failures.
  }
}

const bookCards = computed(() => {
  if (props.books.length > 0) {
    return props.books.map((book, index) => ({
      id: book.googleBooksId || `${index + 1}`,
      book,
      title: book.title || 'Título indisponível',
      author: book.author || '',
      coverUrl: book.coverUrl || '',
      to: book.googleBooksId ? `/livros/${encodeURIComponent(book.googleBooksId)}` : '',
      isPlaceholder: false,
      sensitiveContent: !!book.sensitiveContent,
    }))
  }

  return Array.from({ length: props.total }, (_, index) => ({
    id: index + 1,
    book: null,
    title: '',
    author: '',
    coverUrl: '',
    to: '',
    isPlaceholder: true,
    sensitiveContent: false,
  }))
})
</script>

<template>
  <section class="cards-panel">
    <div class="cards-panel__scroll">
      <component
        :is="card.to ? 'router-link' : 'article'"
        v-for="card in bookCards"
        :key="card.id"
        class="book-card"
        :class="{ 'book-card--placeholder': card.isPlaceholder }"
        :to="card.to || undefined"
        :aria-label="card.to ? `Abrir livro ${card.title}` : undefined"
        @click="card.book && cacheBookForDetails(card.book)"
      >
        <div v-if="!card.isPlaceholder" class="book-card__cover">
          <img
            v-if="card.coverUrl"
            :src="card.coverUrl"
            :alt="card.title"
            class="book-card__image"
          />
          <div v-else class="book-card__fallback">
            <span>{{ card.title }}</span>
          </div>

          <div v-if="card.sensitiveContent" class="book-card__sensitive-tag">
            <v-icon icon="mdi-alert-decagram" size="12" color="#110C07" class="mr-1" />
            <span>SENSÍVEL</span>
          </div>

          <div class="book-card__shade" />
          <div class="book-card__info">
            <strong>{{ card.title }}</strong>
            <span v-if="card.author">{{ card.author }}</span>
          </div>
        </div>
      </component>
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
  display: flex;
  flex-wrap: wrap;
  column-gap: 18px;
  row-gap: 34px;
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
  display: block;
  flex: 0 0 calc((100% - (4 * 18px)) / 5);
  aspect-ratio: 200 / 250;
  border-radius: 15px;
  overflow: hidden;
  background-color: #120d07;
  box-shadow: inset 0 0 0 1px rgba(232, 213, 183, 0.08);
  color: inherit;
  text-decoration: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  border: 1px solid transparent;
}

.book-card__sensitive-tag {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 3;
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  background: rgba(201, 162, 39, 0.95);
  border: 1px solid rgba(17, 12, 7, 0.15);
  border-radius: 6px;
  color: #110c07;
  font-family: 'Roboto', sans-serif;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.35);
  pointer-events: none;
}

.book-card:not(.book-card--placeholder):hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.25);
  border-color: rgba(201, 162, 39, 0.45);
}

.book-card:focus-visible {
  outline: 2px solid #c9a227;
  outline-offset: 3px;
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

.book-card__fallback {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  background:
    radial-gradient(circle at 50% 18%, rgba(201, 162, 39, 0.2), transparent 44%),
    linear-gradient(145deg, #2a1f14 0%, #120d07 100%);
  color: #f5ead7;
  font-family: 'Playfair Display', serif;
  font-size: clamp(14px, 1.2vw, 20px);
  font-weight: 700;
  line-height: 1.15;
  text-align: center;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.65);
}

.book-card__fallback span {
  display: -webkit-box;
  overflow: hidden;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 6;
}

.book-card__shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(17, 12, 7, 0) 34%, rgba(8, 6, 4, 0.86) 100%);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
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
  opacity: 0;
  transform: translateY(6px);
  pointer-events: none;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.book-card:hover .book-card__shade,
.book-card:focus-visible .book-card__shade,
.book-card:hover .book-card__info,
.book-card:focus-visible .book-card__info {
  opacity: 1;
}

.book-card:hover .book-card__info,
.book-card:focus-visible .book-card__info {
  transform: translateY(0);
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
    column-gap: 16px;
    row-gap: 32px;
  }

  .book-card {
    flex-basis: calc((100% - (4 * 16px)) / 5);
  }
}

@media (max-width: 1080px) {
  .book-card {
    flex-basis: calc((100% - (2 * 16px)) / 3);
  }
}

@media (max-width: 760px) {
  .cards-panel {
    padding: 12px;
  }

  .cards-panel__scroll {
    column-gap: 14px;
    row-gap: 28px;
  }

  .book-card {
    flex-basis: calc((100% - 14px) / 2);
  }
}
</style>
