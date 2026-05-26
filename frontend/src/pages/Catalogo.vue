<script setup lang="ts">
import { onMounted, ref } from 'vue'
import BookSearchLayout from '@/components/BookSearchPage.vue'
import fundoImg from '@/assets/Fundo_Catalogo.jpg'
import { booksService, type CatalogBook, type CatalogResponse } from '@/services'

const filterGroups = [
  'Ordenar por', 'Gênero', 'Tipo', 'Editora', 'Autor', 'Ano'
]

const books = ref<CatalogBook[]>([])
const isLoading = ref(true)
const errorMessage = ref('')
const currentPage = ref(1)
const totalPages = ref(1)

const ITEMS_PER_PAGE = 20
const pageCache = new Map<number, CatalogResponse>()
const inFlightRequests = new Map<number, Promise<CatalogResponse>>()

let requestSerial = 0

function getTotalPages(totalItems: number) {
  return Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE))
}

function fetchCatalogPage(page: number) {
  const cachedResponse = pageCache.get(page)

  if (cachedResponse) {
    return Promise.resolve(cachedResponse)
  }

  const existingRequest = inFlightRequests.get(page)
  if (existingRequest) {
    return existingRequest
  }

  const request = booksService.listBooks({ limit: ITEMS_PER_PAGE, page })
    .then((response) => {
      pageCache.set(page, response)
      return response
    })
    .finally(() => {
      inFlightRequests.delete(page)
    })

  inFlightRequests.set(page, request)
  return request
}

function prefetchCatalogPage(page: number) {
  if (page <= 0 || pageCache.has(page) || inFlightRequests.has(page)) {
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
  />
</template>
