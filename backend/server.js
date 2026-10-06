import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { loadEnvironment, validateEnv } from './config/env.js';
import { createDatabase } from './config/database.js';
import { createApp } from './app.js';
import { createLogModel } from './models/logModel.js';
import { createLogQueue } from './services/logService.js';
import { createLogRetention } from './jobs/logRetention.js';
import { report } from './utils/telemetry.js';

export async function startServer(config, overrides = {}) {
    const database = overrides.database ?? createDatabase(config.db);
    const model = createLogModel(database);
    const queue = overrides.logQueue ?? createLogQueue(log => model.insert(log), { limit: config.logging.queueLimit });
    const retention = overrides.retention ?? createLogRetention(model, config.logging);
    const lifecycle = { stopping: false };
    let app;
    try { app = createApp({ config, database, logQueue: queue, retention, lifecycle }); }
    catch (error) { await queue.close(); await database.close(); throw error; }
    const server = createServer(app);
    server.requestTimeout = config.httpTimeout;
    server.headersTimeout = Math.min(config.httpTimeout, 5000);
    server.keepAliveTimeout = 5000;
    server.setTimeout(config.httpTimeout, socket => socket.destroy());
    try {
        await new Promise((resolve, reject) => { server.once('error', reject); server.listen(config.port, config.host, () => { server.removeListener('error', reject); resolve(); }); });
    } catch (error) { await app.locals.close(); await queue.close(); await database.close(); throw error; }
    retention.start();
    let shutdown;
    return { server, app, lifecycle, close() {
        shutdown ??= (async () => {
            lifecycle.stopping = true;
            const force = setTimeout(() => server.closeAllConnections(), config.shutdownTimeout);
            try {
                await new Promise(resolve => { server.close(resolve); server.closeIdleConnections(); });
                await retention.close();
                await queue.close();
                await app.locals.close();
                await database.close();
            } finally { clearTimeout(force); }
        })();
        return shutdown;
    } };
}

async function main() {
    let runtime;
    try {
        loadEnvironment();
        const config = validateEnv();
        runtime = await startServer(config);
        console.info('CineAstra API iniciada; consulte /ready para prontidão.');
        const stop = () => {
            const force = setTimeout(() => { report('shutdown_timeout'); process.exit(1); }, config.shutdownTimeout);
            runtime.close().then(() => { clearTimeout(force); process.exitCode = 0; }, () => { report('shutdown_failed'); process.exit(1); });
        };
        process.once('SIGINT', stop);
        process.once('SIGTERM', stop);
    } catch { report('startup_failed_check_environment'); process.exitCode = 1; }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
