<script setup lang="ts">
import Navbar from '@/components/Navbar.vue'
import FiltersPanel from '@/components/FiltersPanel.vue'
import BookCoversGrid from '@/components/BookCoversGrid.vue'
import CatalogGlow from '@/components/BackgroundGlow.vue'
import fundoImg from '@/assets/Fundo_Catalogo.jpg'

const props = defineProps<{
  title: string
  filterGroups: string[]
  backgroundImageUrl: string
  bookCount: number // O total de livros para o grid
}>()

const backgroundImage = `url(${fundoImg})`

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
          
          <!-- Caso a gente quiser permitir conteúdo a mais em uma página, em comentário atualmente pois não vamos usar atualmente -->
          <!-- <slot name="extra-content"></slot> -->

          <!-- 
            Usar isso na página em si caso for adicionar condeúdo extra em uma página específica
            <template #extra-content>
      
            </template> -->
          
          <BookCoversGrid class="books-area__grid" :total="bookCount" />
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