#!/usr/bin/env node

/**
 * Executor dos testes completos do quiz.
 *
 * Ele pode:
 *   1. Criar/verificar a tabela QUIZ_SESSOES
 *   2. Subir a API se ela nao estiver rodando
 *   3. Esperar /health
 *   4. Executar scripts/testQuiz.js
 *
 * Uso:
 *   npm run test:quiz:run -- --email=admin@example.com --password=123456
 *
 * Opcoes:
 *   --skip-db       nao roda npm run db:quiz
 *   --base-url=URL  URL da API, padrao http://localhost:3000
 */

const { spawn } = require('node:child_process');

const DEFAULT_BASE_URL = 'http://localhost:3000';
const HEALTH_TIMEOUT_MS = 20000;
const HEALTH_INTERVAL_MS = 500;

function getArg(flag) {
  const arg = process.argv.find((item) => item.startsWith(`${flag}=`));
  return arg ? arg.split('=').slice(1).join('=') : null;
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

const baseUrl = getArg('--base-url') || process.env.BASE_URL || DEFAULT_BASE_URL;
const email = getArg('--email') || process.env.TEST_EMAIL || 'admin@example.com';
const password = getArg('--password') || process.env.TEST_PASSWORD || '123456';
const skipDb = hasFlag('--skip-db');

let serverProcess = null;

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: process.env,
      shell: process.platform === 'win32',
      stdio: options.stdio || 'inherit',
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(' ')} saiu com codigo ${code}`));
    });
  });
}

async function isServerReady() {
  try {
    const response = await fetch(`${baseUrl}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForServer() {
  const start = Date.now();

  while (Date.now() - start < HEALTH_TIMEOUT_MS) {
    if (await isServerReady()) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, HEALTH_INTERVAL_MS));
  }

  throw new Error(`API nao respondeu em ${baseUrl}/health dentro de ${HEALTH_TIMEOUT_MS}ms`);
}

async function ensureServer() {
  if (await isServerReady()) {
    console.log(`[ok] API ja esta rodando em ${baseUrl}`);
    return;
  }

  console.log('[info] API nao esta rodando. Iniciando node server.js...');
  serverProcess = spawn(process.execPath, ['server.js'], {
    cwd: process.cwd(),
    env: process.env,
    shell: false,
    stdio: ['ignore', 'inherit', 'inherit'],
  });

  serverProcess.on('exit', (code) => {
    if (code !== null && code !== 0) {
      console.error(`[erro] servidor encerrou com codigo ${code}`);
    }
  });

  await waitForServer();
  console.log(`[ok] API pronta em ${baseUrl}`);
}

function stopServer() {
  if (!serverProcess || serverProcess.killed) {
    return;
  }

  serverProcess.kill('SIGTERM');
}

async function main() {
  console.log('Entre Paginas - Executor dos testes do Quiz Backend');
  console.log(`Servidor: ${baseUrl}`);
  console.log(`Usuario: ${email}`);

  if (!skipDb) {
    console.log('\n[1/3] Criando/verificando tabela do quiz');
    await runCommand('npm', ['run', 'db:quiz']);
  } else {
    console.log('\n[1/3] Pulando db:quiz por --skip-db');
  }

  console.log('\n[2/3] Verificando API');
  await ensureServer();

  console.log('\n[3/3] Executando cenarios do quiz');
  await runCommand(process.execPath, [
    'scripts/testQuiz.js',
    `--base-url=${baseUrl}`,
    `--email=${email}`,
    `--password=${password}`,
  ]);
}

main()
  .catch((error) => {
    console.error('\nFalha ao executar testes do quiz:', error.message);
    process.exitCode = 1;
  })
  .finally(() => {
    stopServer();
  });
