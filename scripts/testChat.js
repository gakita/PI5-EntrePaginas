#!/usr/bin/env node

/**
 * testChat.js — Script de testes de todos os cenários do chat.
 *
 * Testa os 3 endpoints do chat cobrindo cenários de sucesso e erro:
 *   POST   /chat/message  → Enviar mensagem e receber recomendação da IA
 *   GET    /chat/history  → Buscar histórico da última conversa
 *   DELETE /chat/history  → Limpar conversa
 *
 * Como usar:
 *   node scripts/testChat.js --email=admin@example.com --password=123456
 *
 * Pré-requisito: servidor rodando em localhost:3000
 *   npm run dev
 */

const BASE_URL = 'http://localhost:3000';

// ── Helpers ──────────────────────────────────────────────────

function getArg(flag) {
  const arg = process.argv.find((a) => a.startsWith(`${flag}=`));
  return arg ? arg.split('=').slice(1).join('=') : null;
}

// Contador de testes
let passed = 0;
let failed = 0;

/**
 * Faz uma requisição HTTP usando o fetch nativo do Node.js (18+).
 */
async function request(method, path, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, options);
  const data = await res.json();
  return { status: res.status, data };
}

/**
 * Exibe resultado de um teste com ✅ ou ❌.
 */
function assert(testName, condition, detail = '') {
  if (condition) {
    console.log(`  ✅ ${testName}`);
    passed++;
  } else {
    console.log(`  ❌ ${testName}${detail ? `: ${detail}` : ''}`);
    failed++;
  }
}

// ── Cenários de Teste ─────────────────────────────────────────

/**
 * CENÁRIO 1: Autenticação
 * Faz login para obter o token JWT usado em todos os outros testes.
 */
async function testarLogin(email, password) {
  console.log('\n📋 CENÁRIO 1: Login para obter token JWT');

  const { status, data } = await request('POST', '/auth/login', { email, password });

  assert('Status HTTP 200', status === 200, `recebido: ${status}`);
  assert('Retorna token', typeof data.token === 'string' && data.token.length > 0);
  assert('Retorna dados do usuário', data.user && data.user.email === email);

  return data.token;
}

/**
 * CENÁRIO 2: Enviar mensagem válida
 * Testa o fluxo principal: usuário pede recomendação e recebe resposta da IA.
 */
async function testarEnviarMensagem(token) {
  console.log('\n📋 CENÁRIO 2: Enviar mensagem e receber recomendação da IA');

  const { status, data } = await request(
    'POST',
    '/chat/message',
    { message: 'Me recomenda um livro de ficção científica!' },
    token
  );

  assert('Status HTTP 200', status === 200, `recebido: ${status}`);
  assert('Retorna campo "reply"', typeof data.reply === 'string' && data.reply.length > 0);
  assert('Retorna campo "recommendations"', Array.isArray(data.recommendations));
  assert('Retorna "messageCount"', typeof data.messageCount === 'number');
  assert('messageCount é >= 2 (user + assistant)', data.messageCount >= 2);

  if (data.recommendations.length > 0) {
    const rec = data.recommendations[0];
    assert('Recomendação tem "title"', typeof rec.title === 'string');
    assert('Recomendação tem "type"', typeof rec.type === 'string');
    assert('Recomendação tem "justification"', typeof rec.justification === 'string');
    assert('Recomendação tem campo "sensitiveContent"', typeof rec.sensitiveContent === 'boolean');
  }

  console.log(`     💬 Resposta da IA: "${data.reply.substring(0, 80)}..."`);
  console.log(`     📚 Recomendações: ${data.recommendations.length} itens`);

  return data;
}

/**
 * CENÁRIO 3: Conversa com contexto (multi-turn)
 * Testa que o modelo lembra das mensagens anteriores.
 */
async function testarConversaComContexto(token) {
  console.log('\n📋 CENÁRIO 3: Conversa com múltiplas mensagens (contexto)');

  // Segunda mensagem — deve continuar a conversa do cenário 2
  const { status, data } = await request(
    'POST',
    '/chat/message',
    { message: 'E um mangá do mesmo gênero?' },
    token
  );

  assert('Status HTTP 200', status === 200, `recebido: ${status}`);
  assert('messageCount cresceu (contexto mantido)', data.messageCount >= 4);
  assert('IA respondeu', typeof data.reply === 'string' && data.reply.length > 0);

  console.log(`     💬 Resposta: "${data.reply.substring(0, 80)}..."`);
  console.log(`     🔢 Total de mensagens na conversa: ${data.messageCount}`);
}

/**
 * CENÁRIO 4: Buscar histórico da conversa
 * Testa que a conversa foi persistida no banco Oracle.
 */
