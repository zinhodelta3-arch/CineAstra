import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { loadEnvironment } from '../../config/env.js';
import { createDatabase } from '../../config/database.js';
import { idString } from '../../utils/dto.js';

loadEnvironment();
const enabled = process.env.RUN_MYSQL_TESTS === 'true';
test('MySQL real isolado: BEGIN/COMMIT/ROLLBACK, precisão de BIGINT SELECT/insertId, DECIMAL e DATE', { skip: !enabled && 'RUN_MYSQL_TESTS/TEST_DB_* não configurados; mocks não provam MySQL' }, async () => {
    const env = process.env;
    assert.notEqual(env.NODE_ENV, 'production');
    assert.equal(env.TEST_DB_CONFIRMED_NON_PRODUCTION, 'true');
    assert.match(env.TEST_DB_NAME ?? '', /^[a-zA-Z0-9_]+_test$/);
    assert.notEqual(env.TEST_DB_NAME, env.DB_NAME);
    for (const key of ['TEST_DB_HOST', 'TEST_DB_USER', 'TEST_DB_PASSWORD']) assert.ok(env[key], `${key} obrigatório`);
    const database = createDatabase({ host: env.TEST_DB_HOST, port: Number(env.TEST_DB_PORT ?? 3306), user: env.TEST_DB_USER, password: env.TEST_DB_PASSWORD, database: env.TEST_DB_NAME, timeout: 5000, connectionLimit: 2, queueLimit: 10 });
    // Nome aleatório interno: TEMPORARY TABLE desaparece com a conexão; nada altera tabela de domínio.
    const table = `infra_${randomUUID().replaceAll('-', '')}`;
    try {
        await database.withConnection(async c => {
            await c.execute(`CREATE TEMPORARY TABLE ${table} (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, amount DECIMAL(10,2), birth DATE) ENGINE=InnoDB`);
            await c.execute('START TRANSACTION');
            const [insert] = await c.execute(`INSERT INTO ${table} (id,amount,birth) VALUES (?, ?, ?)`, ['9007199254740993', '120.01', '2000-01-01']);
            assert.equal(idString(insert.insertId), '9007199254740993');
            await c.execute('COMMIT');
            const [[row]] = await c.execute(`SELECT id,amount,birth FROM ${table}`);
            assert.deepEqual(row, { id: '9007199254740993', amount: '120.01', birth: '2000-01-01' });
            await c.execute('START TRANSACTION');
            await c.execute(`UPDATE ${table} SET amount = ? WHERE id = ?`, ['42.00', '9007199254740993']);
            await c.execute('ROLLBACK');
            const [[kept]] = await c.execute(`SELECT amount FROM ${table}`);
            assert.equal(kept.amount, '120.01');
            await c.execute(`DROP TEMPORARY TABLE ${table}`);
        });
        await database.ping();
    } finally { await database.close(); }
});
