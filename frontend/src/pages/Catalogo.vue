<script setup lang="ts">
import { onMounted, ref } from 'vue'
import BookSearchLayout from '@/components/BookSearchPage.vue'
import fundoImg from '@/assets/Fundo_Catalogo.jpg'
import { booksService, type CatalogBook, type CatalogResponse, type ListBooksParams } from '@/services'
import type { BookFilters } from '@/components/FiltersPanel.vue'
import { getGenreSearchKey } from '@/utils/bookTaxonomy'

const filterGroups = [
  'Ordenar por', 'Gênero', 'Editora', 'Autor', 'Ano'
]

const books = ref<CatalogBook[]>([])
const isLoading = ref(true)
const errorMessage = ref('')
const currentPage = ref(1)
const totalPages = ref(1)
const activeFilters = ref<ListBooksParams>({})

const ITEMS_PER_PAGE = 20
const pageCache = new Map<string, CatalogResponse>()
const inFlightRequests = new Map<string, Promise<CatalogResponse>>()

let requestSerial = 0

function getTotalPages(totalItems: number) {
  return Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE))
}

function getRequestKey(page: number) {
  return JSON.stringify({ page, filters: activeFilters.value })
}

function fetchCatalogPage(page: number) {
  const requestKey = getRequestKey(page)
  const cachedResponse = pageCache.get(requestKey)

  if (cachedResponse) {
    return Promise.resolve(cachedResponse)
  }

  const existingRequest = inFlightRequests.get(requestKey)
  if (existingRequest) {
    return existingRequest
  }

  const request = booksService.listBooks({
    ...activeFilters.value,
    limit: ITEMS_PER_PAGE,
    page,
  })
    .then((response) => {
      pageCache.set(requestKey, response)
      return response
    })
    .finally(() => {
      inFlightRequests.delete(requestKey)
    })

  inFlightRequests.set(requestKey, request)
  return request
}

function prefetchCatalogPage(page: number) {
  const requestKey = getRequestKey(page)
  if (page <= 0 || pageCache.has(requestKey) || inFlightRequests.has(requestKey)) {
    return
  }

  void fetchCatalogPage(page).catch(() => {
    // Prefetch failures are ignored so they do not affect the visible page.
  })
}

async function loadPage(page: number) {
  const currentRequest = ++requestSerial
  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await fetchCatalogPage(page)

    if (currentRequest !== requestSerial) {
      return
    }

    books.value = response.items
    currentPage.value = page
    totalPages.value = getTotalPages(response.totalItems)

    prefetchCatalogPage(page + 1)
  } catch (error) {
    if (currentRequest !== requestSerial) {
      return
    }

    errorMessage.value = error instanceof Error
      ? error.message
      : 'Não foi possível carregar o catálogo agora.'
  } finally {
    if (currentRequest !== requestSerial) {
      return
    }

    isLoading.value = false
  }
}

function applyFilters(filters: BookFilters) {
  activeFilters.value = {
    ...filters,
    category: filters.category ? getGenreSearchKey(filters.category) : undefined,
  }
  pageCache.clear()
  inFlightRequests.clear()
  loadPage(1)
}

onMounted(() => {
  loadPage(1)
})
</script>

<template>
  <BookSearchLayout
    title="Catálogo"
    :filter-groups="filterGroups"
    :background-image-url="fundoImg"
    :book-count="ITEMS_PER_PAGE"
    :books="books"
    :is-loading="isLoading"
    :error-message="errorMessage"
    :current-page="currentPage"
    :total-pages="totalPages"
    @page-change="loadPage"
    @filters-change="applyFilters"
  />
</template>
