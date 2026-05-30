#!/usr/bin/env node

const { spawn } = require('node:child_process');
const path = require('node:path');
const readline = require('node:readline');

function createProcessDefinitions(rootDir = path.resolve(__dirname, '..')) {
  return [
    {
      name: 'backend',
      command: 'npm',
      args: ['run', 'dev'],
      cwd: rootDir,
    },
    {
      name: 'frontend',
      command: 'npm',
      args: ['run', 'dev'],
      cwd: path.join(rootDir, 'frontend'),
    },
  ];
}

function pipeWithPrefix(stream, prefix, output) {
  const reader = readline.createInterface({ input: stream });

  reader.on('line', (line) => {
    output.write(`[${prefix}] ${line}\n`);
  });

  return reader;
}

function startProcess(definition) {
  const child = spawn(definition.command, definition.args, {
    cwd: definition.cwd,
    env: process.env,
    shell: process.platform === 'win32',
    stdio: ['inherit', 'pipe', 'pipe'],
  });

  const stdoutReader = pipeWithPrefix(child.stdout, definition.name, process.stdout);
  const stderrReader = pipeWithPrefix(child.stderr, definition.name, process.stderr);

  child.on('close', () => {
    stdoutReader.close();
    stderrReader.close();
  });

  return child;
}

function run() {
  const definitions = createProcessDefinitions();
  const children = definitions.map(startProcess);
  let shuttingDown = false;

  function stopAll(signal = 'SIGTERM') {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;

    for (const child of children) {
      if (!child.killed) {
        child.kill(signal);
      }
    }
  }

  for (const child of children) {
    child.on('exit', (code, signal) => {
      if (!shuttingDown && code !== 0) {
        console.error(`Process ${child.spawnargs.join(' ')} exited with code ${code ?? signal}.`);
        stopAll();
        process.exitCode = code || 1;
      }
    });
  }

  process.on('SIGINT', () => stopAll('SIGINT'));
  process.on('SIGTERM', () => stopAll('SIGTERM'));
}

if (require.main === module) {
  run();
}

module.exports = {
  createProcessDefinitions,
  run,
};
