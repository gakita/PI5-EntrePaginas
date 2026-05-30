<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import BookSearchLayout from '@/components/BookSearchPage.vue'
import fundoImg from '@/assets/Fundo_Catalogo.jpg'
import {
  booksService,
  chatService,
  type BookRecommendation,
  type CatalogBook,
  type ListBooksParams,
} from '@/services'
import type { BookFilters } from '@/components/FiltersPanel.vue'
import {
  getBookSearchText,
  getGenreSearchKey,
  matchesBookGenre,
  normalizeTaxonomyText,
} from '@/utils/bookTaxonomy'

type UserPreferences = {
  genres: string[]
  types: string[]
  favoriteAuthors: string[]
}

const recommendationsFilters = [
  'Ordenar por', 'Gênero', 'Editora', 'Autor', 'Ano',
]

const pageSize = 15
const allRecommendations = ref<CatalogBook[]>([])
const preferences = ref<UserPreferences>({ genres: [], types: [], favoriteAuthors: [] })
const activeFilters = ref<BookFilters>({})
const currentPage = ref(1)
const isLoading = ref(false)
const errorMessage = ref('')

const fallbackSeeds = ['ficção', 'fantasia', 'romance']

function getPublishedYear(book: CatalogBook) {
  const match = book.publishedDate?.match(/\d{4}/)
  return match ? Number(match[0]) : null
}

function getBookKey(book: CatalogBook) {
  return normalizeTaxonomyText(book.googleBooksId || book.title)
}

function dedupeValidBooks(books: CatalogBook[]) {
  const seen = new Set<string>()
  const uniqueBooks: CatalogBook[] = []

  for (const book of books) {
    if (!book.googleBooksId) continue

    const key = getBookKey(book)
    if (!key || seen.has(key)) continue

    seen.add(key)
    uniqueBooks.push(book)
  }

  return uniqueBooks
}

function recommendationToCatalogBook(book: BookRecommendation): CatalogBook {
  return {
    googleBooksId: book.googleBooksId || null,
    title: book.title || null,
    author: book.author || book.authors?.join(', ') || null,
    authors: book.authors || (book.author ? [book.author] : []),
    type: book.type || 'livro',
    categories: book.categories || [],
    genres: book.genres || [],
    coverUrl: book.coverUrl || null,
    synopsis: book.synopsis || null,
    publishedDate: book.publishedDate || null,
    previewLink: book.previewLink || null,
    webReaderLink: book.webReaderLink || null,
    embeddable: Boolean(book.embeddable),
    viewability: book.viewability || null,
  }
}

function matchesYear(book: CatalogBook, filters: BookFilters) {
  const year = getPublishedYear(book)

  if (typeof filters.yearFrom !== 'number' && typeof filters.yearTo !== 'number') {
    return true
  }

  if (!year) return false
  if (typeof filters.yearFrom === 'number' && year < filters.yearFrom) return false
  if (typeof filters.yearTo === 'number' && year > filters.yearTo) return false
  return true
}

function buildPreferenceQueries(userPreferences: UserPreferences): ListBooksParams[] {
  const queries: ListBooksParams[] = []

  for (const genre of userPreferences.genres.slice(0, 4)) {
    queries.push({ search: getGenreSearchKey(genre), limit: 15 })
  }

  for (const author of userPreferences.favoriteAuthors.slice(0, 3)) {
    queries.push({ author, limit: 15 })
  }

  if (queries.length === 0) {
    return fallbackSeeds.map((search) => ({ search, limit: 15 }))
  }

  return queries
}

async function loadSavedSuggestions() {
  try {
    const response = await chatService.getSuggestions(20)
    return response.suggestions.map(recommendationToCatalogBook)
  } catch {
    return []
  }
}

const filteredRecommendations = computed(() => {
  const filters = activeFilters.value
  const search = normalizeTaxonomyText(filters.search)
  const author = normalizeTaxonomyText(filters.author)
  const publisher = normalizeTaxonomyText(filters.publisher)

  const filtered = allRecommendations.value.filter((book) => {
    const haystack = getBookSearchText(book)

    return (!search || haystack.includes(search)) &&
      (!author || normalizeTaxonomyText(book.author).includes(author)) &&
      (!publisher || haystack.includes(publisher)) &&
      matchesBookGenre(book, filters.category) &&
      matchesYear(book, filters)
  })

  if (filters.orderBy !== 'newest' && filters.orderBy !== 'oldest') {
    return filtered
  }

  return [...filtered].sort((firstBook, secondBook) => {
    const firstYear = getPublishedYear(firstBook) || 0
    const secondYear = getPublishedYear(secondBook) || 0
    return filters.orderBy === 'newest'
      ? secondYear - firstYear
      : firstYear - secondYear
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredRecommendations.value.length / pageSize)))

const visibleRecommendations = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredRecommendations.value.slice(start, start + pageSize)
})

const hasPreferences = computed(() =>
  preferences.value.genres.length > 0 ||
  preferences.value.types.length > 0 ||
  preferences.value.favoriteAuthors.length > 0,
)

const emptyMessage = computed(() => {
  if (allRecommendations.value.length === 0 && !hasPreferences.value) {
    return 'Converse com o chatbot e saia da tela para atualizar suas preferências.'
  }

  if (allRecommendations.value.length === 0) {
    return 'Não encontramos livros compatíveis com suas preferências agora.'
  }

  if (filteredRecommendations.value.length === 0) {
    return 'Nenhuma recomendação encontrada com esses filtros.'
  }

  return ''
})

async function loadRecommendations() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const loadedPreferences = await chatService.getPreferences()

    preferences.value = loadedPreferences
    const queries = buildPreferenceQueries(preferences.value)
    const [savedSuggestions, results] = await Promise.all([
      loadSavedSuggestions(),
      Promise.allSettled(
        queries.map((query) => booksService.listBooks({ ...query, limit: 15 })),
      ),
    ])

    allRecommendations.value = dedupeValidBooks(
      [
        ...savedSuggestions,
        ...results.flatMap((result) => result.status === 'fulfilled' ? result.value.items : []),
      ],
    )
    currentPage.value = 1
  } catch (error) {
    errorMessage.value = error instanceof Error
      ? error.message
      : 'Não foi possível carregar suas recomendações.'
  } finally {
    isLoading.value = false
  }
}

function handleFiltersChange(filters: BookFilters) {
  activeFilters.value = filters
  currentPage.value = 1
}

function handlePageChange(page: number) {
  currentPage.value = page
}

onMounted(loadRecommendations)
</script>

<template>
  <BookSearchLayout
    title="Recomendações"
    :filter-groups="recommendationsFilters"
    :background-image-url="fundoImg"
    :book-count="0"
    :books="visibleRecommendations"
    :is-loading="isLoading"
    :error-message="errorMessage"
    :loading-message="'Carregando recomendações...'"
    :empty-message="emptyMessage"
    :current-page="currentPage"
    :total-pages="totalPages"
    @filters-change="handleFiltersChange"
    @page-change="handlePageChange"
  />
</template>
