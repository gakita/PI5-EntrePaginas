<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '@/components/Navbar.vue'
import fundoImg from '@/assets/FUNDO.png'

const heroSearch = ref('')
const selectedGenre = ref('')
const genres = ['Ficção', 'Terror', 'Romance', 'Aventura', 'Fantasia']

const router = useRouter()
const chatbotRoute = import.meta.env.VITE_CHATBOT_ROUTE || '/chatbot'

function goToQuiz() {
  router.push('/quiz')
}

function goToLastConversation() {
  router.push(chatbotRoute)
}

function selectGenre(genre: string) {
  selectedGenre.value = genre
}

function removeFilter() {
  selectedGenre.value = ''
}

function startNewConversation() {
  const prompt = heroSearch.value.trim()
  if (!prompt) return

  router.push({
    path: chatbotRoute,
    query: {
      prompt,
      ...(selectedGenre.value ? { genre: selectedGenre.value } : {}),
    },
  })
}

function handleSearchKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    startNewConversation()
  }
}
</script>

<template>
  <Navbar />

  <!-- Hero -->
  <section class="hero" :style="{ '--fundo': `url(${fundoImg})` }">
    <div class="hero__light" />

    <div class="hero__content">
      <div class="hero__icon">
        <v-icon>mdi-lightbulb-on</v-icon>
      </div>

      <h1 class="hero__title">Descubra sua</h1>
      <h1 class="hero__title hero__title--accent">próxima leitura</h1>

      <p class="hero__tagline">
        Encontrar filmes e séries é fácil. Agora, encontrar livros, mangás, HQs e artigos também é.
      </p>

      <div class="hero__search">
        <v-icon class="hero__search-icon">mdi-creation</v-icon>

        <div v-if="selectedGenre" class="filter-tag">
          <button class="remove-filter" @click="removeFilter">
            <v-icon size="14">mdi-close</v-icon>
          </button>
          {{ selectedGenre }}
        </div>

        <v-menu v-else location="top start" transition="fade-transition">
          <template #activator="{ props }">
            <button class="add-filter-btn" v-bind="props">
              <v-icon size="18">mdi-filter-variant</v-icon>
              Filtros
            </button>
          </template>

          <v-list class="filter-menu">
            <v-list-item
              v-for="genre in genres"
              :key="genre"
              class="filter-menu-item"
              @click="selectGenre(genre)"
            >
              <v-list-item-title>{{ genre }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>

        <input
          v-model="heroSearch"
          type="text"
          placeholder="Faça uma pergunta sobre o seu livro ideal..."
          @keydown="handleSearchKeydown"
        />

        <button
          class="send-btn"
          :disabled="!heroSearch.trim()"
          @click="startNewConversation"
        >
          <v-icon>mdi-send</v-icon>
        </button>
      </div>

      <div class="hero__ctas">
        <button class="cta-primary" @click="goToQuiz">
          <v-icon>mdi-magnify</v-icon>
          Faça um quiz de recomendações
        </button>
        <button class="cta-secondary" @click="goToLastConversation">
          Ir para última conversa
        </button>
      </div>
    </div>
  </section>

</template>

<style scoped>
/* ─── Hero ─────────────────────────────────────────── */

.hero {
  position: relative;
  height: calc(100vh - 65px);
  background-color: #110c07;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28px 24px;
  box-sizing: border-box;
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
  height: 220px;
  background: linear-gradient(to bottom, rgba(17, 12, 7, 0) 0%, rgba(17, 12, 7, 0.82) 100%);
  pointer-events: none;
}

.hero__light {
  position: absolute;
  top: 90px;
  left: 50%;
  transform: translateX(-50%);
  width: 620px;
  height: 620px;
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
  width: min(860px, 100%);
  padding-top: 0;
  gap: 0;
  transform: translateY(-15px);
}

.hero__icon {
  color: #c9a227;
  font-size: clamp(28px, 4vh, 34px);
  margin-bottom: clamp(10px, 2vh, 14px);
}

.hero__title {
  font-family: "Playfair Display", serif;
  font-size: clamp(70px, 7vh, 66px);
  font-weight: 700;
  line-height: 1.02;
  text-align: center;
  letter-spacing: 0;
  color: #e8d5b7;
  text-shadow: 0px 6px 3px rgba(0, 0, 0, 0.25);
  margin: 0;
}

.hero__title--accent {
  font-style: italic;
  color: #c9a227;
  margin-bottom: clamp(18px, 4vh, 28px);
}

.hero__tagline {
  font-family: "Playfair Display", serif;
  font-size: clamp(18px, 2.4vh, 20px);
  font-weight: 400;
  line-height: 1.4;
  text-align: center;
  color: #9b8a75;
  max-width: 760px;
  text-shadow: 0px 6px 3px rgba(0, 0, 0, 0.25);
  margin: 0 0 clamp(22px, 4.5vh, 34px);
  padding-inline: 16px;
}

/* ─── Hero Search ───────────────────────────────────── */

.hero__search {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  max-width: 804px;
  height: clamp(56px, 7vh, 66px);
  background-color: #2a1f14;
  border: 2px solid rgba(232, 213, 183, 0.25);
  border-radius: 33px;
  padding-inline: 24px;
  box-shadow: 0px 6px 12px rgba(0, 0, 0, 0.3);
  margin-bottom: clamp(18px, 3.5vh, 24px);
  transition: border-color 0.2s;
}

.hero__search:focus-within {
  border-color: rgba(201, 162, 39, 0.5);
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
  font-size: 15px;
  font-weight: 400;
  color: #e8d5b7;
  caret-color: #c9a227;
  min-width: 0;
}

.hero__search input::placeholder {
  color: #7a6b5d;
}

.filter-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 4px 12px;
  font-family: "Playfair Display", serif;
  font-size: 14px;
  color: #e8d5b7;
  flex-shrink: 0;
}

