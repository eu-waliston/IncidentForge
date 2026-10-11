const { loadEnv } = require('./config/env');
const { connectDatabase, disconnectDatabase } = require('./config/database');
const { createApp } = require('./app');

async function main() {
  const config = loadEnv();
  await connectDatabase(config.mongoUri);
  const app = createApp(config);
  const server = app.listen(config.port, config.host, () => {
    console.info(`[server] IncidentForge listening on http://${config.host}:${config.port}`);
  });
  let shuttingDown = false;
  async function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;
    console.info(`[server] Received ${signal}; shutting down.`);
    const forceExit = setTimeout(() => {
      console.error('[server] Graceful shutdown timed out.');
      process.exit(1);
    }, 10000);
    forceExit.unref();
    server.close(async (error) => {
      try {
        await disconnectDatabase();
        if (error) {
          console.error('[server] HTTP shutdown failed.', error);
          process.exitCode = 1;
        }
      } catch (err) {
        console.error('[server] Database shutdown failed.', err);
        process.exitCode = 1;
      } finally {
        clearTimeout(forceExit);
      }
    });
  }
  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((error) => {
  console.error('[startup] IncidentForge failed to start:', error.message);
  process.exitCode = 1;
});
