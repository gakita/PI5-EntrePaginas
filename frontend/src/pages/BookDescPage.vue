<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import fundoImg from '@/assets/Fundo_Catalogo.jpg'
  import Navbar from '@/components/Navbar.vue'

  const route = useRoute()
  const router = useRouter()
  const isFavorite = ref(false)

  const bookId = computed(() => route.params.id)
  const backgroundImage = `url(${fundoImg})`
  const coverImage = `url(${fundoImg})`

  const primaryTags = ['Comedia', 'Terror', 'Romance', 'ETC']
  const suggestedTags = ['Comedia', 'Terror', 'Romance']
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
            <h1 class="book-card__title">Nome do livro {{ bookId }}</h1>
            <button class="book-card__favorite" type="button" @click="isFavorite = !isFavorite">
              <v-icon
                :icon="isFavorite ? 'mdi-bookmark-remove' : 'mdi-bookmark-plus-outline'"
                size="18"
              />
              {{ isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos' }}
            </button>
          </div>
        </aside>

        <section class="book-panel">
          <h2 class="book-panel__title">Descricao</h2>
          <p class="book-panel__text">
            Lorem ipsum dolor sit amet consectetur. Habitant a ultrices tortor egestas.
            Cursus risus id egestas tincidunt pellentesque id est quam. Dui elit vitae
            fusce sit elit nec arcu. Tempus viverra at diam quis adipiscing arcu. Mi
            rutrum laoreet integer quis sed ultrices aliquet. Auctor erat gravida neque
            pellentesque iaculis proin lectus tempor. Sapien arcu mauris quis tortor
            nulla quis. In senectus posuere non nunc ut. Pulvinar vitae adipiscing diam
            mauris sit.
          </p>

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
              </div>
            </div>

            <div class="tag-group">
              <h3 class="tag-group__title">Tags recomendadas:</h3>
              <div class="tag-group__list">
                <span
                  v-for="tag in suggestedTags"
                  :key="`suggested-${tag}`"
                  class="tag-chip"
                >
                  <span class="tag-chip__label">{{ tag }}</span>
                </span>
              </div>
            </div>
          </div>
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
  align-items: start;
  flex: 1;
  min-height: 0;
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
  }

  .book-card {
    max-width: 380px;
  }

  .book-panel__meta {
    margin-top: 0;
    padding-top: 32px;
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

  .book-panel__meta {
    padding-top: 24px;
  }
}
</style>