.remove-filter {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: #e8d5b7;
  cursor: pointer;
  padding: 0;
  opacity: 0.7;
}

.remove-filter:hover {
  opacity: 1;
}

.add-filter-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: 1px solid rgba(232, 213, 183, 0.4);
  border-radius: 20px;
  padding: 4px 12px;
  font-family: "Playfair Display", serif;
  font-size: 14px;
  color: #e8d5b7;
  flex-shrink: 0;
  cursor: pointer;
  transition: all 0.2s;
}

.add-filter-btn:hover {
  background: rgba(232, 213, 183, 0.1);
  border-color: #e8d5b7;
}

.send-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: #c9a227;
  cursor: pointer;
  flex-shrink: 0;
  transition: transform 0.2s, opacity 0.2s;
}

.send-btn:hover:not(:disabled) {
  transform: scale(1.1);
}

.send-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.filter-menu {
  background-color: #2a1f14 !important;
  border: 1px solid rgba(155, 138, 117, 0.25);
  border-radius: 8px;
  margin-bottom: 8px;
}

.filter-menu-item {
  font-family: "Playfair Display", serif;
  color: #e8d5b7 !important;
  cursor: pointer;
}

.filter-menu-item:hover {
  background-color: rgba(201, 162, 39, 0.1) !important;
  color: #c9a227 !important;
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
  height: 70px;
  font-family: "Playfair Display", serif;
  font-size: 15px;
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
  padding-inline: 24px;
  width: 316px;
}

.cta-secondary {
  background-color: #17120d;
  color: #c9a227;
  border: 2px solid rgba(232, 213, 183, 0.25);
  padding-inline: 24px;
  width: 236px;
}

@media (max-height: 680px) {
  .hero {
    padding-block: 18px;
  }

  .hero__tagline {
    max-width: 680px;
    line-height: 1.28;
  }

  .cta-primary,
  .cta-secondary {
    height: 60px;
  }
}

@media (max-width: 720px) {
  .hero {
    padding: 20px 18px;
  }

  .hero__title {
    font-size: clamp(38px, 11vw, 52px);
  }

  .hero__tagline {
    padding-inline: 0;
  }

  .hero__ctas {
    flex-direction: column;
    width: min(100%, 360px);
    gap: 10px;
  }

  .hero__search {
    padding-inline: 16px;
  }

  .add-filter-btn {
    max-width: 42px;
    padding-inline: 10px;
    overflow: hidden;
  }

  .cta-primary,
  .cta-secondary {
    width: 100%;
    height: 56px;
  }
}

</style>
