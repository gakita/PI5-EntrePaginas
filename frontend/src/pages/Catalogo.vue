<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Navbar from '@/components/Navbar.vue'
import FiltersPanel from '@/components/FiltersPanel.vue'
import BookCoversGrid from '@/components/BookCoversGrid.vue'
import CatalogGlow from '@/components/BackgroundGlow.vue'
import fundoImg from '@/assets/Fundo_Catalogo.jpg'
import { catalogService, type CatalogBook } from '@/services'

const filterGroups = [
  'Ordenar por',
  'Gênero',
  'Tipo',
  'Editora',
  'Autor',
  'Ano',
]

const backgroundImage = `url(${fundoImg})`
const books = ref<CatalogBook[]>([])
const isLoading = ref(true)
const errorMessage = ref('')

async function loadBooks() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const result = await catalogService.listBooks({ limit: 15 })
    books.value = result.items
  } catch (error) {
    errorMessage.value = error instanceof Error
      ? error.message
      : 'Nao foi possivel carregar o catalogo.'
  } finally {
    isLoading.value = false
  }
}

onMounted(loadBooks)
</script>

<template>
  <Navbar />

  <main class="catalog-page">
    <div class="catalog-page__bg" />

    <section class="catalog-page__content">
      <h1 class="catalog-page__title">Catálogo</h1>

      <div class="catalog-layout">
        <FiltersPanel :groups="filterGroups" />
        <div class="books-area">
          <CatalogGlow
            class="books-area__light"
            top="-155px"
            width="777px"
            height="777px"
            :opacity="0.8"
          />
          <p v-if="errorMessage" class="books-area__status">{{ errorMessage }}</p>
          <BookCoversGrid
            v-else
            class="books-area__grid"
            :books="books"
            :loading="isLoading"
            :total="15"
          />
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.catalog-page {
  position: relative;
  height: calc(100vh);
  background-color: #110c07;
  overflow: hidden;
}

.catalog-page__bg {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(rgba(17, 12, 7, 0.2), rgba(17, 12, 7, 0.2)), v-bind(backgroundImage);
  background-size: cover;
  background-position: center;
  opacity: 0.18;
  pointer-events: none;
}

.catalog-page__content {
  position: relative;
  z-index: 2;
  width: min(1820px, 100% - 96px);
  height: 100%;
  margin: 0 auto;
  padding: 44px 0 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.catalog-page__title {
  margin: 0 0 44px;
  font-family: 'Playfair Display', serif;
  font-size: clamp(38px, 4.4vw, 64px);
  font-weight: 700;
  line-height: 1;
  color: #e8d5b7;
  text-shadow: 0 6px 3px rgba(0, 0, 0, 0.25);
}

.catalog-layout {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 24px;
  align-items: stretch;
  flex: 1;
  min-height: 0;
}

.books-area {
  position: relative;
  min-height: 0;
}

.books-area__light {
  top: -155px;
  width: 777px;
  height: 777px;
}

.books-area__grid {
  position: relative;
  z-index: 1;
  height: 100%;
}

.books-area__status {
  position: relative;
  z-index: 1;
  min-height: 160px;
  margin: 0;
  padding: 30px 26px;
  border: 1px solid rgba(232, 213, 183, 0.25);
  border-radius: 15px;
  background: rgba(42, 31, 20, 0.75);
  color: #e8d5b7;
  font-family: 'Playfair Display', serif;
  font-size: 18px;
}

@media (max-width: 1400px) {
  .catalog-layout {
    grid-template-columns: 300px 1fr;
    gap: 20px;
  }

  .books-area__light {
    width: 640px;
    height: 640px;
    top: -120px;
  }
}

@media (max-width: 1080px) {
  .catalog-page {
    height: auto;
    min-height: calc(100vh - 94px);
    overflow: visible;
  }

  .catalog-page__content {
    height: auto;
    padding-top: 64px;
    padding-bottom: 64px;
  }

  .catalog-layout {
    grid-template-columns: 1fr;
    flex: initial;
  }

  .books-area__light {
    width: 640px;
    height: 640px;
    top: -90px;
  }
}

@media (max-width: 760px) {
  .catalog-page__content {
    width: min(1820px, 100% - 28px);
  }
}
</style>
