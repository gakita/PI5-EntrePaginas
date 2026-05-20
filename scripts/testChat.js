#!/usr/bin/env node

/**
 * testChat.js — Script de testes de todos os cenários do chat.
 *
 * Cobre os endpoints do chat, preferências e encerramento de conversa:
 *   POST   /chat/message        → Enviar mensagem e receber recomendação da IA
 *   GET    /chat/history        → Buscar histórico
 *   DELETE /chat/history        → Limpar histórico
 *   POST   /chat/close          → Encerrar conversa (salvar preferências + sugestões)
 *   GET    /chat/preferences    → Buscar preferências
 *   PUT    /chat/preferences    → Atualizar preferências
 *
 * Como usar:
 *   node scripts/testChat.js --email=admin@example.com --password=123456
 *
 * Pré-requisito: servidor rodando em localhost:3000
 *   npm run dev
 */

const BASE_URL = 'http://localhost:3000';

function getArg(flag) {
  const arg = process.argv.find((a) => a.startsWith(`${flag}=`));
  return arg ? arg.split('=').slice(1).join('=') : null;
}

let passed = 0;
let failed = 0;

async function request(method, path, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, options);
  const data = await res.json();
  return { status: res.status, data };
}

function assert(testName, condition, detail = '') {
  if (condition) {
    console.log(`  ✅ ${testName}`);
    passed++;
  } else {
    console.log(`  ❌ ${testName}${detail ? `: ${detail}` : ''}`);
    failed++;
  }
}

// ── CENÁRIO 1: Autenticação ───────────────────────────────────

async function testarLogin(email, password) {
  console.log('\n📋 CENÁRIO 1: Login para obter token JWT');
  const { status, data } = await request('POST', '/auth/login', { email, password });
  assert('Status HTTP 200', status === 200, `recebido: ${status}`);
  assert('Retorna token', typeof data.token === 'string' && data.token.length > 0);
  assert('Retorna dados do usuário', data.user && data.user.email === email);
  return data.token;
}

// ── CENÁRIO 2: Enviar mensagem ────────────────────────────────

async function testarEnviarMensagem(token) {
  console.log('\n📋 CENÁRIO 2: Enviar mensagem e receber recomendação da IA');
  const { status, data } = await request(
    'POST', '/chat/message',
    { message: 'Me recomenda um livro de ficção científica!' },
    token
  );
  assert('Status HTTP 200', status === 200, `recebido: ${status}`);
  assert('Retorna campo "reply"', typeof data.reply === 'string' && data.reply.length > 0);
  assert('Retorna campo "recommendations"', Array.isArray(data.recommendations));
  assert('Retorna "messageCount" >= 2', data.messageCount >= 2);

  if (data.recommendations.length > 0) {
    const rec = data.recommendations[0];
    assert('Recomendação tem "title"', typeof rec.title === 'string');
    assert('Recomendação tem "type"', typeof rec.type === 'string');
    assert('Recomendação tem "justification"', typeof rec.justification === 'string');
    assert('Recomendação tem "sensitiveContent"', typeof rec.sensitiveContent === 'boolean');
    // Enriquecimento (RIA04): os campos existem, mas podem ser null
    // se o Google Books não encontrar o livro (API pública tem limites)
    assert('Recomendação tem campo "coverUrl" (enriquecimento)', 'coverUrl' in rec);
    assert('Recomendação tem campo "synopsis" (enriquecimento)', 'synopsis' in rec);
  }

  console.log(`     💬 Resposta da IA: "${data.reply.substring(0, 80)}..."`);
  console.log(`     📚 Recomendações: ${data.recommendations.length} itens`);
  const withCover = data.recommendations.filter((r) => r.coverUrl).length;
  console.log(`     🖼️  Com capa (Google Books): ${withCover}/${data.recommendations.length}`);
}

// ── CENÁRIO 3: Conversa com contexto ─────────────────────────

