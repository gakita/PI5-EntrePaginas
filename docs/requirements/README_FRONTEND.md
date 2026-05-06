# Guia de Implementação Frontend — Chat "Entre Páginas"

Este guia foi criado para auxiliar a equipe de Frontend (Vue.js) a integrar o Chat de Recomendação com IA desenvolvido no Backend.

---

## 🔗 Endpoints Disponíveis

A comunicação com o chat ocorre inteiramente no path `/chat/*`. **Todas as requisições exigem o header de autenticação:**
`Authorization: Bearer SEU_TOKEN_JWT`

| Ação | Método | Endpoint | Body (JSON) | O que faz |
|---|---|---|---|---|
| **Enviar Mensagem** | `POST` | `/chat/message` | `{ "message": "Texto..." }` | Envia a mensagem do usuário e recebe a resposta e as recomendações da IA. |
| **Buscar Histórico** | `GET` | `/chat/history` | - | Traz as mensagens trocadas na conversa ativa. Útil para quando o usuário recarregar a página. |
| **Limpar Chat** | `DELETE`| `/chat/history` | - | Reseta a conversa imediatamente, sem salvar preferências. |
| **Encerrar Conversa**| `POST` | `/chat/close` | - | **IMPORTANTE:** Chama no final (ex: ao fechar o modal). O backend deduz preferências e salva os livros no perfil. |
| **Ver Preferências** | `GET` | `/chat/preferences`| - | Traz `genres`, `types` e `favoriteAuthors` salvos no banco. |
| **Editar Preferências**| `PUT` | `/chat/preferences`| `{ "genres": ["..."], ... }`| Permite ao usuário editar suas preferências manualmente na tela de perfil. |

---

## 🎨 Requisitos Visuais e de UX (Atenção Frontend)

O documento de requisitos exige as seguintes implementações visuais:

### 1. Expansão da Busca (RF08)
> *"Barra de busca expande para o modo chat"*

A barra de busca normal do site deve possuir um ícone de IA/Chat ou interagir de forma que, ao ser ativada, a interface mude para a visualização conversacional do chatbot.

### 2. Aviso de Temas Sensíveis (RF11 / MQ07)
> *"Exibir tag/aviso quando um item contiver temas sensíveis... solicitando confirmação antes de prosseguir."*

A resposta da API para uma recomendação vem assim:
```json
{
  "title": "Berserk",
  "type": "mangá",
  "sensitiveContent": true, 
  "coverUrl": "https://...",
  "synopsis": "..."
}
```
**O que fazer:** Se `sensitiveContent` for `true`, exiba uma tag vermelha/amarela ("⚠️ Tema Sensível") no card e não mostre a sinopse completa ou link de compra até que o usuário clique em um botão "Sim, confirmar leitura".

### 3. Exibir Capa e Sinopse (RIA04)
O backend enriquece a resposta com `coverUrl` e `synopsis` consultando o **Google Books**. Contudo, caso a obra não seja encontrada no catálogo, esses campos virão como `null`.
**O que fazer:** Tenha uma imagem placeholder de fallback e um texto de "Sinopse não disponível" caso o valor venha nulo.

---

## 💻 Código Pronto para Vue.js

Abaixo está o boilerplate inicial para conectar os serviços no Vue 3 (Composition API).

### 1. Serviço de Comunicação (`src/services/chatService.js`)

```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

export const chatService = {
  // Enviar e receber mensagem
  async sendMessage(message) {
    const res = await fetch(`${API_URL}/chat/message`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ message })
    });
    if (!res.ok) throw new Error('Erro ao comunicar com a IA');
    return res.json();
  },

  // Pegar o histórico atual
  async getHistory() {
    const res = await fetch(`${API_URL}/chat/history`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Erro ao buscar histórico');
    return res.json();
  },

  // Ao fechar o modal/aba, avise o backend para salvar! (RF13)
  async closeChat() {
    const res = await fetch(`${API_URL}/chat/close`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return res.json();
  }
};
```

