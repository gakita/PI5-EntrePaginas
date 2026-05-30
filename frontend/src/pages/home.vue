<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '@/components/Navbar.vue'
import fundoImg from '@/assets/FUNDO.png'

const heroSearch = ref('')

const categories = [
  { label: 'Ficção',  image: '' },
  { label: 'Terror',  image: '' },
  { label: 'Romance', image: '' },
]

const categorySearch = ref('')
const activeCategory  = ref('Ficção')

const categoriesSection = ref<HTMLElement | null>(null)

const router = useRouter()

function goToQuiz() {
  router.push('/quiz')
}
</script>

<template>
  <Navbar />

  <!-- Hero -->
  <section class="hero" :style="{ '--fundo': `url(${fundoImg})` }">
    <div class="hero__light" />

    <div class="hero__content">
      <div class="hero__icon">
        <v-icon>mdi-lightning-bolt-circle</v-icon>
      </div>

      <h1 class="hero__title">Descubra sua</h1>
      <h1 class="hero__title hero__title--accent">próxima leitura</h1>

      <p class="hero__tagline">
        Encontrar filmes e séries é fácil. Agora, encontrar livros, mangás, HQs e artigos também é.
      </p>

      <div class="hero__search">
        <v-icon class="hero__search-icon">mdi-creation</v-icon>
        <input
          v-model="heroSearch"
          type="text"
          placeholder="Faça uma pergunta sobre o seu livro ideal..."
        />
      </div>

      <div class="hero__ctas">
        <button class="cta-primary" @click="goToQuiz">
          <v-icon>mdi-magnify</v-icon>
          Faça um quiz de recomendações
        </button>
        <button class="cta-secondary">
          Ir para última conversa
        </button>
      </div>
    </div>
  </section>

  <!-- Categorias -->
  <section ref="categoriesSection" class="categories" :style="{ '--fundo': `url(${fundoImg})` }">
    <div class="categories__fade-in" />
    <div class="categories__light" />

    <div class="categories__content">
      <div class="categories__icon">
        <v-icon>mdi-lightning-bolt-circle</v-icon>
      </div>

      <h2 class="categories__title">Categorias</h2>

      <p class="categories__subtitle">
        Escolha categorias para te ajudar a procurar pelo livro perfeito!
      </p>

      <div class="categories__search-wrap">
        <v-icon class="categories__search-icon">mdi-creation</v-icon>
        <span class="categories__chip">
          <v-icon size="12">mdi-close</v-icon>
          {{ activeCategory }}
        </span>
        <input
          v-model="categorySearch"
          type="text"
          placeholder="Faça uma pergunta sobre o seu livro ideal..."
        />
        <button class="categories__send">
          <v-icon>mdi-send</v-icon>
        </button>
      </div>

      <div class="categories__cards">
        <div
          v-for="category in categories"
          :key="category.label"
          class="category-card"
        >
          <div class="category-card__image" />
          <span class="category-card__label">{{ category.label }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* ─── Hero ─────────────────────────────────────────── */

.hero {
  position: relative;
  background-color: #110c07;
  overflow: hidden;
  padding-bottom: 120px;
}

.hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: var(--fundo);
  background-size: cover;
  background-position: center;
  opacity: 0.15;
  pointer-events: none;
}

/* Gradiente inferior — fade para a seção seguinte */
.hero::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 270px;
  background: linear-gradient(to bottom, rgba(17, 12, 7, 0) 0%, #110c07 100%);
  pointer-events: none;
}

.hero__light {
  position: absolute;
  top: 195px;
  left: 50%;
  transform: translateX(-50%);
  width: 777px;
  height: 777px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(201, 162, 39, 0.18) 0%, rgba(201, 162, 39, 0.04) 50%, transparent 70%);
  pointer-events: none;
}

.hero__content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 80px;
  gap: 0;
}

.hero__icon {
  color: #c9a227;
  font-size: 40px;
  margin-bottom: 20px;
}

.hero__title {
  font-family: "Playfair Display", serif;
  font-size: 87px;
  font-weight: 700;
  line-height: 1.1;
  text-align: center;
  letter-spacing: -2.18px;
  color: #e8d5b7;
  text-shadow: 0px 6px 3px rgba(0, 0, 0, 0.25);
  margin: 0;
}

.hero__title--accent {
  font-style: italic;
  color: #c9a227;
  margin-bottom: 40px;
}

.hero__tagline {
  font-family: "Playfair Display", serif;
  font-size: 24px;
  font-weight: 400;
  line-height: 1.4;
  text-align: center;
  color: #9b8a75;
  max-width: 836px;
  text-shadow: 0px 6px 3px rgba(0, 0, 0, 0.25);
  margin: 0 0 48px;
  padding-inline: 16px;
}

/* ─── Hero Search ───────────────────────────────────── */

.hero__search {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  max-width: 804px;
  height: 66px;
  background-color: #2a1f14;
  border: 2px solid rgba(232, 213, 183, 0.25);
  border-radius: 25px;
  padding-inline: 20px;
  box-shadow: 0px 6px 4px 0px rgba(0, 0, 0, 0.25);
  margin-bottom: 24px;
}

.hero__search-icon {
  color: #c9a227;
  flex-shrink: 0;
}