async function testarConversaComContexto(token) {
  console.log('\n📋 CENÁRIO 3: Conversa com múltiplas mensagens (contexto)');
  const { status, data } = await request(
    'POST', '/chat/message',
    { message: 'E um mangá do mesmo gênero?' },
    token
  );
  assert('Status HTTP 200', status === 200, `recebido: ${status}`);
  assert('messageCount cresceu (contexto mantido)', data.messageCount >= 4);
  assert('IA respondeu', typeof data.reply === 'string' && data.reply.length > 0);
  console.log(`     🔢 Total de mensagens na conversa: ${data.messageCount}`);
}

// ── CENÁRIO 4: Buscar histórico ───────────────────────────────

async function testarBuscarHistorico(token) {
  console.log('\n📋 CENÁRIO 4: Buscar histórico da conversa');
  const { status, data } = await request('GET', '/chat/history', null, token);
  assert('Status HTTP 200', status === 200, `recebido: ${status}`);
  assert('Retorna campo "messages"', Array.isArray(data.messages));
  assert('Histórico não está vazio', data.messages.length > 0);
  assert('Mensagens têm "role"', data.messages.every((m) => ['user', 'assistant'].includes(m.role)));
  assert('Mensagens têm "content"', data.messages.every((m) => typeof m.content === 'string'));
  assert('Mensagens têm "timestamp"', data.messages.every((m) => typeof m.timestamp === 'string'));
  // Verifica que ao menos as mensagens novas da IA têm "recommendations" armazenadas
  // (mensagens antigas sem o campo são ignoradas — retrocompatibilidade)
  const assistantMsgs = data.messages.filter((m) => m.role === 'assistant');
  const withRecs = assistantMsgs.filter((m) => Array.isArray(m.recommendations));
  assert('Pelo menos 1 mensagem da IA tem "recommendations" armazenadas', withRecs.length >= 1);
  console.log(`     💾 Mensagens salvas no banco: ${data.messages.length}`);
}

// ── CENÁRIO 5: Encerrar conversa (RF13/RIA07) ─────────────────

async function testarEncerrarConversa(token) {
  console.log('\n📋 CENÁRIO 5: Encerrar conversa (salvar preferências + sugestões)');
  const { status, data } = await request('POST', '/chat/close', null, token);
  assert('Status HTTP 200', status === 200, `recebido: ${status}`);
  // "saved" pode ser false se não havia conversa com recomendações ainda
  assert('Campo "saved" existe', 'saved' in data || 'message' in data);
  assert('Campo "suggestionsSaved" é número', typeof data.suggestionsSaved === 'number');
  assert('Pelo menos 1 sugestão salva', data.suggestionsSaved >= 1);
  assert('Campo "preferencesUpdated" existe', data.preferencesUpdated !== undefined);
  console.log(`     📌 Sugestões salvas: ${data.suggestionsSaved}`);
  console.log(`     🎯 Preferências atualizadas:`, JSON.stringify(data.preferencesUpdated));
}

// ── CENÁRIO 6: Preferências ───────────────────────────────────

async function testarPreferencias(token) {
  console.log('\n📋 CENÁRIO 6: Buscar e atualizar preferências');

  // GET — Busca preferências (que agora existem após o /close)
  const { status: s1, data: d1 } = await request('GET', '/chat/preferences', null, token);
  assert('GET /preferences → 200', s1 === 200, `recebido: ${s1}`);
  assert('Retorna "genres" array', Array.isArray(d1.genres));
  assert('Retorna "types" array', Array.isArray(d1.types));
  assert('Retorna "favoriteAuthors" array', Array.isArray(d1.favoriteAuthors));
  console.log(`     🎯 Preferências atuais: genres=${d1.genres.join(', ') || 'vazio'}`);

  // PUT — Atualiza preferências manualmente
  const { status: s2, data: d2 } = await request(
    'PUT', '/chat/preferences',
    { genres: ['terror', 'suspense'], types: ['livro'], favoriteAuthors: ['Stephen King'] },
    token
  );
  assert('PUT /preferences → 200', s2 === 200, `recebido: ${s2}`);
  assert('Retorna "preferences" atualizado', d2.preferences !== undefined);
  console.log(`     ✏️  Preferências atualizadas com sucesso`);

  // PUT — Validação: campo não-array deve retornar 400
  const { status: s3 } = await request(
    'PUT', '/chat/preferences',
    { genres: 'não é um array' },
    token
  );
  assert('PUT com campo não-array → 400', s3 === 400, `recebido: ${s3}`);
}

