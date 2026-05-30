const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

const { createProcessDefinitions } = require('../scripts/devAll');

test('dev all script starts backend and frontend dev servers', () => {
  const rootDir = path.resolve(__dirname, '..');
  const definitions = createProcessDefinitions(rootDir);

  assert.deepEqual(definitions, [
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
  ]);
});

test('root package exposes one command to run the full app', () => {
  const packageJson = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, '..', 'package.json'), 'utf8')
  );

  assert.equal(packageJson.scripts['dev:all'], 'node scripts/devAll.js');
});
