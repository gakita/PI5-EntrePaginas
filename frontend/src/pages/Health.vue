<script setup lang="ts">
import { onMounted, ref } from 'vue'

type HealthState = 'checking' | 'online' | 'offline'

const status = ref<HealthState>('checking')
const statusCode = ref<number | null>(null)
const responseBody = ref('')
const responseTime = ref<number | null>(null)
const errorMessage = ref('')

async function checkHealth() {
  status.value = 'checking'
  statusCode.value = null
  responseBody.value = ''
  responseTime.value = null
  errorMessage.value = ''

  const startedAt = performance.now()

  try {
    const response = await fetch('/api/health')
    const body = await response.text()

    statusCode.value = response.status
    responseBody.value = body
    responseTime.value = Math.round(performance.now() - startedAt)
    status.value = response.ok ? 'online' : 'offline'
  } catch (error) {
    responseTime.value = Math.round(performance.now() - startedAt)
    errorMessage.value = error instanceof Error ? error.message : 'Erro ao consultar health.'
    status.value = 'offline'
  }
}

onMounted(checkHealth)
</script>

<template>
  <main class="health-page">
    <section class="health-card">
      <div class="health-card__header">
        <div>
          <p class="health-card__eyebrow">localhost:3001</p>
          <h1 class="health-card__title">Health Check</h1>
        </div>

        <span class="health-status" :class="`health-status--${status}`">
          {{ status }}
        </span>
      </div>

      <dl class="health-list">
        <div>
          <dt>Endpoint</dt>
          <dd>/api/health</dd>
        </div>

        <div>
          <dt>Status HTTP</dt>
          <dd>{{ statusCode ?? '-' }}</dd>
        </div>

        <div>
          <dt>Tempo</dt>
          <dd>{{ responseTime === null ? '-' : `${responseTime}ms` }}</dd>
        </div>

        <div>
          <dt>Resposta</dt>
          <dd>{{ responseBody || errorMessage || '-' }}</dd>
        </div>
      </dl>

      <v-btn
        class="health-card__button"
        :loading="status === 'checking'"
        @click="checkHealth"
      >
        Testar novamente
      </v-btn>
    </section>
  </main>
</template>

<style scoped>
.health-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  background: #110c07;
  color: #e8d5b7;
}

.health-card {
  width: 100%;
  max-width: 560px;
  padding: 32px;
  border: 1px solid rgba(232, 213, 183, 0.14);
  border-radius: 12px;
  background: #1a130b;
}

.health-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 28px;
}

.health-card__eyebrow {
  margin: 0 0 6px;
  color: #c9a227;
  font-size: 14px;
}

.health-card__title {
  margin: 0;
  font-family: "Playfair Display", serif;
  font-size: 36px;
  font-weight: 700;
}

.health-status {
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
}

.health-status--checking {
  background: rgba(201, 162, 39, 0.16);
  color: #c9a227;
}

.health-status--online {
  background: rgba(73, 181, 117, 0.16);
  color: #64d48f;
}

.health-status--offline {
  background: rgba(239, 83, 80, 0.16);
  color: #ff8a86;
}

.health-list {
  display: grid;
  gap: 14px;
  margin: 0 0 28px;
}

.health-list div {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(232, 213, 183, 0.1);
}

.health-list dt {
  color: #9b8a75;
}

.health-list dd {
  margin: 0;
  word-break: break-word;
}

.health-card__button {
  background-color: #c9a227 !important;
  color: #1a120b !important;
  font-weight: 700 !important;
}
</style>