async function testarBuscarHistorico(token) {
  console.log('\n📋 CENÁRIO 4: Buscar histórico da conversa');

  const { status, data } = await request('GET', '/chat/history', null, token);

  assert('Status HTTP 200', status === 200, `recebido: ${status}`);
  assert('Retorna campo "messages"', Array.isArray(data.messages));
  assert('Histórico não está vazio', data.messages.length > 0);
  assert('Mensagens têm campo "role"', data.messages.every((m) => m.role === 'user' || m.role === 'assistant'));
  assert('Mensagens têm campo "content"', data.messages.every((m) => typeof m.content === 'string'));
  assert('Mensagens têm campo "timestamp"', data.messages.every((m) => typeof m.timestamp === 'string'));

  console.log(`     💾 Mensagens salvas no banco: ${data.messages.length}`);
}

/**
 * CENÁRIO 5: Limpar histórico
 * Testa o DELETE que reseta a conversa do usuário.
 */
async function testarLimparHistorico(token) {
  console.log('\n📋 CENÁRIO 5: Limpar histórico do chat');

  const { status, data } = await request('DELETE', '/chat/history', null, token);

  assert('Status HTTP 200', status === 200, `recebido: ${status}`);
  assert('Retorna mensagem de confirmação', typeof data.message === 'string');

  // Confirma que o histórico ficou vazio
  const { data: histData } = await request('GET', '/chat/history', null, token);
  assert('Histórico está vazio após limpar', histData.messages.length === 0);

  console.log(`     🗑️  Conversa limpa com sucesso`);
}

/**
 * CENÁRIO 6: Nova conversa após limpeza
 * Testa que uma mensagem nova cria um novo histórico do zero.
 */
async function testarNovaConversaAposLimpeza(token) {
  console.log('\n📋 CENÁRIO 6: Nova conversa após limpeza');

  const { status, data } = await request(
    'POST',
    '/chat/message',
    { message: 'Oi, quero uma HQ de super-heróis!' },
    token
  );

  assert('Status HTTP 200', status === 200, `recebido: ${status}`);
  assert('messageCount começa do 2 (nova conversa)', data.messageCount === 2);
  assert('IA respondeu', data.reply.length > 0);

  console.log(`     🆕 Nova conversa iniciada (messageCount = ${data.messageCount})`);
}

/**
 * CENÁRIO 7: Erros de validação
 * Testa o que acontece com entradas inválidas.
 */
async function testarErrosDeValidacao(token) {
  console.log('\n📋 CENÁRIO 7: Erros de validação e autenticação');

  // 7a. Mensagem vazia
  const { status: s1, data: d1 } = await request('POST', '/chat/message', { message: '' }, token);
  assert('Mensagem vazia → 400 Bad Request', s1 === 400, `recebido: ${s1}`);

  // 7b. Sem campo "message" no body
  const { status: s2, data: d2 } = await request('POST', '/chat/message', {}, token);
  assert('Sem campo "message" → 400 Bad Request', s2 === 400, `recebido: ${s2}`);

  // 7c. Sem token de autenticação
  const { status: s3 } = await request('POST', '/chat/message', { message: 'oi' }, null);
  assert('Sem token JWT → 401 Unauthorized', s3 === 401, `recebido: ${s3}`);

  // 7d. Token inválido
  const { status: s4 } = await request('POST', '/chat/message', { message: 'oi' }, 'token_invalido');
  assert('Token inválido → 401 Unauthorized', s4 === 401, `recebido: ${s4}`);

  // 7e. Limpar histórico sem autenticação
  const { status: s5 } = await request('DELETE', '/chat/history', null, null);
  assert('DELETE sem token → 401 Unauthorized', s5 === 401, `recebido: ${s5}`);
}

// ── Runner Principal ──────────────────────────────────────────

async function runTests() {
  const email = getArg('--email') || 'admin@example.com';
  const password = getArg('--password') || '123456';

  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   Entre Páginas — Testes do Chat Backend     ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log(`🌐 Servidor: ${BASE_URL}`);
  console.log(`👤 Usuário: ${email}`);

  try {
    // Executa os cenários em sequência (a ordem importa!)
    const token = await testarLogin(email, password);
    await testarEnviarMensagem(token);
    await testarConversaComContexto(token);
    await testarBuscarHistorico(token);
    await testarLimparHistorico(token);
    await testarNovaConversaAposLimpeza(token);
    await testarErrosDeValidacao(token);

  } catch (err) {
    console.error('\n💥 Erro inesperado durante os testes:', err.message);
    console.error('   Verifique se o servidor está rodando: npm run dev');
    process.exit(1);
  }

  // Resumo final
  const total = passed + failed;
  console.log('\n══════════════════════════════════════════════');
  console.log(`📊 RESULTADO: ${passed}/${total} testes passaram`);
  if (failed > 0) {
    console.log(`❌ ${failed} teste(s) falharam`);
    process.exit(1);
  } else {
    console.log('🎉 Todos os testes passaram!');
  }
}

runTests();
