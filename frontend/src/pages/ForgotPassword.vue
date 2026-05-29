<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '@/services'

const router = useRouter()

const email = ref('')
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const resetToken = ref('')

const rules = {
  required: (v: string) => !!v || 'Campo obrigatório',
  email: (v: string) => /.+@.+\..+/.test(v) || 'E-mail inválido',
}

async function handleSubmit() {
  errorMessage.value = ''
  successMessage.value = ''

  if (!email.value) {
    errorMessage.value = 'O e-mail é obrigatório.'
    return
  }

  if (!/.+@.+\..+/.test(email.value)) {
    errorMessage.value = 'E-mail inválido.'
    return
  }

  loading.value = true

  try {
    const result = await authService.forgotPassword(email.value)
    successMessage.value = result.message || 'Se o e-mail estiver cadastrado, enviamos o código de recuperação.'
    resetToken.value = result.resetToken || ''
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Erro ao solicitar recuperação de senha.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="forgot-page">
    <!-- Left panel -->
    <div class="forgot-page__left">
      <div class="forgot-page__glow" />

      <div class="forgot-page__left-content">
        <h1 class="forgot-page__title">Recupere</h1>
        <h2 class="forgot-page__subtitle">sua senha de acesso</h2>
        <p class="forgot-page__description">
          Digite seu e-mail cadastrado para iniciarmos o processo de redefinição de senha.
        </p>
      </div>
    </div>

    <!-- Right panel -->
    <div class="forgot-page__right">
      <div class="forgot-page__card">
        <h3 class="forgot-page__card-title">Recuperação de Senha</h3>

        <v-form v-if="!successMessage" @submit.prevent="handleSubmit">
          <div class="forgot-page__field-group">
            <label class="forgot-page__label">E-mail</label>
            <v-text-field
              v-model="email"
              :rules="[rules.required, rules.email]"
              type="email"
              placeholder="seu@email.com"
              variant="outlined"
              density="comfortable"
              hide-details="auto"
              bg-color="#1e1710"
              base-color="#9b8a75"
              color="#c9a227"
            />
          </div>

          <v-alert
            v-if="errorMessage"
            type="error"
            variant="tonal"
            density="compact"
            class="forgot-page__alert"
          >
            {{ errorMessage }}
          </v-alert>

          <v-btn
            type="submit"
            :loading="loading"
            class="forgot-page__btn"
            block
            height="56"
          >
            Enviar Código
          </v-btn>

          <v-btn
            variant="text"
            class="forgot-page__back-btn"
            block
            height="44"
            to="/login"
          >
            <v-icon start class="mr-1">mdi-arrow-left</v-icon>
            Voltar para o Login
          </v-btn>
        </v-form>

        <div v-else class="forgot-page__success-container">
          <v-alert
            type="success"
            variant="tonal"
            density="comfortable"
            class="forgot-page__alert"
          >
            {{ successMessage }}
          </v-alert>

          <p class="forgot-page__success-text">
            Um código de segurança foi enviado para <strong>{{ email }}</strong>. Cheque sua caixa de entrada e seu lixo eletrônico.
          </p>

          <v-btn
            class="forgot-page__btn"
            block
            height="56"
            :to="{ path: '/reset-password', query: { email: email, token: resetToken } }"
          >
            Ir para Redefinição de Senha
          </v-btn>

          <v-btn
            variant="text"
            class="forgot-page__back-btn"
            block
            height="44"
            to="/login"
          >
            Voltar para o Login
          </v-btn>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.forgot-page {
  display: flex;
  min-height: 100vh;
  background-color: #110c07;
}

/* ─── Left panel ─────────────────────────────────────── */

.forgot-page__left {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 60px 48px;
}

.forgot-page__glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 520px;
  height: 520px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(201, 162, 39, 0.15) 0%, rgba(201, 162, 39, 0.04) 50%, transparent 70%);
  pointer-events: none;
}

.forgot-page__left-content {
  position: relative;
  z-index: 1;
  max-width: 460px;
  text-align: center;
}

.forgot-page__title {
  font-family: "Playfair Display", serif;
  font-size: 80px;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -2px;
  color: #e8d5b7;
  text-shadow: 0px 6px 3px rgba(0, 0, 0, 0.25);
  margin: 0;
}

.forgot-page__subtitle {
  font-family: "Playfair Display", serif;
  font-size: 28px;
  font-weight: 400;
  font-style: italic;
  color: #c9a227;
  margin: 8px 0 32px;
}

.forgot-page__description {
  font-family: "Playfair Display", serif;
  font-size: 18px;
  font-weight: 400;
  color: #9b8a75;
  line-height: 1.6;
  margin: 0;
}

/* ─── Right panel ────────────────────────────────────── */

.forgot-page__right {
  width: 560px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 40px;
}

.forgot-page__card {
  width: 100%;
  max-width: 460px;
  background-color: #1a130b;
  border: 1px solid rgba(232, 213, 183, 0.12);
  border-radius: 20px;
  padding: 48px 40px;
}

.forgot-page__card-title {
  font-family: "Playfair Display", serif;
  font-size: 32px;
  font-weight: 600;
  color: #e8d5b7;
  margin: 0 0 40px;
  text-align: center;
}

.forgot-page__field-group {
  margin-bottom: 28px;
}

.forgot-page__label {
  display: block;
  font-family: "Playfair Display", serif;
  font-size: 18px;
  font-weight: 600;
  color: #e8d5b7;
  margin-bottom: 8px;
}

.forgot-page__alert {
  margin-bottom: 24px;
}

.forgot-page__btn {
  background-color: #c9a227 !important;
  color: #1a120b !important;
  font-family: "Playfair Display", serif !important;
  font-size: 18px !important;
  font-weight: 600 !important;
  letter-spacing: 0.5px !important;
  border-radius: 12px !important;
  box-shadow: 0px 6px 4px rgba(0, 0, 0, 0.25) !important;
  margin-bottom: 12px;
}

.forgot-page__back-btn {
  font-family: "Playfair Display", serif !important;
  color: #9b8a75 !important;
  font-size: 16px !important;
  text-transform: none !important;
  letter-spacing: 0.5px !important;
}

.forgot-page__success-container {
  text-align: center;
}

.forgot-page__success-text {
  font-family: "Playfair Display", serif;
  font-size: 16px;
  color: #9b8a75;
  line-height: 1.6;
  margin-bottom: 28px;
}

.forgot-page__success-text strong {
  color: #e8d5b7;
}
</style>
