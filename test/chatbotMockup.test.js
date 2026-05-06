const assert = require('node:assert/strict');
const http = require('node:http');
const test = require('node:test');

function loadAppWithEnv(pathname) {
  process.env.CHATBOT_PAGE_PATH = pathname;

  for (const key of [
    '../src/config/env',
    '../src/app',
    '../src/routes',
  ]) {
    delete require.cache[require.resolve(key)];
  }

  return require('../src/app');
}

function request(app, pathname) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);

    server.listen(0, () => {
      const { port } = server.address();
      const req = http.get({ port, path: pathname }, (res) => {
        let body = '';

        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          server.close(() => resolve({ statusCode: res.statusCode, body }));
        });
      });

      req.on('error', (error) => {
        server.close(() => reject(error));
      });
    });
  });
}

test('serves the chatbot mockup at the path configured by env', async () => {
  const app = loadAppWithEnv('/chatbot');

  const response = await request(app, '/chatbot');

  assert.equal(response.statusCode, 200);
  assert.match(response.body, /Entre Paginas Chatbot/);
  assert.match(response.body, /Faça uma pergunta sobre o seu livro ideal/);
  assert.match(response.body, /href="\/favoritos"/);
  assert.match(response.body, /href="\/usuario"/);
});

test('chatbot mockup keeps the prototype colors and recommendation CTA', async () => {
  const app = loadAppWithEnv('/assistente');

  const response = await request(app, '/assistente');

  assert.equal(response.statusCode, 200);
  assert.match(response.body, /#1A120B/i);
  assert.match(response.body, /#110C07/i);
  assert.match(response.body, /#C9A227/i);
  assert.match(response.body, /#E8D5B7/i);
  assert.match(response.body, /Ver mais/);
});
