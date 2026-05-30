<script setup lang="ts">
  import { computed, onMounted, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import fundoImg from '@/assets/Fundo_Catalogo.jpg'
  import Navbar from '@/components/Navbar.vue'
  import { catalogService, favoritesService, type CatalogBook } from '@/services'

  const route = useRoute()
  const router = useRouter()
  const isFavorite = ref(false)
  const isFavoriteLoading = ref(false)
  const book = ref<CatalogBook | null>(null)
  const isLoading = ref(false)
  const errorMessage = ref('')

  const bookId = computed(() => String(route.params.id || ''))
  const bookDetailsCacheKey = 'entre-paginas:book-details'
  const backgroundImage = `url(${fundoImg})`
  const coverImage = computed(() => `url(${book.value?.coverUrl || fundoImg})`)
  const title = computed(() => book.value?.title || 'Livro não encontrado')
  const author = computed(() => book.value?.author || 'Autor desconhecido')
  const synopsis = computed(() => book.value?.synopsis || 'Sinopse indisponível para este livro.')
  const externalLinkLabel = computed(() => (/^OL\d+W$/i.test(bookId.value) ? 'Open Library' : 'Google Books'))
  const primaryTags = computed(() => {
    const tags = [
      ...(book.value?.genres || []),
      ...(book.value?.categories || []),
    ]

    return Array.from(new Set(tags)).slice(0, 6)
  })
  const detailItems = computed(() => [
    { label: 'Autor', value: author.value },
    { label: 'Publicado', value: book.value?.publishedDate || 'Não informado' },
    { label: 'Tipo', value: book.value?.type || 'Livro' },
    { label: 'ID', value: bookId.value },
  ])

  async function loadBook() {
    if (!bookId.value) return

    isLoading.value = true
    errorMessage.value = ''

    try {
      book.value = await catalogService.getBookById(bookId.value)
      await loadFavoriteState()
    } catch (error) {
      const cachedBook = getCachedBook(bookId.value)

      if (cachedBook) {
        book.value = cachedBook
        await loadFavoriteState()
      } else {
        errorMessage.value = error instanceof Error
          ? error.message
          : 'Não foi possível carregar os dados do livro.'
        book.value = null
      }
    } finally {
      isLoading.value = false
    }
  }

  function getCachedBook(id: string) {
    try {
      const cachedBooks = JSON.parse(sessionStorage.getItem(bookDetailsCacheKey) || '{}')
      const cachedBook = cachedBooks[id]
      return cachedBook && typeof cachedBook === 'object'
        ? cachedBook as CatalogBook
        : null
    } catch {
      return null
    }
  }

  async function loadFavoriteState() {
    if (!bookId.value) return

    try {
      const favorites = await favoritesService.listFavorites()
      isFavorite.value = favorites.some((favorite) => favorite.googleBooksId === bookId.value)
    } catch {
      isFavorite.value = false
    }
  }

  async function toggleFavorite() {
    if (!book.value?.googleBooksId || !book.value.title || isFavoriteLoading.value) return

    isFavoriteLoading.value = true

    try {
      if (isFavorite.value) {
        await favoritesService.removeFavorite(book.value.googleBooksId)
        isFavorite.value = false
      } else {
        await favoritesService.addFavorite(book.value)
        isFavorite.value = true
      }
    } catch (error) {
      errorMessage.value = error instanceof Error
        ? error.message
        : 'Nao foi possivel atualizar seus favoritos.'
    } finally {
      isFavoriteLoading.value = false
    }
  }

  function openExternalLink(url?: string | null) {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  onMounted(loadBook)
  watch(bookId, loadBook)
</script>

<template>
  <Navbar />

  <main class="book-page">
    <div class="book-page__bg" />
    <div class="book-page__glow" />

    <section class="book-page__content">
      <button class="book-page__back" type="button" @click="router.back()">
        <v-icon icon="mdi-arrow-left" size="18" />
        Voltar
      </button>

      <div class="book-layout">
        <aside class="book-card">
          <div class="book-card__cover">
            <div class="book-card__cover-image" />
            <div class="book-card__cover-overlay" />
          </div>
          <div class="book-card__footer">
            <p class="book-card__author">{{ author }}</p>
            <h1 class="book-card__title">{{ title }}</h1>
            <button class="book-card__favorite" type="button" :disabled="isFavoriteLoading" @click="toggleFavorite">
              <v-icon
                :icon="isFavorite ? 'mdi-bookmark-remove' : 'mdi-bookmark-plus-outline'"
                size="18"
              />
              {{ isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos' }}
            </button>
          </div>
        </aside>

        <section class="book-panel">
          <div v-if="isLoading" class="book-panel__state">Carregando livro...</div>
          <div v-else-if="errorMessage" class="book-panel__state">{{ errorMessage }}</div>
          <template v-else>
            <h2 class="book-panel__title">Descrição</h2>
            <p class="book-panel__text">{{ synopsis }}</p>

            <dl class="book-panel__details">
              <div v-for="item in detailItems" :key="item.label">
                <dt>{{ item.label }}</dt>
                <dd>{{ item.value }}</dd>
              </div>
            </dl>

            <div class="book-panel__actions">
              <button
                v-if="book?.previewLink"
                class="book-panel__action"
                type="button"
                @click="openExternalLink(book.previewLink)"
              >
                <v-icon icon="mdi-book-open-page-variant-outline" size="18" />
                Preview
              </button>
              <button
                v-if="book?.webReaderLink"
                class="book-panel__action"
                type="button"
                @click="openExternalLink(book.webReaderLink)"
              >
                <v-icon icon="mdi-open-in-new" size="18" />
                {{ externalLinkLabel }}
              </button>
            </div>

            <div class="book-panel__meta">
              <div class="tag-group">
                <h3 class="tag-group__title">Tags:</h3>
                <div class="tag-group__list">
                  <span
                    v-for="tag in primaryTags"
                    :key="tag"
                    class="tag-chip"
                  >
                    <span class="tag-chip__label">{{ tag }}</span>
                  </span>
                  <span v-if="primaryTags.length === 0" class="tag-chip">
                    <span class="tag-chip__label">Sem tags</span>
                  </span>
                </div>
              </div>
            </div>
          </template>
        </section>
      </div>
    </section>
  </main>
</template>

<style scoped>
.book-page {
  --page-gutter-x: 32px;
  --page-gutter-top: 24px;
  --page-gutter-bottom: 42px;
  --page-back-height: 40px;
  --page-back-gap: 14px;
  position: relative;
  height: calc(100vh - 78px);
  background-color: #110c07;
  overflow: hidden;
}

.book-page__bg {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(17, 12, 7, 0.82), rgba(17, 12, 7, 0.82)),
    v-bind(backgroundImage);
  background-position: center;
  background-size: cover;
  opacity: 0.88;
  pointer-events: none;
}

.book-page__glow {
  position: absolute;
  top: 82px;
  right: 10%;
  width: 520px;
  height: 520px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(201, 162, 39, 0.16) 0%, rgba(201, 162, 39, 0.06) 36%, rgba(20, 151, 255, 0.05) 62%, transparent 74%);
  filter: blur(12px);
  pointer-events: none;
}

.book-page__content {
  position: relative;
  z-index: 1;
  width: min(1820px, calc(100% - (var(--page-gutter-x) * 2)));
  height: 100%;
  margin: 0 auto;
  padding: var(--page-gutter-top) 0 var(--page-gutter-bottom);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.book-page__back {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  width: fit-content;
  gap: 8px;
  min-height: var(--page-back-height);
  margin-bottom: var(--page-back-gap);
  padding: 0;
  border: 0;
  background: transparent;
  color: #c9a227;
  font-family: 'Playfair Display', serif;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  transition: color 0.18s ease, transform 0.18s ease;
}

.book-page__back:hover {
  color: #e3be46;
  transform: translateX(-2px);
}

.book-page__back:focus-visible,
.book-card__favorite:focus-visible {
  outline: 2px solid rgba(201, 162, 39, 0.8);
  outline-offset: 4px;
}

.book-layout {
  display: grid;
  grid-template-columns: 420px minmax(0, 1fr);
  gap: 32px;
  align-items: stretch;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.book-card {
  position: relative;
  height: 100%;
  min-height: 0;
  border-radius: 12px;
  border: 1px solid rgba(232, 213, 183, 0.08);
  box-shadow: 0 22px 40px rgba(0, 0, 0, 0.34);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.book-card__cover {
  position: absolute;
  inset: 0;
}

.book-card__cover-image {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(18, 12, 7, 0.08), rgba(18, 12, 7, 0.18)),
    v-bind(coverImage);
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
  transition: transform 0.22s ease, filter 0.22s ease;
}

.book-card__cover-overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(5, 4, 3, 0.02) 0%, rgba(5, 4, 3, 0.08) 42%, rgba(8, 6, 4, 0.72) 100%);
  opacity: 1;
  transition: opacity 0.18s ease;
  pointer-events: none;
}

.book-card:hover .book-card__cover-overlay {
  opacity: 1;
}

.book-card:hover .book-card__cover-image {
  filter: brightness(0.78);
  transform: scale(1.01);
}

.book-card__footer {
  position: relative;
  z-index: 1;
  margin-top: auto;
  padding: 18px 18px 18px;
  background: linear-gradient(180deg, rgba(17, 12, 7, 0) 0%, rgba(17, 12, 7, 0.78) 28%, rgba(17, 12, 7, 0.94) 100%);
}

.book-card__title {
  margin: 0 0 10px;
  color: #e8d5b7;
  font-family: 'Playfair Display', serif;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.12;
  text-wrap: balance;
}

.book-card__author {
  margin: 0 0 6px;
  color: #c9a227;
  font-family: 'Playfair Display', serif;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.15;
}

.book-card__favorite {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #c9a227;
  font-family: 'Playfair Display', serif;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: color 0.18s ease, opacity 0.18s ease;
}

.book-card__favorite:hover {
  color: #e3be46;
  opacity: 0.9;
}

.book-card__favorite:disabled {
  cursor: progress;
  opacity: 0.65;
}

.book-panel {
  height: 100%;
  min-height: 0;
  padding: 16px 22px 20px;
  border: 1px solid rgba(232, 213, 183, .25);
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(43, 31, 20, 0.8), rgba(31, 22, 14, 0.74));
  box-shadow: inset 0 0 0 1px rgba(20, 151, 255, 0.08), 0 18px 32px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(4px);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: rgba(201, 162, 39, 0.72) transparent;
}

.book-panel::-webkit-scrollbar {
  width: 10px;
}

.book-panel::-webkit-scrollbar-track {
  background: transparent;
}

.book-panel::-webkit-scrollbar-thumb {
  background-color: rgba(201, 162, 39, 0.72);
  border-radius: 999px;
  border: 2px solid transparent;
  background-clip: padding-box;
}

.book-panel::-webkit-scrollbar-thumb:hover {
  background-color: rgba(216, 182, 74, 0.9);
}

.book-panel__title {
  margin: 0 0 8px;
  color: #e8d5b7;
  font-family: 'Playfair Display', serif;
  font-size: 26px;
  font-weight: 700;
  line-height: 1.08;
}

.book-panel__text {
  max-width: 780px;
  margin: 0;
  color: #e8d5b7;
  font-family: 'Playfair Display', serif;
  font-size: 17px;
  line-height: 1.5;
  text-wrap: pretty;
}

.book-panel__state {
  min-height: 180px;
  display: grid;
  place-items: center;
  color: #e8d5b7;
  font-family: 'Playfair Display', serif;
  font-size: 20px;
  text-align: center;
}

.book-panel__details {
  max-width: 900px;
  margin: 22px 0 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 18px;
}

.book-panel__details div {
  min-width: 0;
  padding: 12px 0;
  border-bottom: 1px solid rgba(232, 213, 183, 0.18);
}

.book-panel__details dt {
  margin: 0 0 4px;
  color: #c9a227;
  font-family: 'Playfair Display', serif;
  font-size: 13px;
  font-weight: 700;
}

.book-panel__details dd {
  margin: 0;
  color: #e8d5b7;
  font-family: 'Playfair Display', serif;
  font-size: 16px;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.book-panel__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 22px;
}

.book-panel__action {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  padding: 0 16px;
  border: 1px solid rgba(201, 162, 39, 0.5);
  border-radius: 999px;
  background: rgba(18, 13, 7, 0.36);
  color: #f0dfbd;
  font-family: 'Playfair Display', serif;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: border-color 0.18s ease, color 0.18s ease, transform 0.18s ease;
}

.book-panel__action:hover {
  border-color: rgba(227, 190, 70, 0.8);
  color: #e3be46;
  transform: translateY(-1px);
}

.book-panel__meta {
  margin-top: auto;
  padding-top: 24px;
  display: grid;
  gap: 10px;
}

.tag-group__title {
  margin: 0 0 10px;
  color: #e8d5b7;
  font-family: 'Playfair Display', serif;
  font-size: 20px;
  font-weight: 700;
}

.tag-group__list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  min-width: 94px;
  min-height: 30px;
  padding: 0 22px;
  border: 1px solid rgba(232, 213, 183, 0.3);
  border-radius: 999px;
  color: #f0dfbd;
  font-family: 'Playfair Display', serif;
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
  background: linear-gradient(180deg, rgba(34, 24, 14, 0.82), rgba(23, 16, 8, 0.88));
  box-shadow:
    inset 0 1px 0 rgba(255, 244, 220, 0.08),
    inset 0 -1px 0 rgba(0, 0, 0, 0.28),
    inset 0 0 0 1px rgba(255, 244, 220, 0.04),
    0 6px 14px rgba(0, 0, 0, 0.12);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  overflow: hidden;
  transition:
    transform 0.28s ease,
    box-shadow 0.28s ease,
    border-color 0.28s ease,
    background 0.28s ease;
}

