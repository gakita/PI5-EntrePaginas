<script setup lang="ts">
import BookSearchLayout from '@/components/BookSearchPage.vue'
import fundoImg from '@/assets/Fundo_Catalogo.jpg'

const recommendationsFilters = [
  'Ordenar por', 'Gênero', 'Tipo', 'Editora', 'Autor', 'Ano'
]
</script>

<template>
    <!-- book-count é temporário -->
  <BookSearchLayout
    title="Recomendações"
    :filter-groups="recommendationsFilters"
    :background-image-url="fundoImg"
    :book-count="100" 
  />
</template>