<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import BookSearchLayout from '@/components/BookSearchPage.vue'
import fundoImg from '@/assets/Fundo_Catalogo.jpg'
import { booksService, chatService, type CatalogBook, type ListBooksParams } from '@/services'
import type { BookFilters } from '@/components/FiltersPanel.vue'

type UserPreferences = {
  genres: string[]
  types: string[]
  favoriteAuthors: string[]
}

const recommendationsFilters = [
  'Ordenar por', 'Gênero', 'Tipo', 'Editora', 'Autor', 'Ano',
]

const pageSize = 15
const allRecommendations = ref<CatalogBook[]>([])
const preferences = ref<UserPreferences>({ genres: [], types: [], favoriteAuthors: [] })
const activeFilters = ref<BookFilters>({})
const currentPage = ref(1)
const isLoading = ref(false)
const errorMessage = ref('')

const categoryAliases: Record<string, string[]> = {
  comedy: ['comedy', 'humor', 'comédia', 'comedia'],
  terror: ['terror', 'horror'],
  romance: ['romance'],
  fantasy: ['fantasy', 'fantasia'],
  'science fiction': ['science fiction', 'sci-fi', 'ficção científica', 'ficcao cientifica'],
  adventure: ['adventure', 'aventura'],
}

const fallbackSeeds = ['ficção', 'fantasia', 'romance']

function normalizeText(value?: string | null) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function bookSearchText(book: CatalogBook) {
  return normalizeText([
    book.title,
    book.author,
    book.type,
    book.synopsis,
    ...(book.categories || []),
    ...(book.genres || []),
  ].filter(Boolean).join(' '))
}

function getPublishedYear(book: CatalogBook) {
  const match = book.publishedDate?.match(/\d{4}/)
  return match ? Number(match[0]) : null
}

function getBookKey(book: CatalogBook) {
  return normalizeText(book.googleBooksId || book.title)
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

function matchesCategory(book: CatalogBook, category?: string) {
  if (!category) return true

  const haystack = bookSearchText(book)
  const aliases = categoryAliases[category] || [category]
  return aliases.some((alias) => haystack.includes(normalizeText(alias)))
}

function matchesType(book: CatalogBook, type?: string) {
  if (!type) return true

  const normalizedType = normalizeText(type)
  const bookType = normalizeText(book.type)
  const haystack = bookSearchText(book)

  if (normalizedType === 'hq') {
    return bookType === 'hq' || haystack.includes('comics') || haystack.includes('quadrinho')
  }

  if (normalizedType === 'manga') {
    return bookType === 'manga' || haystack.includes('manga')
  }

  return bookType === normalizedType || haystack.includes(normalizedType)
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
    queries.push({ search: genre, limit: 15 })
  }

  for (const author of userPreferences.favoriteAuthors.slice(0, 3)) {
    queries.push({ author, limit: 15 })
  }

  if (queries.length === 0) {
    return fallbackSeeds.map((search) => ({ search, limit: 15 }))
  }

  return queries
}

const filteredRecommendations = computed(() => {
  const filters = activeFilters.value
  const search = normalizeText(filters.search)
  const author = normalizeText(filters.author)
  const publisher = normalizeText(filters.publisher)

  const filtered = allRecommendations.value.filter((book) => {
    const haystack = bookSearchText(book)

    return (!search || haystack.includes(search)) &&
      (!author || normalizeText(book.author).includes(author)) &&
      (!publisher || haystack.includes(publisher)) &&
      matchesCategory(book, filters.category) &&
      matchesType(book, filters.type) &&
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
    preferences.value = await chatService.getPreferences()
    const queries = buildPreferenceQueries(preferences.value)
    const results = await Promise.allSettled(
      queries.map((query) => booksService.listBooks({ ...query, limit: 15 })),
    )

    allRecommendations.value = dedupeValidBooks(
      results.flatMap((result) => result.status === 'fulfilled' ? result.value.items : []),
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