### 2. Componente Básico (`src/components/ChatIA.vue`)

```vue
<template>
  <div class="chat-container">
    <div class="chat-history">
      <div v-for="(msg, i) in messages" :key="i" :class="['message', msg.role]">
        <p>{{ msg.content }}</p>

        <!-- Se houver recomendações anexadas à mensagem da IA -->
        <div v-if="msg.recommendations && msg.recommendations.length > 0" class="recommendations">
          <div v-for="rec in msg.recommendations" :key="rec.title" class="book-card">
            
            <img :src="rec.coverUrl || '/placeholder-book.jpg'" :alt="rec.title" class="cover" />
            
            <div class="book-info">
              <h4>{{ rec.title }} <small>({{ rec.type }})</small></h4>
              
              <!-- REQUISITO RF11: Temas Sensíveis -->
              <span v-if="rec.sensitiveContent" class="alert-tag">⚠️ Tema Sensível</span>
              
              <p><strong>Por que ler:</strong> {{ rec.justification }}</p>
            </div>
          </div>
        </div>
      </div>

      <div v-if="loading" class="message assistant">
        <p>Pensando...</p>
      </div>
    </div>

    <form @submit.prevent="submitMessage" class="chat-input">
      <input v-model="userInput" placeholder="Qual seu gênero favorito hoje?" :disabled="loading" />
      <button type="submit" :disabled="loading || !userInput.trim()">Enviar</button>
    </form>
    
    <!-- REQUISITO RF13: Botão de Encerrar -->
    <button @click="endConversation" class="btn-close">Encerrar e Salvar Sugestões</button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { chatService } from '@/services/chatService';

const messages = ref([]);
const userInput = ref('');
const loading = ref(false);

onMounted(async () => {
  try {
    const data = await chatService.getHistory();
    messages.value = data.messages || [];
  } catch (err) {
    console.error(err);
  }
});

// Uma boa prática: se o componente for desmontado, chama a rota de close
onUnmounted(() => {
  chatService.closeChat().catch(console.error);
});

async function submitMessage() {
  const text = userInput.value.trim();
  if (!text) return;

  // 1. Adiciona a mensagem do usuário na tela instantaneamente
  messages.value.push({ role: 'user', content: text });
  userInput.value = '';
  loading.value = true;

  try {
    // 2. Chama a API
    const response = await chatService.sendMessage(text);
    
    // 3. Coloca a resposta e os livros na tela
    messages.value.push({
      role: 'assistant',
      content: response.reply,
      recommendations: response.recommendations
    });
  } catch (err) {
    messages.value.push({ role: 'assistant', content: 'Desculpe, ocorreu um erro de conexão.' });
  } finally {
    loading.value = false;
  }
}

async function endConversation() {
  await chatService.closeChat();
  messages.value = []; // Limpa a tela após salvar no DB
  alert('Gostos e livros sugeridos foram salvos no seu perfil!');
}
</script>

<style scoped>
/* Adicione sua estilização (vibrant colors, glassmorphism, micro-animations) conforme UI/UX guide */
.alert-tag {
  color: #fff;
  background-color: #e74c3c;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
}
</style>
```

---

## 🎯 Dicas Extra para a Equipe de Design/Frontend

1. **Skeleton Loaders:** O modelo demora em média 3~5 segundos para gerar a resposta. Utilize _skeleton loaders_ ou o famoso indicador visual "Assistente digitando..." para que o usuário sinta uma interface fluida.
2. **Scroll Automático:** Sempre que uma nova mensagem for adicionada ao `messages.value`, force o container HTML a dar um scroll-down para baixo para o usuário não precisar rolar a página manualmente.
3. **Múltiplos cliques:** Bloqueie o input enquanto o `loading` for `true`, do contrário o usuário pode mandar a mesma mensagem duas vezes.
