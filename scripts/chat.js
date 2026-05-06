#!/usr/bin/env node

/**
 * chat.js — Chat interativo no terminal com o Entre Páginas.
 *
 * Abre uma sessão de conversa diretamente no terminal.
 * Você digita uma mensagem, pressiona Enter, e recebe
 * a resposta da IA em tempo real.
 *
 * Como usar (com o servidor rodando em outro terminal):
 *   node scripts/chat.js --email=admin@example.com --password=123456
 *
 * Comandos especiais durante o chat:
 *   /limpar  → Apaga o histórico e começa uma nova conversa
 *   /sair    → Encerra o chat
 *   /ajuda   → Mostra os comandos disponíveis
 */

const readline = require('readline');

const BASE_URL = 'http://localhost:3000';

// ── Helpers ──────────────────────────────────────────────────

function getArg(flag) {
  const arg = process.argv.find((a) => a.startsWith(`${flag}=`));
  return arg ? arg.split('=').slice(1).join('=') : null;
}

async function request(method, path, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, options);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${res.status}`);
  }

  return res.json();
}

// Cores ANSI para deixar o terminal mais legível
const cor = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
  verde:  '\x1b[32m',
  azul:   '\x1b[34m',
  ciano:  '\x1b[36m',
  amarelo:'\x1b[33m',
  vermelho:'\x1b[31m',
  cinza:  '\x1b[90m',
};

function print(text) { process.stdout.write(text); }
function println(text = '') { console.log(text); }

function printSeparador() {
  println(`${cor.cinza}${'─'.repeat(55)}${cor.reset}`);
}

function printRecomendacao(rec, index) {
  const icone = rec.sensitiveContent ? '⚠️ ' : '📖';
  println(`  ${icone} ${cor.bold}${index + 1}. ${rec.title}${cor.reset}`);
  println(`     ${cor.cinza}${rec.type}${rec.author ? ` • ${rec.author}` : ''}${cor.reset}`);
  println(`     ${rec.justification}`);
  if (rec.sensitiveContent) {
    println(`     ${cor.amarelo}⚠ Contém temas sensíveis${cor.reset}`);
  }
  println();
}

// ── Login ─────────────────────────────────────────────────────

async function login(email, password) {
  print(`${cor.cinza}Autenticando...${cor.reset}`);
  try {
    const data = await request('POST', '/auth/login', { email, password });
    print('\r' + ' '.repeat(20) + '\r'); // limpa a linha
    return data.token;
  } catch (err) {
    println(`\n${cor.vermelho}Erro no login: ${err.message}${cor.reset}`);
    println('Verifique seu email/senha e tente novamente.');
    process.exit(1);
  }
}

// ── Comandos Especiais ────────────────────────────────────────

async function cmdLimpar(token) {
  await request('DELETE', '/chat/history', null, token);
  println(`${cor.verde}✓ Conversa limpa! Pode começar do zero.${cor.reset}`);
}

function cmdAjuda() {
  println(`${cor.ciano}Comandos disponíveis:${cor.reset}`);
  println(`  ${cor.bold}/limpar${cor.reset}  → Apaga o histórico e inicia uma nova conversa`);
  println(`  ${cor.bold}/sair${cor.reset}    → Encerra o chat`);
  println(`  ${cor.bold}/ajuda${cor.reset}   → Mostra esta mensagem`);
}

// ── Loop Principal do Chat ─────────────────────────────────────

async function startChat(token) {
  println();
  println(`${cor.bold}${cor.ciano}╔══════════════════════════════════════════════╗${cor.reset}`);
  println(`${cor.bold}${cor.ciano}║       Entre Páginas — Chat com IA  📚        ║${cor.reset}`);
  println(`${cor.bold}${cor.ciano}╚══════════════════════════════════════════════╝${cor.reset}`);
  println();
  println(`Olá! Pergunte sobre livros, HQs ou mangás.`);
  println(`${cor.cinza}Digite /ajuda para ver os comandos.${cor.reset}`);
  printSeparador();

  // Cria a interface de leitura do terminal
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // Trata Ctrl+C de forma amigável
  rl.on('SIGINT', () => {
    println(`\n${cor.cinza}Até logo! 👋${cor.reset}`);
    rl.close();
    process.exit(0);
  });

  // Função que pergunta e aguarda a resposta do usuário
  function pergunta() {
    rl.question(`\n${cor.verde}${cor.bold}Você: ${cor.reset}`, async (input) => {
      const texto = input.trim();

      // Ignora linha vazia
      if (!texto) {
        return pergunta();
      }

      // ── Comandos Especiais ──
      if (texto === '/sair') {
        println(`${cor.cinza}Até logo! 👋${cor.reset}`);
        rl.close();
        process.exit(0);
      }

      if (texto === '/ajuda') {
        cmdAjuda();
        return pergunta();
      }

      if (texto === '/limpar') {
        await cmdLimpar(token);
        return pergunta();
      }

      // ── Enviar mensagem para a IA ──
      print(`${cor.cinza}Entre Páginas está pensando...${cor.reset}`);

      try {
        const result = await request('POST', '/chat/message', { message: texto }, token);

        // Limpa o "pensando..." e exibe a resposta
        print('\r' + ' '.repeat(35) + '\r');

        println();
        println(`${cor.azul}${cor.bold}📚 Entre Páginas:${cor.reset} ${result.reply}`);

        // Exibe recomendações, se houver
        if (result.recommendations && result.recommendations.length > 0) {
          println();
          printSeparador();
          println(`${cor.ciano}${cor.bold}Recomendações:${cor.reset}`);
          println();
          result.recommendations.forEach((rec, i) => printRecomendacao(rec, i));
          printSeparador();
        }

      } catch (err) {
        print('\r' + ' '.repeat(35) + '\r');
        println(`${cor.vermelho}Erro: ${err.message}${cor.reset}`);
      }

      // Continua o loop — aguarda próxima mensagem
      pergunta();
    });
  }

  // Inicia o loop
  pergunta();
}

// ── Entry Point ───────────────────────────────────────────────

async function main() {
  const email    = getArg('--email')    || 'admin@example.com';
  const password = getArg('--password') || '123456';

  const token = await login(email, password);
  await startChat(token);
}

main().catch((err) => {
  console.error(`${cor.vermelho}Erro fatal: ${err.message}${cor.reset}`);
  process.exit(1);
});
