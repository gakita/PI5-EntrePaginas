const test = require('node:test');
const assert = require('node:assert/strict');

const oracle = require('../src/config/oracle');

function loadModelWithConnection(connection) {
  const originalGetConnection = oracle.getConnection;
  oracle.getConnection = async () => connection;

  delete require.cache[require.resolve('../src/models/avaliacaoModel')];
  const model = require('../src/models/avaliacaoModel');

  return {
    model,
    restore() {
      oracle.getConnection = originalGetConnection;
      delete require.cache[require.resolve('../src/models/avaliacaoModel')];
    },
  };
}

test('lists evaluations by user email using googleBooksId fields', async () => {
  const executed = [];
  const connection = {
    async execute(sql, binds) {
      executed.push({ sql, binds });
      return {
        rows: [
          {
            GOOGLE_BOOKS_ID: 'abc123',
            TITULO: 'Duna',
            NOTA: 5,
            COMENTARIO: 'Excelente',
          },
        ],
      };
    },
    async close() {},
  };

  const { model, restore } = loadModelWithConnection(connection);

  try {
    const result = await model.listByUserEmail('reader@example.com');

    assert.equal(executed.length, 1);
    assert.equal(executed[0].binds.email, 'reader@example.com');
    assert.deepEqual(result, [
      {
        googleBooksId: 'abc123',
        title: 'Duna',
        rating: 5,
        comment: 'Excelente',
      },
    ]);
  } finally {
    restore();
  }
});

test('upserts a new evaluation when no previous row exists', async () => {
  const executed = [];
  let committed = false;
  const connection = {
    async execute(sql, binds) {
      executed.push({ sql, binds });

      if (sql.includes('FETCH FIRST 1 ROWS ONLY')) {
        return { rows: [] };
      }

      if (sql.includes('INSERT INTO AVALIACOES')) {
        return { rowsAffected: 1 };
      }

      throw new Error('Unexpected SQL');
    },
    async commit() {
      committed = true;
    },
    async close() {},
  };

  const { model, restore } = loadModelWithConnection(connection);

  try {
    await model.upsertByUserEmail('reader@example.com', {
      googleBooksId: 'abc123',
      title: 'Duna',
      rating: 4,
      comment: 'Muito bom',
    });

    assert.equal(executed.length, 2);
    assert.ok(executed[1].sql.includes('INSERT INTO AVALIACOES'));
    assert.equal(executed[1].binds.googleBooksId, 'abc123');
    assert.equal(executed[1].binds.title, 'Duna');
    assert.equal(executed[1].binds.rating, 4);
    assert.equal(executed[1].binds.comment, 'Muito bom');
    assert.equal(committed, true);
  } finally {
    restore();
  }
});

test('updates an existing evaluation when the user already rated the book', async () => {
  const executed = [];
  let committed = false;
  const connection = {
    async execute(sql, binds) {
      executed.push({ sql, binds });

      if (sql.includes('FETCH FIRST 1 ROWS ONLY')) {
        return { rows: [{ CODIGO: 7 }] };
      }

      if (sql.includes('UPDATE AVALIACOES')) {
        return { rowsAffected: 1 };
      }

      throw new Error('Unexpected SQL');
    },
    async commit() {
      committed = true;
    },
    async close() {},
  };

  const { model, restore } = loadModelWithConnection(connection);

  try {
    await model.upsertByUserEmail('reader@example.com', {
      googleBooksId: 'abc123',
      title: 'Duna',
      rating: 3,
      comment: 'Bom',
    });

    assert.equal(executed.length, 2);
    assert.ok(executed[1].sql.includes('UPDATE AVALIACOES'));
    assert.equal(executed[1].binds.id, 7);
    assert.equal(committed, true);
  } finally {
    restore();
  }
});

test('keeps reading history compatible with chat and quiz consumers', async () => {
  const connection = {
    async execute() {
      return {
        rows: [
          {
            TITULO: 'Duna',
            NOTA: 5,
            COMENTARIO: 'Excelente',
          },
        ],
      };
    },
    async close() {},
  };

  const { model, restore } = loadModelWithConnection(connection);

  try {
    const result = await model.findReadBooksByUserEmail('reader@example.com');

    assert.deepEqual(result, [
      {
        title: 'Duna',
        rating: 5,
        comment: 'Excelente',
      },
    ]);
  } finally {
    restore();
  }
});
