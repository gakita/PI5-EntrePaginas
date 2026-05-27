<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import BookSearchLayout from '@/components/BookSearchPage.vue'
import fundoImg from '@/assets/Fundo_Catalogo.jpg'
import { booksService, favoritesService, mergeCatalogBookData, type CatalogBook } from '@/services'
import type { BookFilters } from '@/components/FiltersPanel.vue'

const favFilters = [
  'Ordenar por', 'Gênero', 'Tipo', 'Editora', 'Autor', 'Ano',
]

const books = ref<CatalogBook[]>([])
const isLoading = ref(false)
const errorMessage = ref('')
const activeFilters = ref<BookFilters>({})

const filteredBooks = computed(() => {
  const filters = activeFilters.value
  const search = normalizeText(filters.search)
  const author = normalizeText(filters.author)
  const publisher = normalizeText(filters.publisher)
  const category = normalizeText(filters.category)
  const type = normalizeText(filters.type)

  const filtered = books.value.filter((book) => {
    const title = normalizeText(book.title)
    const bookAuthor = normalizeText(book.author)
    const bookType = normalizeText(book.type)
    const bookTags = [
      ...(book.genres || []),
      ...(book.categories || []),
    ].map(normalizeText)
    const publishedYear = getPublishedYear(book)

    if (search && !title.includes(search) && !bookAuthor.includes(search)) {
      return false
    }

    if (author && !bookAuthor.includes(author)) {
      return false
    }

    if (publisher) {
      return false
    }

    if (category && !bookTags.some((tag) => tag.includes(category))) {
      return false
    }

    if (type && bookType !== type) {
      return false
    }

    if (typeof filters.yearFrom === 'number' && (!publishedYear || publishedYear < filters.yearFrom)) {
      return false
    }

    if (typeof filters.yearTo === 'number' && (!publishedYear || publishedYear > filters.yearTo)) {
      return false
    }

    return true
  })

  return sortBooks(filtered, filters.orderBy)
})

function normalizeText(value?: string | null) {
  return value?.trim().toLowerCase() || ''
}

function getPublishedYear(book: CatalogBook) {
  const match = book.publishedDate?.match(/\d{4}/)
  return match ? Number(match[0]) : null
}

function sortBooks(items: CatalogBook[], orderBy?: BookFilters['orderBy']) {
  if (orderBy !== 'newest' && orderBy !== 'oldest') {
    return items
  }

  return [...items].sort((firstBook, secondBook) => {
    const firstYear = getPublishedYear(firstBook)
    const secondYear = getPublishedYear(secondBook)

    if (!firstYear && !secondYear) {
      return normalizeText(firstBook.title).localeCompare(normalizeText(secondBook.title))
    }

    if (!firstYear) {
      return 1
    }

    if (!secondYear) {
      return -1
    }

    return orderBy === 'newest'
      ? secondYear - firstYear
      : firstYear - secondYear
  })
}

async function loadFavorites() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const favorites = await favoritesService.listFavorites()
    books.value = favorites
    isLoading.value = false
    void enrichFavorites(favorites)
  } catch (error) {
    errorMessage.value = error instanceof Error
      ? error.message
      : 'Nao foi possivel carregar seus favoritos.'
    isLoading.value = false
  }
}

async function enrichFavorites(favorites: CatalogBook[]) {
  const enrichedBooks = await Promise.all(
    favorites.map(enrichFavorite),
  )

  books.value = enrichedBooks
}

async function enrichFavorite(favorite: CatalogBook) {
  if (!favorite.googleBooksId) {
    return favorite
  }

      try {
        const book = await booksService.getBookById(favorite.googleBooksId)
        const mergedBook = mergeCatalogBookData(favorite, book)

        return {
          ...mergedBook,
          googleBooksId: favorite.googleBooksId,
          title: favorite.title || mergedBook.title,
          author: favorite.author || mergedBook.author,
          coverUrl: favorite.coverUrl || mergedBook.coverUrl,
        }
      } catch {
        return favorite
      }
}

async function refreshMissingBookData(book: CatalogBook) {
  if (!book.googleBooksId || book.publishedDate) {
    return book
  }

  return enrichFavorite(book)
}

async function ensureMetadataForActiveFilters(filters: BookFilters) {
  const needsYearMetadata = typeof filters.yearFrom === 'number' ||
    typeof filters.yearTo === 'number' ||
    filters.orderBy === 'newest' ||
    filters.orderBy === 'oldest'

  if (!needsYearMetadata) {
    return
  }

  const booksMissingDates = books.value.filter((book) => !book.publishedDate)
  if (booksMissingDates.length === 0) {
    return
  }

  const refreshedBooks = await Promise.all(books.value.map(refreshMissingBookData))
  books.value = refreshedBooks
}

function applyFilters(filters: BookFilters) {
  activeFilters.value = { ...filters }
  void ensureMetadataForActiveFilters(filters)
}

onMounted(loadFavorites)
</script>

<template>
  <BookSearchLayout
    title="Favoritos"
    :filter-groups="favFilters"
    :background-image-url="fundoImg"
    :books="filteredBooks"
    :book-count="filteredBooks.length"
    :is-loading="isLoading"
    :error-message="errorMessage"
    @filters-change="applyFilters"
  />
</template>
