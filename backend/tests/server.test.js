import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { startServer } from '../server.js';
import { validateEnv } from '../config/env.js';
import { testEnvironment } from './helpers.js';

test('startup sem env falha seguro sem ouvir HTTP nem imprimir valores', () => {
    const child = spawnSync(process.execPath, ['server.js'], { cwd: new URL('../', import.meta.url), env: { ...process.env, JWT_SECRET: '', DB_HOST: '', DB_PASSWORD: '' }, encoding: 'utf8' });
    assert.equal(child.status, 1);
    assert.match(child.stderr, /startup_failed_check_environment/);
    assert.ok(!child.stderr.includes('DB_PASSWORD'));
});
test('server HTTP inicializa, configura timeouts e fecha HTTP/worker/fila/pool uma vez', async () => {
    const order = [];
    const runtime = await startServer({ ...validateEnv(testEnvironment()), port: 0 }, {
        database: { async ping() {}, async close() { order.push('database'); } },
        logQueue: { enqueue() {}, async close() { order.push('queue'); } },
        retention: { start() { order.push('start'); }, async check() { return true; }, async close() { order.push('worker'); } }
    });
    const port = runtime.server.address().port;
    const response = await fetch(`http://127.0.0.1:${port}/health`);
    assert.equal(response.status, 200); await response.json();
    assert.equal(runtime.server.requestTimeout, 10000);
    await Promise.all([runtime.close(), runtime.close()]);
    assert.equal(runtime.lifecycle.stopping, true);
    assert.equal(runtime.server.listening, false);
    assert.deepEqual(order, ['start', 'worker', 'queue', 'database']);
});
test('falha no encerramento de worker não impede tentativa de fechar fila e pool', async () => {
    const closed = [];
    const runtime = await startServer({ ...validateEnv(testEnvironment()), port: 0 }, {
        database: { async close() { closed.push('database'); } },
        logQueue: { enqueue() {}, async close() { closed.push('queue'); } },
        retention: { start() {}, async close() { throw new Error('fixture_shutdown_failure'); } }
    });
    await assert.rejects(runtime.close(), /Encerramento incompleto/);
    assert.deepEqual(closed, ['queue', 'database']);
    assert.equal(runtime.server.listening, false);
});
