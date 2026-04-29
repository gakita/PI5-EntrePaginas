<script setup lang="ts">
import { ref } from 'vue'
import Navbar from '@/components/Navbar.vue'

const question = ref('')
const selectedGenre = ref('')
const genres = ['Ficção', 'Terror', 'Romance', 'Aventura', 'Fantasia']

const selectGenre = (genre: string) => {
  selectedGenre.value = genre
}

// Mocks for UI demonstration
const aiResponse = `Baseado no que você me disse, acho que esses livros são exatamente o que você procura! Eles misturam ficção e elementos fantásticos de uma forma incrível.`

const recommendedBooks = [
  {
    id: 1,
    title: 'O Nome do Vento',
    synopsis: 'A história do jovem Kvothe, que cresce para se tornar o mago mais notório que o mundo já viu. Uma jornada épica e inesquecível de magia e música.',
  },
  {
    id: 2,
    title: 'Duna',
    synopsis: 'A jornada de Paul Atreides em Arrakis, o planeta deserto, lutando pelo controle da especiaria mais valiosa do universo enquanto descobre seu destino.',
  }
]

const removeFilter = () => {
  selectedGenre.value = ''
}
</script>

<template>
  <div class="chatbot-page">
    <Navbar />

    <main class="chat-container">
      <div class="chat-content">
        <!-- AI Response Area -->
        <div class="chat-message ai-message">
          <div class="ai-avatar">
            <v-icon size="32" color="#110C07">mdi-robot-outline</v-icon>
          </div>
          
          <div class="ai-body">
            <p class="ai-text">{{ aiResponse }}</p>

            <div class="book-recommendations">
              <div v-for="book in recommendedBooks" :key="book.id" class="book-item">
                <div class="book-info">
                  <span class="book-title">{{ book.title }}</span>
                  <p class="book-synopsis">{{ book.synopsis }}</p>
                  <router-link :to="`/livro/${book.id}`" class="book-link">Ver mais -></router-link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Chat Input Bar -->
      <div class="chat-input-wrapper">
        <div class="chat-input-bar">
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
                @click="selectGenre(genre)"
                class="filter-menu-item"
              >
                <v-list-item-title>{{ genre }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
          
          <input 
            v-model="question" 
            type="text" 
            placeholder="Faça uma pergunta sobre o seu livro ideal..." 
            class="chat-input"
          />
          
          <button class="send-btn">
            <v-icon>mdi-send</v-icon>
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.chatbot-page {
  min-height: 100vh;
  background-color: #110C07;
  display: flex;
  flex-direction: column;
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  padding-bottom: 120px; /* Space for fixed input */
  overflow-y: auto;
}

.chat-content {
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 20px;
  width: 100%;
}

.ai-message {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.ai-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: #C9A227;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.ai-body {
  flex: 1;
}

.ai-text {
  font-family: "Playfair Display", serif;
  font-size: 18px;
  color: #E8D5B7;
  line-height: 1.6;
  margin-bottom: 30px;
}

.book-recommendations {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.book-item {
  display: flex;
  flex-direction: column;
}

.book-title {
  font-family: "Playfair Display", serif;
  font-weight: 700;
  font-size: 18px;
  color: #E8D5B7;
  margin-bottom: 8px;
  display: block;
}

.book-synopsis {
  font-family: "Roboto", sans-serif;
  font-size: 15px;
  color: #E8D5B7;
  line-height: 1.4;
  margin-bottom: 8px;
  opacity: 0.9;
  /* Truncate to 2 lines */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.book-link {
  font-family: "Playfair Display", serif;
  font-size: 16px;
  color: #C9A227;
  text-decoration: none;
  font-weight: 500;
  display: inline-block;
  transition: opacity 0.2s;
}

.book-link:hover {
  opacity: 0.8;
}

/* Chat Input Bar */
.chat-input-wrapper {
  position: fixed;
  bottom: 40px;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 0 20px;
  z-index: 100;
}

.chat-input-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  max-width: 804px;
  height: 66px;
  background-color: #2A1F14; /* Same dark tone */
  border: 2px solid rgba(232, 213, 183, 0.25);
  border-radius: 33px; /* Rounded borders */
  padding: 0 24px;
  box-shadow: 0px 6px 12px rgba(0, 0, 0, 0.3);
}

.filter-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.1); /* Glass effect */
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 4px 12px;
  font-family: "Playfair Display", serif;
  font-size: 14px;
  color: #E8D5B7;
  flex-shrink: 0;
}

.remove-filter {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: #E8D5B7;
  cursor: pointer;
  padding: 0;
  opacity: 0.7;
}

.remove-filter:hover {
  opacity: 1;
}

.chat-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-family: "Playfair Display", serif;
  font-size: 18px;
  color: #E8D5B7;
  min-width: 0;
}

.chat-input::placeholder {
  color: #7A6B5D;
}

.send-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: #C9A227;
  cursor: pointer;
  flex-shrink: 0;
  transition: transform 0.2s;
}

.send-btn:hover {
  transform: scale(1.1);
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
  color: #E8D5B7;
  flex-shrink: 0;
  cursor: pointer;
  transition: all 0.2s;
}

.add-filter-btn:hover {
  background: rgba(232, 213, 183, 0.1);
  border-color: #E8D5B7;
}

.filter-menu {
  background-color: #2A1F14 !important;
  border: 1px solid rgba(155, 138, 117, 0.25);
  border-radius: 8px;
  margin-bottom: 8px;
}

.filter-menu-item {
  font-family: "Playfair Display", serif;
  color: #E8D5B7 !important;
  cursor: pointer;
}

.filter-menu-item:hover {
  background-color: rgba(201, 162, 39, 0.1) !important;
  color: #C9A227 !important;
}
</style>
