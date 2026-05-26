<script setup lang="ts">
import Navbar from '@/components/Navbar.vue'
import FiltersPanel from '@/components/FiltersPanel.vue'
import BookCoversGrid from '@/components/BookCoversGrid.vue'
import CatalogGlow from '@/components/BackgroundGlow.vue'
import type { CatalogBook } from '@/services'

const props = defineProps<{
  title: string
  filterGroups: string[]
  backgroundImageUrl: string
  bookCount?: number
  books?: CatalogBook[]
  isLoading?: boolean
  errorMessage?: string
  currentPage?: number
  totalPages?: number
}>()

const emit = defineEmits<{
  pageChange: [page: number]
}>()

const backgroundImage = `url(${props.backgroundImageUrl})`

</script>

<template>
  <Navbar />
  <main class="catalog-page">
    <div class="catalog-page__bg" :style="{ backgroundImage }" />

    <section class="catalog-page__content">
      <div class="catalog-layout">
        <!-- O painel de filtros recebe os dados dinamicamente -->
        <FiltersPanel :groups="filterGroups" :title="title" />
        
        <div class="books-area">
          <CatalogGlow
            class="books-area__light"
            top="-100px" width="777px" height="777px" :opacity="0.8"
          />

            <div v-if="errorMessage" class="books-area__status books-area__status--error">
              {{ errorMessage }}
            </div>

            <div v-else-if="isLoading" class="books-area__status">
              Carregando livros do catálogo...
            </div>
          
          <BookCoversGrid
            class="books-area__grid"
            :books="books"
            :total="bookCount ?? 15"
            :current-page="currentPage"
            :total-pages="totalPages"
            @page-change="(page) => emit('pageChange', page)"
          />
          <!-- <slot name="extra-content"></slot> -->

          <!-- 
            Usar isso na página em si caso for adicionar condeúdo extra em uma página específica
            <template #extra-content>
      
            </template> -->
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.catalog-page {
  position: relative;
  height: calc(100vh - 65px);
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
  padding: 20px 0 16px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.catalog-layout {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 22px;
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

.books-area__status {
  position: absolute;
  z-index: 3;
  top: 18px;
  right: 18px;
  padding: 10px 14px;
  border-radius: 12px;
  background: rgba(42, 31, 20, 0.92);
  border: 1px solid rgba(232, 213, 183, 0.22);
  color: #e8d5b7;
  font-size: 14px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.books-area__status--error {
  color: #ffd1d1;
  border-color: rgba(255, 120, 120, 0.28);
}

@media (max-width: 1400px) {
  .catalog-layout {
    grid-template-columns: 300px 1fr;
    gap: 16px;
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
    padding-top: 40px;
    padding-bottom: 40px;
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