.tag-chip::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background:
    radial-gradient(62% 90% at 10% 20%, rgba(240, 223, 189, 0.26) 0%, transparent 55%),
    radial-gradient(62% 90% at 90% 20%, rgba(240, 223, 189, 0.18) 0%, transparent 55%),
    radial-gradient(62% 90% at 12% 82%, rgba(240, 223, 189, 0.14) 0%, transparent 55%),
    radial-gradient(62% 90% at 88% 82%, rgba(240, 223, 189, 0.24) 0%, transparent 55%),
    linear-gradient(
      140deg,
      rgba(240, 223, 189, 0.22) 0%,
      rgba(240, 223, 189, 0.06) 28%,
      rgba(240, 223, 189, 0.02) 52%,
      rgba(240, 223, 189, 0.14) 76%,
      rgba(240, 223, 189, 0.26) 100%
    );
  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
  animation: tagBorderPulse 3.8s ease-in-out infinite;
}

.tag-chip__label {
  position: relative;
  z-index: 1;
  text-shadow:
    0 0 6px rgba(240, 223, 189, 0.08),
    0 1px 0 rgba(0, 0, 0, 0.35);
  animation: tagTextGlow 3.8s ease-in-out infinite;
}

.tag-chip:hover {
  transform: translateY(-1px);
  border-color: rgba(240, 223, 189, 0.42);
  background: linear-gradient(180deg, rgba(37, 26, 15, 0.88), rgba(24, 17, 9, 0.92));
  box-shadow:
    inset 0 1px 0 rgba(255, 244, 220, 0.1),
    inset 0 -1px 0 rgba(0, 0, 0, 0.32),
    inset 0 0 0 1px rgba(255, 244, 220, 0.05),
    0 8px 18px rgba(0, 0, 0, 0.16);
}

