<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authService } from '@/services'

const route = useRoute()
const router = useRouter()

const email = ref((route.query.email as string) || '')
const token = ref((route.query.token as string) || '')
const password = ref('')
const confirmPassword = ref('')

const showPassword = ref(false)
const showConfirmPassword = ref(false)
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const rules = {
  required: (v: string) => !!v || 'Campo obrigatório',
  minLength: (v: string) => v.length >= 6 || 'Mínimo de 6 caracteres',
  matches: (v: string) => v === password.value || 'As senhas não coincidem',
}

async function handleSubmit() {
  errorMessage.value = ''
  successMessage.value = ''

  if (!token.value) {
    errorMessage.value = 'O código de recuperação é obrigatório.'
    return
  }

  if (!password.value) {
    errorMessage.value = 'A nova senha é obrigatória.'
    return
  }

  if (password.value.length < 6) {
    errorMessage.value = 'A senha deve ter no mínimo 6 caracteres.'
    return
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'As senhas não coincidem.'
    return
  }

  loading.value = true

  try {
    const result = await authService.resetPassword(token.value, password.value)
    successMessage.value = result.message || 'Sua senha foi redefinida com sucesso!'
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Erro ao redefinir senha.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="reset-page">
    <!-- Left panel -->
    <div class="reset-page__left">
      <div class="reset-page__glow" />

      <div class="reset-page__left-content">
        <h1 class="reset-page__title">Redefina</h1>
        <h2 class="reset-page__subtitle">sua nova senha</h2>
        <p class="reset-page__description">
          Insira o código enviado para o seu e-mail e escolha uma nova senha segura.
        </p>
      </div>
    </div>

    <!-- Right panel -->
    <div class="reset-page__right">
      <div class="reset-page__card">
        <h3 class="reset-page__card-title">Redefinir Senha</h3>

        <v-form v-if="!successMessage" @submit.prevent="handleSubmit">
          <!-- Token / Código -->
          <div class="reset-page__field-group">
            <label class="reset-page__label">Código de Recuperação</label>
            <v-text-field
              v-model="token"
              :rules="[rules.required]"
              type="text"
              placeholder="Digite ou cole o código"
              variant="outlined"
              density="comfortable"
              hide-details="auto"
              bg-color="#1e1710"
              base-color="#9b8a75"
              color="#c9a227"
            />
          </div>

          <!-- Nova Senha -->
          <div class="reset-page__field-group">
            <label class="reset-page__label">Nova Senha</label>
            <v-text-field
              v-model="password"
              :rules="[rules.required, rules.minLength]"
              :type="showPassword ? 'text' : 'password'"
              :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
              placeholder="Mínimo de 6 caracteres"
              variant="outlined"
              density="comfortable"
              hide-details="auto"
              bg-color="#1e1710"
              base-color="#9b8a75"
              color="#c9a227"
              @click:append-inner="showPassword = !showPassword"
            />
          </div>

          <!-- Confirmar Nova Senha -->
          <div class="reset-page__field-group">
            <label class="reset-page__label">Confirmar Nova Senha</label>
            <v-text-field
              v-model="confirmPassword"
              :rules="[rules.required, rules.matches]"
              :type="showConfirmPassword ? 'text' : 'password'"
              :append-inner-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
              placeholder="Repita a nova senha"
              variant="outlined"
              density="comfortable"
              hide-details="auto"
              bg-color="#1e1710"
              base-color="#9b8a75"
              color="#c9a227"
              @click:append-inner="showConfirmPassword = !showConfirmPassword"
            />
          </div>

          <!-- Error Alert -->
          <v-alert
            v-if="errorMessage"
            type="error"
            variant="tonal"
            density="compact"
            class="reset-page__alert"
          >
            {{ errorMessage }}
          </v-alert>

          <!-- Submit Button -->
          <v-btn
            type="submit"
            :loading="loading"
            class="reset-page__btn"
            block
            height="56"
          >
            Redefinir Senha
          </v-btn>

          <!-- Back Button -->
          <v-btn
            variant="text"
            class="reset-page__back-btn"
            block
            height="44"
            to="/login"
          >
            <v-icon start class="mr-1">mdi-arrow-left</v-icon>
            Voltar para o Login
          </v-btn>
        </v-form>

        <!-- Success Message -->
        <div v-else class="reset-page__success-container">
          <v-alert
            type="success"
            variant="tonal"
            density="comfortable"
            class="reset-page__alert"
          >
            {{ successMessage }}
          </v-alert>

          <p class="reset-page__success-text">
            Sua senha foi atualizada com sucesso. Você já pode acessar sua conta utilizando as novas credenciais.
          </p>

          <v-btn
            class="reset-page__btn"
            block
            height="56"
            to="/login"
          >
            Ir para o Login
          </v-btn>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.reset-page {
  display: flex;
  min-height: 100vh;
  background-color: #110c07;
}

/* ─── Left panel ─────────────────────────────────────── */

.reset-page__left {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 60px 48px;
}

.reset-page__glow {
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

.reset-page__left-content {
  position: relative;
  z-index: 1;
  max-width: 460px;
  text-align: center;
}

.reset-page__title {
  font-family: "Playfair Display", serif;
  font-size: 80px;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -2px;
  color: #e8d5b7;
  text-shadow: 0px 6px 3px rgba(0, 0, 0, 0.25);
  margin: 0;
}

.reset-page__subtitle {
  font-family: "Playfair Display", serif;
  font-size: 28px;
  font-weight: 400;
  font-style: italic;
  color: #c9a227;
  margin: 8px 0 32px;
}

.reset-page__description {
  font-family: "Playfair Display", serif;
  font-size: 18px;
  font-weight: 400;
  color: #9b8a75;
  line-height: 1.6;
  margin: 0;
}

/* ─── Right panel ────────────────────────────────────── */

.reset-page__right {
  width: 560px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 40px;
}

.reset-page__card {
  width: 100%;
  max-width: 460px;
  background-color: #1a130b;
  border: 1px solid rgba(232, 213, 183, 0.12);
  border-radius: 20px;
  padding: 48px 40px;
}

.reset-page__card-title {
  font-family: "Playfair Display", serif;
  font-size: 32px;
  font-weight: 600;
  color: #e8d5b7;
  margin: 0 0 40px;
  text-align: center;
}

.reset-page__field-group {
  margin-bottom: 28px;
}

.reset-page__label {
  display: block;
  font-family: "Playfair Display", serif;
  font-size: 18px;
  font-weight: 600;
  color: #e8d5b7;
  margin-bottom: 8px;
}

.reset-page__alert {
  margin-bottom: 24px;
}

.reset-page__btn {
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

.reset-page__back-btn {
  font-family: "Playfair Display", serif !important;
  color: #9b8a75 !important;
  font-size: 16px !important;
  text-transform: none !important;
  letter-spacing: 0.5px !important;
}

.reset-page__success-container {
  text-align: center;
}

.reset-page__success-text {
  font-family: "Playfair Display", serif;
  font-size: 16px;
  color: #9b8a75;
  line-height: 1.6;
  margin-bottom: 28px;
}

.reset-page__success-text strong {
  color: #e8d5b7;
}
</style>
