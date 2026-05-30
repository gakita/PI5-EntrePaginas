const path = require('path');
require('dotenv').config();

const preferenceModel = require('../src/models/preferenceModel');
const llmService = require('../src/services/llmService');
const { closeOracle } = require('../src/config/oracle');

async function run() {
  console.log('=== INICIANDO TESTE DO FLUXO DE TEMAS SENSÍVEIS ===\n');
  const testEmail = 'sensitive_tester@example.com';

  try {
    // 1. Gravar preferências de teste com temas sensíveis
    console.log('1. Testando Upsert de Preferências...');
    const testPrefs = {
      genres: ['suspense', 'terror'],
      types: ['livro'],
      favoriteAuthors: ['Stephen King'],
      sensitiveThemes: ['Violência', 'Gore']
    };

    const saved = await preferenceModel.upsertPreferences(testEmail, testPrefs);
    console.log('Preferências gravadas com sucesso:', saved);

    // 2. Buscar preferências salvas
    console.log('\n2. Testando Busca de Preferências...');
    const fetched = await preferenceModel.findByUserEmail(testEmail);
    console.log('Preferências recuperadas do banco Oracle:', fetched);

    if (fetched && fetched.sensitiveThemes && fetched.sensitiveThemes.includes('Violência')) {
      console.log('=> SUCESSO: Temas sensíveis persistidos no OracleDB corretamente!');
    } else {
      console.log('=> FALHA: Não foi possível recuperar os temas sensíveis do banco!');
    }

    // 3. Simular e testar a geração do Prompt com temas autorizados
    console.log('\n3. Testando geração de Prompt do Gemini com temas permitidos...');
    
    function simulatePrompt(prefs) {
      const allowedSensitive = prefs.sensitiveThemes || [];
      const sensitiveRules = allowedSensitive.length > 0
        ? `O usuário permite APENAS os seguintes temas sensíveis nas recomendações: ${allowedSensitive.join(', ')}...`
        : `O usuário NÃO aceita temas sensíveis...`;
      return sensitiveRules;
    }
    console.log('Regras simuladas para Temas Autorizados:', simulatePrompt(fetched));

    // Testar com temas vazios
    console.log('\n4. Testando regras simuladas para Temas VAZIOS (Nenhum autorizado):');
    const emptyPrefs = { genres: [], types: [], favoriteAuthors: [], sensitiveThemes: [] };
    console.log('Regras simuladas para Temas Vazios:', simulatePrompt(emptyPrefs));

  } catch (error) {
    console.error('Ocorreu um erro no teste:', error);
  } finally {
    try {
      await closeOracle();
      console.log('\nConexão com o OracleDB encerrada.');
    } catch (e) {
      console.error('Erro ao fechar conexão:', e.message);
    }
    console.log('\n=== TESTE CONCLUÍDO ===');
  }
}

run();