.tag-chip:active {
  transform: translateY(1px);
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.36),
    inset 0 0 0 1px rgba(255, 244, 220, 0.04),
    0 4px 10px rgba(0, 0, 0, 0.12);
}

@keyframes tagBorderPulse {
  0%, 100% {
    opacity: 0.72;
    filter: brightness(0.96);
  }

  50% {
    opacity: 1;
    filter: brightness(1.12);
  }
}

@keyframes tagTextGlow {
  0%, 100% {
    text-shadow:
      0 0 6px rgba(240, 223, 189, 0.08),
      0 1px 0 rgba(0, 0, 0, 0.35);
  }

  50% {
    text-shadow:
      0 0 10px rgba(240, 223, 189, 0.16),
      0 1px 0 rgba(0, 0, 0, 0.35);
  }
}

@media (prefers-reduced-motion: reduce) {
  .tag-chip,
  .tag-chip::before,
  .tag-chip::after,
  .tag-chip__label {
    animation: none;
    transition: none;
  }
}

@media (max-width: 1080px) {
  .book-page {
    height: auto;
    min-height: calc(100vh - 78px);
    overflow: visible;
  }

  .book-page__glow {
    right: auto;
    left: 50%;
    transform: translateX(-50%);
    width: 460px;
    height: 460px;
  }

  .book-page__content {
    width: min(calc(100% - (var(--page-gutter-x) * 2)), 920px);
    height: auto;
    padding-bottom: 48px;
  }

  .book-layout {
    grid-template-columns: 1fr;
    gap: 22px;
    overflow: visible;
  }

  .book-card {
    max-width: 380px;
  }

  .book-panel__meta {
    margin-top: 0;
    padding-top: 32px;
  }

  .book-panel {
    height: auto;
    overflow: visible;
  }
}

@media (max-width: 760px) {
  .book-page {
    --page-gutter-x: 12px;
    --page-gutter-top: 18px;
    --page-gutter-bottom: 28px;
  }

  .book-page__content {
    width: min(calc(100% - (var(--page-gutter-x) * 2)), 920px);
    padding-top: 18px;
  }

  .book-page__glow {
    top: 120px;
    width: 320px;
    height: 320px;
  }

  .book-card {
    max-width: none;
  }

  .book-panel {
    padding: 18px 16px 20px;
  }

  .book-panel__title {
    font-size: 24px;
  }

  .book-panel__text {
    font-size: 16px;
  }

  .book-panel__details {
    grid-template-columns: 1fr;
  }

  .book-panel__meta {
    padding-top: 24px;
  }
}
</style>
