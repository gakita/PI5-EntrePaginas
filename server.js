const app = require('./src/app');
const env = require('./src/config/env');
const { initializeOracle, closeOracle } = require('./src/config/oracle');

async function startServer() {
  try {
    await initializeOracle();

    const server = app.listen(env.port, () => {
      console.log(`Server running on port ${env.port}`);
    });

    async function shutdown(signal) {
      console.log(`${signal} received. Shutting down.`);
      server.close(async () => {
        await closeOracle();
        process.exit(0);
      });
    }

    process.on('SIGINT', () => {
      shutdown('SIGINT');
    });

    process.on('SIGTERM', () => {
      shutdown('SIGTERM');
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
