<script setup lang="ts">
import BookSearchLayout from '@/components/BookSearchPage.vue'
import fundoImg from '@/assets/Fundo_Catalogo.jpg'

const favFilters = [
  'Ordenar por', 'Gênero', 'Tipo', 'Editora', 'Autor', 'Ano' //Ver depois se a gente vai adicionar mais filtros pra página de favoritos em específico, como Data de Adição ou algo assim
]
</script>

<template>
    <!-- book-count é temporário -->
  <BookSearchLayout
    title="Favoritos"
    :filter-groups="favFilters"
    :background-image-url="fundoImg"
    :book-count="9" 
  />
</template>