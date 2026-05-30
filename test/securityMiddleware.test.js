const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

const SRC_PATH_FRAGMENT = '/src/';

function clearSrcCache() {
  for (const key of Object.keys(require.cache)) {
    if (key.includes(SRC_PATH_FRAGMENT)) {
      delete require.cache[key];
    }
  }
}

function withEnv(overrides, callback) {
  const previous = {};

  for (const [key, value] of Object.entries(overrides)) {
    previous[key] = process.env[key];
    process.env[key] = value;
  }

  return Promise.resolve()
    .then(callback)
    .finally(() => {
      for (const key of Object.keys(overrides)) {
        if (previous[key] === undefined) {
          delete process.env[key];
        } else {
          process.env[key] = previous[key];
        }
      }
      clearSrcCache();
    });
}

function listen(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

function request(server, options, body = '') {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: '127.0.0.1',
        port: server.address().port,
        ...options,
      },
      (res) => {
        let responseBody = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          responseBody += chunk;
        });
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: responseBody,
          });
        });
      }
    );

    req.on('error', reject);

    if (body) {
      req.write(body);
    }

    req.end();
  });
}

test('app sends security headers', async () => {
  await withEnv(
    {
      RATE_LIMIT_MAX: '100',
      AUTH_RATE_LIMIT_MAX: '100',
    },
    async () => {
      const app = require('../src/app');
      const server = await listen(app);

      try {
        const response = await request(server, { path: '/health', method: 'GET' });

        assert.equal(response.statusCode, 200);
        assert.equal(response.headers['x-content-type-options'], 'nosniff');
      } finally {
        await close(server);
      }
    }
  );
});

test('app rejects JSON payloads above the configured limit', async () => {
  await withEnv(
    {
      JSON_BODY_LIMIT: '1kb',
      RATE_LIMIT_MAX: '100',
      AUTH_RATE_LIMIT_MAX: '100',
    },
    async () => {
      const app = require('../src/app');
      const server = await listen(app);
      const originalConsoleError = console.error;
      console.error = () => {};

      try {
        const body = JSON.stringify({ payload: 'x'.repeat(2048) });
        const response = await request(
          server,
          {
            path: '/health',
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              'content-length': Buffer.byteLength(body),
            },
          },
          body
        );

        assert.equal(response.statusCode, 413);
      } finally {
        console.error = originalConsoleError;
        await close(server);
      }
    }
  );
});

test('app rate limits repeated requests', async () => {
  await withEnv(
    {
      JSON_BODY_LIMIT: '100kb',
      RATE_LIMIT_WINDOW_MS: '60000',
      RATE_LIMIT_MAX: '1',
      AUTH_RATE_LIMIT_MAX: '100',
    },
    async () => {
      const app = require('../src/app');
      const server = await listen(app);

      try {
        const first = await request(server, { path: '/health', method: 'GET' });
        const second = await request(server, { path: '/health', method: 'GET' });

        assert.equal(first.statusCode, 200);
        assert.equal(second.statusCode, 429);
      } finally {
        await close(server);
      }
    }
  );
});
