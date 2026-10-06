import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { validateEnv } from '../config/env.js';
import { testEnvironment } from './helpers.js';
import { idString, moneyString, pagination } from '../utils/dto.js';
import { createDatabase, poolOptions } from '../config/database.js';
import { createLogQueue } from '../services/logService.js';
import { redactRoute } from '../middlewares/logMiddleware.js';
import { createLogModel } from '../models/logModel.js';
import { createLogRetention } from '../jobs/logRetention.js';
import { recordAuditEvent } from '../models/auditModel.js';
import { migrationPlan, splitSql } from '../scripts/migrationPlan.js';
import { applyPlan } from '../scripts/migrate.js';

test('env valida sem expor valores; produção sem docs, HTTPS e store compatível', () => {
    const env = testEnvironment();
    assert.equal(validateEnv(env).port, 3001);
    for (const changes of [{ JWT_SECRET: '' }, { DB_HOST: '' }, { PORT: 'NaN' }, { DB_QUEUE_LIMIT: '0' }, { CORS_ORIGINS: '*' }, { TRUST_PROXY: 'true' }, { TRUST_PROXY: '0.0.0.0/0' }, { INSTANCE_COUNT: '2' }, { DOCS_ENABLED: 'TRUE' }, { CAPTCHA_PROVIDER: 'fake-success' }]) assert.throws(() => validateEnv({ ...env, ...changes }), /Configuração inválida/);
    assert.throws(() => validateEnv({ ...env, NODE_ENV: 'production', DOCS_ENABLED: 'true' }));
    const production = validateEnv({ ...env, NODE_ENV: 'production', PUBLIC_ORIGIN: 'https://api.invalid.example', CORS_ORIGINS: 'https://web.invalid.example' });
    assert.equal(production.docsEnabled, false);
    assert.throws(() => validateEnv({ ...env, DB_PASSWORD: '' }), error => !error.message.includes(env.JWT_SECRET));
});
test('IDs >2^53 e DECIMAL permanecem strings; rejeita Number arredondado e dinheiro float', () => {
    assert.equal(idString('9007199254740993'), '9007199254740993');
    assert.equal(idString(18446744073709551615n), '18446744073709551615');
    assert.throws(() => idString(9007199254740993));
    assert.throws(() => idString('18446744073709551616'));
    assert.throws(() => idString('0'));
    assert.equal(moneyString('120.00'), '120.00');
    assert.throws(() => moneyString(120.00));
    assert.throws(() => pagination({ limit: '101' }));
    assert.deepEqual(pagination({}), { limit: 20, cursor: null });
});
function fakeDatabase({ fail = '', acquireDelay = 0 } = {}) {
    const calls = [];
    const raw = { async execute(sql, params) { calls.push({ sql, params }); if (sql === fail) throw new Error('fixture_sql_failure'); return [[]]; }, release() { calls.push({ sql: 'release' }); }, destroy() { calls.push({ sql: 'destroy' }); } };
    const pool = { async getConnection() { if (acquireDelay) await new Promise(r => setTimeout(r, acquireDelay)); return raw; }, async end() { calls.push({ sql: 'end' }); } };
    return { database: createDatabase({ timeout: 40 }, pool), calls, raw };
}
test('pool parametrizado, bigNumberStrings/UTC/DECIMAL e fila limitada', () => {
    const options = poolOptions(validateEnv(testEnvironment()).db);
    assert.equal(options.supportBigNumbers, true); assert.equal(options.bigNumberStrings, true);
    assert.equal(options.multipleStatements, false); assert.equal(options.decimalNumbers, false);
    assert.equal(options.timezone, 'Z'); assert.equal(options.dateStrings, true);
    assert.ok(options.queueLimit > 0);
});
test('transação usa mesma conexão, commit/release em sucesso e rollback/release em falha', async () => {
    const ok = fakeDatabase();
    await ok.database.transaction(async connection => { await connection.execute('A', ['id']); await connection.execute('B'); });
    assert.deepEqual(ok.calls.map(c => c.sql), ["SET SESSION time_zone = '+00:00'", 'START TRANSACTION', 'A', 'B', 'COMMIT', 'release']);
    const failed = fakeDatabase({ fail: 'B' });
    await assert.rejects(failed.database.transaction(async connection => { await connection.execute('A'); await connection.execute('B'); }));
    assert.equal(failed.calls.at(-2).sql, 'ROLLBACK'); assert.equal(failed.calls.at(-1).sql, 'release');
    await ok.database.close(); await ok.database.close(); assert.equal(ok.calls.filter(c => c.sql === 'end').length, 1);
});
test('falha de SET/begin/commit e rollback ainda libera conexão', async () => {
    for (const sql of ["SET SESSION time_zone = '+00:00'", 'START TRANSACTION', 'COMMIT']) {
        const f = fakeDatabase({ fail: sql });
        await assert.rejects(f.database.transaction(async () => {}));
        assert.equal(f.calls.at(-1).sql, 'release');
    }
    const f = fakeDatabase({ fail: 'ROLLBACK' });
    await assert.rejects(f.database.transaction(async () => { throw new Error('operation'); }));
    assert.equal(f.calls.at(-1).sql, 'release');
});
test('aquisição com timeout libera conexão tardia; sinal abortado destrói unidade SQL', async () => {
    const f = fakeDatabase({ acquireDelay: 80 });
    await assert.rejects(f.database.execute('SELECT 1'), e => e.statusCode === 503);
    await new Promise(r => setTimeout(r, 90));
    assert.equal(f.calls.at(-1).sql, 'release');
    const aborted = fakeDatabase();
    const controller = new AbortController();
    await assert.rejects(aborted.database.withConnection(async () => { controller.abort(); }, { signal: controller.signal }), e => e.statusCode === 503);
    assert.equal(aborted.calls.at(-1).sql, 'destroy');
});
test('fila de logs limitada, métricas/drop/failure/drain e fechamento', async () => {
    let finish;
    const notifications = [];
    const queue = createLogQueue(() => new Promise(resolve => { finish = resolve; }), { limit: 1, reportFailure: event => notifications.push(event) });
    assert.equal(queue.enqueue({ route: '/template' }), true);
    assert.equal(queue.enqueue({ route: '/overflow' }), false);
    finish(); await queue.close();
    assert.equal(queue.stats().written, 1); assert.equal(queue.stats().dropped, 1);
    assert.equal(queue.enqueue({}), false);
    const failed = createLogQueue(async () => { throw new Error('senha token SQL'); }, { reportFailure: event => notifications.push(event) });
    failed.enqueue({}); await failed.drain(); assert.equal(failed.stats().failed, 1);
    assert.ok(!notifications.join().includes('senha'));
    assert.equal(redactRoute({ originalUrl: '/reset/segredo?token=segredo' }), '[unmatched-or-middleware]');
    assert.equal(redactRoute({ baseUrl: '/secret/segredo', route: { path: '/:token' } }), '/:token');
});
test('logger INSERT usa placeholders e NULL bodies; retenção valida evento/worker sem elevar privilégios', async () => {
    const calls = [];
    const database = { async execute(sql, params) {
        calls.push({ sql, params });
        if (sql.includes('@@global')) return [[{ scheduler: 'ON' }]];
        if (sql.includes('information_schema.EVENTS')) return [[{ status: 'ENABLED', definition: 'DELETE FROM logs WHERE data_hora < CURRENT_TIMESTAMP(3) - INTERVAL 90 DAY ORDER BY data_hora ASC LIMIT 5000', interval_value: '15', interval_field: 'MINUTE' }]];
        return [[]];
    } };
    const model = createLogModel(database);
    await model.insert({ userId: '1', route: '/:id', method: 'GET', ip: null, userAgent: null, status: 400, elapsed: 1, size: null });
    assert.equal(calls[0].params.length, 8); assert.match(calls[0].sql, /NULL, NULL/);
    assert.equal(await model.checkRetention('event'), true);
    assert.equal(await model.checkRetention('worker'), false);
    assert.ok(!calls.some(c => /SET GLOBAL|CREATE EVENT/.test(c.sql)));
});
test('worker de expurgo não executa quando evento concorrente detectado; close espera trabalho', async () => {
    let purged = 0;
    const worker = createLogRetention({ async checkRetention() { return false; }, async purge() { purged++; } }, { retentionMode: 'worker', purgeInterval: 60000 });
    worker.start(); await worker.close(); assert.equal(purged, 0);
});
test('auditoria+outbox usam conexão transacional e payload positivo mínimo', async () => {
    const calls = [];
    await recordAuditEvent({ async execute(sql, params) { calls.push({ sql, params }); } }, { eventId: randomUUID(), requestId: randomUUID(), type: 'INFRA.TEST', aggregateId: '9007199254740993', actorId: '1', occurredAt: new Date(), version: 1, senha: 'segredo' });
    assert.equal(calls.length, 2);
    assert.ok(!JSON.stringify(calls).includes('segredo'));
});
test('migration plan revisado preserva fontes, exclui seeds/USE/SELECT/eventos e inclui V4 + M01', async () => {
    assert.deepEqual(splitSql("-- comment\nCREATE TABLE t (v VARCHAR(50) DEFAULT 'a;b'); /*comment*/ SELECT 'it''s';"), ["CREATE TABLE t (v VARCHAR(50) DEFAULT 'a;b')", "SELECT 'it''s'"]);
    const plan = await migrationPlan();
    assert.ok(plan.length > 50);
    assert.ok(plan.every(p => !/^(USE|SELECT|DROP|DELETE|CREATE EVENT)/i.test(p.sql)));
    assert.ok(plan.some(p => p.sql.includes('nome_cine')));
    assert.ok(plan.some(p => p.sql.includes('auditoria_eventos')));
    assert.ok(!plan.some(p => p.name.includes('05_inserts')));
});
test('migration recusa base existente sem ledger ANTES de DDL', async () => {
    const calls = [];
    const database = { async withConnection(fn) { return fn({ async execute(sql) {
        calls.push(sql);
        if (sql.includes('GET_LOCK')) return [[{ acquired: 1 }]];
        if (sql.includes('information_schema.TABLES')) return [[{ name: 'usuarios' }]];
        return [[]];
    } }); } };
    await assert.rejects(applyPlan(database, []), /baseline/);
    assert.ok(!calls.some(sql => sql.startsWith('CREATE')));
});