// ── CENÁRIO 7: Limpar histórico ───────────────────────────────

async function testarLimparHistorico(token) {
  console.log('\n📋 CENÁRIO 7: Limpar histórico do chat');
  const { status, data } = await request('DELETE', '/chat/history', null, token);
  assert('Status HTTP 200', status === 200, `recebido: ${status}`);
  assert('Retorna mensagem de confirmação', typeof data.message === 'string');

  const { data: histData } = await request('GET', '/chat/history', null, token);
  assert('Histórico está vazio após limpar', histData.messages.length === 0);
  console.log(`     🗑️  Conversa limpa com sucesso`);
}

// ── CENÁRIO 8: Nova conversa (preferências personalizadas) ─────

async function testarNovaConversaComPreferencias(token) {
  console.log('\n📋 CENÁRIO 8: Nova conversa usando preferências personalizadas');

  // Manda uma mensagem — agora deve usar as preferências do cenário 6 (terror + Stephen King)
  const { status, data } = await request(
    'POST', '/chat/message',
    { message: 'Quero uma recomendação baseada nos meus gostos!' },
    token
  );
  assert('Status HTTP 200', status === 200, `recebido: ${status}`);
  assert('messageCount começa do 2 (nova conversa)', data.messageCount === 2);
  assert('IA respondeu', data.reply.length > 0);
  console.log(`     🆕 Nova conversa com preferências personalizadas`);
  console.log(`     💬 IA: "${data.reply.substring(0, 100)}..."`);
}

// ── CENÁRIO 9: Erros de validação ────────────────────────────

async function testarErrosDeValidacao(token) {
  console.log('\n📋 CENÁRIO 9: Erros de validação e autenticação');

  const { status: s1 } = await request('POST', '/chat/message', { message: '' }, token);
  assert('Mensagem vazia → 400', s1 === 400, `recebido: ${s1}`);

  const { status: s2 } = await request('POST', '/chat/message', {}, token);
  assert('Sem campo "message" → 400', s2 === 400, `recebido: ${s2}`);

  const { status: s3 } = await request('POST', '/chat/message', { message: 'oi' }, null);
  assert('Sem token → 401', s3 === 401, `recebido: ${s3}`);

  const { status: s4 } = await request('POST', '/chat/message', { message: 'oi' }, 'token_invalido');
  assert('Token inválido → 401', s4 === 401, `recebido: ${s4}`);

  const { status: s5 } = await request('DELETE', '/chat/history', null, null);
  assert('DELETE sem token → 401', s5 === 401, `recebido: ${s5}`);

  const { status: s6 } = await request('POST', '/chat/close', null, null);
  assert('POST /close sem token → 401', s6 === 401, `recebido: ${s6}`);

  const { status: s7 } = await request('GET', '/chat/preferences', null, null);
  assert('GET /preferences sem token → 401', s7 === 401, `recebido: ${s7}`);
}

// ── Runner ────────────────────────────────────────────────────

async function runTests() {
  const email    = getArg('--email')    || 'admin@example.com';
  const password = getArg('--password') || '123456';

  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   Entre Páginas — Testes do Chat Backend     ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log(`🌐 Servidor: ${BASE_URL}`);
  console.log(`👤 Usuário:  ${email}`);

  try {
    const token = await testarLogin(email, password);
    await testarEnviarMensagem(token);
    await testarConversaComContexto(token);
    await testarBuscarHistorico(token);
    await testarEncerrarConversa(token);     // RF13/RIA07
    await testarPreferencias(token);         // RIA01
    await testarLimparHistorico(token);
    await testarNovaConversaComPreferencias(token);
    await testarErrosDeValidacao(token);
  } catch (err) {
    console.error('\n💥 Erro inesperado:', err.message);
    console.error('   Verifique se o servidor está rodando: npm run dev');
    process.exit(1);
  }

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