.hero__search input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-family: "Playfair Display", serif;
  font-size: 20px;
  font-weight: 400;
  color: #e8d5b7;
  caret-color: #c9a227;
}

.hero__search input::placeholder {
  color: #7a6b5d;
}

/* ─── Hero CTAs ─────────────────────────────────────── */

.hero__ctas {
  display: flex;
  align-items: center;
  gap: 0;
}

.cta-primary,
.cta-secondary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 78px;
  font-family: "Playfair Display", serif;
  font-size: 18px;
  font-weight: 400;
  letter-spacing: 0.5px;
  cursor: pointer;
  border: none;
  box-shadow: 0px 6px 4px 0px rgba(0, 0, 0, 0.25);
  transition: opacity 0.2s ease;
}

.cta-primary:hover,
.cta-secondary:hover {
  opacity: 0.85;
}

.cta-primary {
  background-color: #c9a227;
  color: #1a120b;
  padding-inline: 28px;
  width: 350px;
}

.cta-secondary {
  background-color: #17120d;
  color: #c9a227;
  border: 2px solid rgba(232, 213, 183, 0.25);
  padding-inline: 28px;
  width: 261px;
}

/* ─── Categories ────────────────────────────────────── */

.categories {
  position: relative;
  background-color: #110c07;
  overflow: hidden;
  padding-bottom: 120px;
}

.categories::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: var(--fundo);
  background-size: cover;
  background-position: center;
  opacity: 0.15;
  pointer-events: none;
}

/* overlay escuro sobre o fundo */
.categories::after {
  content: '';
  position: absolute;
  inset: 0;
  background-color: rgba(21, 14, 8, 0.5);
  pointer-events: none;
}

/* gradiente de entrada — fade vindo do hero */
.categories__fade-in {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 270px;
  background: linear-gradient(to bottom, #110c07 0%, rgba(17, 12, 7, 0) 100%);
  z-index: 1;
  pointer-events: none;
}

.categories__light {
  position: absolute;
  top: 132px;
  left: 50%;
  transform: translateX(-50%);
  width: 777px;
  height: 777px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(201, 162, 39, 0.18) 0%, rgba(201, 162, 39, 0.04) 50%, transparent 70%);
  z-index: 1;
  pointer-events: none;
}

.categories__content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 80px;
}

.categories__icon {
  color: #c9a227;
  font-size: 40px;
  margin-bottom: 20px;
}

.categories__title {
  font-family: "Playfair Display", serif;
  font-size: 87px;
  font-weight: 700;
  line-height: 1.1;
  color: #e8d5b7;
  text-shadow: 0px 6px 3px rgba(0, 0, 0, 0.25);
  margin: 0 0 16px;
}

.categories__subtitle {
  font-family: "Playfair Display", serif;
  font-size: 24px;
  font-weight: 400;
  color: #9b8a75;
  text-align: center;
  margin: 0 0 56px;
}

/* ─── Category Cards ────────────────────────────────── */

.categories__cards {
  display: flex;
  gap: 65px;
  overflow-x: auto;
  padding-inline: 65px;
  padding-bottom: 8px;
  scrollbar-width: none;
  width: 100%;
  box-sizing: border-box;
}

.categories__cards::-webkit-scrollbar {
  display: none;
}

.category-card {
  position: relative;
  flex-shrink: 0;
  width: 477px;
  height: 283px;
  border-radius: 25px;
  overflow: hidden;
  cursor: pointer;
}

.category-card__image {
  position: absolute;
  inset: 0;
  background-color: #2a1f14;
  opacity: 0.4;
  border-radius: 25px;
}

.category-card__label {
  position: absolute;
  bottom: 24px;
  left: 30px;
  font-family: "Playfair Display", serif;
  font-size: 48px;
  font-weight: 600;
  color: #ffffff;
  line-height: 1;
  text-shadow: 0px 2px 8px rgba(0, 0, 0, 0.5);
}

/* ─── Categories Search ─────────────────────────────── */

.categories__search-wrap {
  margin-bottom: 56px;
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  max-width: 804px;
  height: 66px;
  background-color: #2a1f14;
  border: 2px solid rgba(232, 213, 183, 0.25);
  border-radius: 25px;
  padding-inline: 20px;
  box-shadow: 0px 6px 4px 0px rgba(0, 0, 0, 0.25);
}

.categories__search-icon {
  color: #c9a227;
  flex-shrink: 0;
}

.categories__chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background-color: rgba(201, 162, 39, 0.15);
  border: 1px solid rgba(201, 162, 39, 0.4);
  border-radius: 20px;
  padding: 2px 10px;
  font-family: "Playfair Display", serif;
  font-size: 14px;
  color: #c9a227;
  flex-shrink: 0;
  cursor: pointer;
}

.categories__search-wrap input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-family: "Playfair Display", serif;
  font-size: 20px;
  color: #e8d5b7;
  caret-color: #c9a227;
  min-width: 0;
}

.categories__search-wrap input::placeholder {
  color: #7a6b5d;
}

.categories__send {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #c9a227;
  flex-shrink: 0;
  padding: 4px;
  transition: opacity 0.2s ease;
}

.categories__send:hover {
  opacity: 0.7;
}


</style>
