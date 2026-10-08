import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import request from 'supertest';
import * as OTPAuth from 'otpauth';
import { loadEnvironment, validateEnv } from '../../config/env.js';
import { createDatabase } from '../../config/database.js';
import { createJwt } from '../../config/jwt.js';
import { createApp } from '../../app.js';
import { createIdentityModel } from '../../models/identityModel.js';
import { createIdentityService } from '../../services/identityService.js';
import { createProfileService } from '../../services/profileService.js';
import { createLogQueue } from '../../services/logService.js';
import { migrationPlan } from '../../scripts/migrationPlan.js';
import { applyPlan } from '../../scripts/migrate.js';
import { bootstrapAdmin } from '../../scripts/bootstrapAdmin.js';
import { hashPassword } from '../../utils/identityCrypto.js';
import { testEnvironment } from '../helpers.js';
import { unavailableIdentityProviders } from '../../providers/identityProviders.js';

loadEnvironment();
const enabled = process.env.RUN_IDENTITY_MYSQL_TESTS === 'true';
test('MySQL identidade real: baseline vazio + upgrade, HTTP, constraints e concorrência', { skip: !enabled && 'RUN_IDENTITY_MYSQL_TESTS/TEST_DB_* ausentes; exige schema _test vazio, isolado e confirmado' }, async t => {
    const env = process.env;
    assert.notEqual(env.NODE_ENV, 'production');
    assert.equal(env.TEST_DB_CONFIRMED_NON_PRODUCTION, 'true');
    assert.match(env.TEST_DB_NAME ?? '', /^[a-zA-Z0-9_]+_test$/);
    assert.notEqual(env.TEST_DB_NAME, env.DB_NAME);
    for (const k of ['TEST_DB_HOST', 'TEST_DB_USER', 'TEST_DB_PASSWORD']) assert.ok(env[k], `${k} obrigatório`);
    const settings = { host: env.TEST_DB_HOST, port: Number(env.TEST_DB_PORT ?? 3306), user: env.TEST_DB_USER, password: env.TEST_DB_PASSWORD, database: env.TEST_DB_NAME, timeout: 30000, connectionLimit: 5, queueLimit: 20 };
    const database = createDatabase(settings);
    t.after(() => database.close());
    const [[count]] = await database.execute('SELECT COUNT(*) AS total FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()');
    assert.equal(Number(count.total), 0, 'Schema deve estar vazio. Suíte não apaga nem reutiliza dados existentes.');
    const plan = await migrationPlan();
    await applyPlan(database, plan.filter(p => !p.name.startsWith('20261008')));
    const password = 'Isolated!Fixture123';
    await database.execute('INSERT INTO usuarios (nome,email,cpf,senha,tipo_usuario,status,data_nascimento) VALUES (?,?,?,?,?,?,?)', ['Legacy Fixture', ' Legacy@Example.invalid ', '529.982.247-25', await hashPassword(password, 10), 'CLIENTE', 'ATIVO', '2000-01-01']);
    await applyPlan(database, plan);
    await applyPlan(database, plan); // Reexecução lê ledger; não repete DDL.
    const model = createIdentityModel(database);
    const legacy = await model.byEmail('legacy@example.invalid');
    assert.ok(legacy); assert.equal(legacy.cpf, '529.982.247-25');
    const config = validateEnv(testEnvironment({ BCRYPT_COST: '10', TWO_FACTOR_ENCRYPTION_KEY: randomBytes(32).toString('base64'), TERMS_VERSION: 'fixture-v1', PRIVACY_VERSION: 'fixture-v1', IDENTITY_LEGAL_BASIS: 'Fixture isolada', RATE_LIMIT_MAX: '1000' }));
    const sent = [];
    const providers = { ...unavailableIdentityProviders(), email: { async assertAvailable() {}, async sendRecovery(data) { sent.push(data); } } };
    const tokens = createJwt(config.jwt);
    const identity = createIdentityService({ database, model, config, tokens, providers });
    const profile = createProfileService({ identity, config, providers });
    const logQueue = createLogQueue(async () => {}, { limit: 100 });
    const app = createApp({ config, database, logQueue, retention: { async check() { return true; } }, identityProviders: providers, captchaProvider: { async verify() { return true; } } });
    t.after(async () => { await app.locals.close(); await logQueue.close(); });
    // IDs acima de 2^53 em tabela exclusiva desta base de teste.
    await database.execute('ALTER TABLE sessoes_autenticacao AUTO_INCREMENT = 9007199254740993');
    let auth = await identity.login({ email: 'legacy@example.invalid', password });
    assert.equal(tokens.verify(auth.accessToken).sid, '9007199254740993');
    const ctx = () => { const c = tokens.verify(auth.accessToken); return { actor: { id: c.sub, sessionId: c.sid } }; };
    await t.test('HTTP usa sessão SQL real; logout revoga JWT', async () => {
        await request(app).get('/api/users/me').set('Authorization', `Bearer ${auth.accessToken}`).expect(200);
        await request(app).post('/api/auth/logout').set('Authorization', `Bearer ${auth.accessToken}`).expect(204);
        await request(app).get('/api/users/me').set('Authorization', `Bearer ${auth.accessToken}`).expect(401);
        auth = await identity.login({ email: 'legacy@example.invalid', password });
    });
    await t.test('duas escritas de endereço principal deixam exatamente um principal', async () => {
        const input = { logradouro: 'Fixture', numero: '1', cidade: 'Fixture', estado: 'SP', principal: true };
        await Promise.all([profile.mutate('addresses', null, input, false, ctx()), profile.mutate('addresses', null, input, false, ctx())]);
        const [[row]] = await database.execute('SELECT COUNT(*) AS total FROM enderecos WHERE id_usuario = ? AND principal = TRUE', [String(legacy.id_usuario)]);
        assert.equal(Number(row.total), 1);
        await assert.rejects(database.execute('INSERT INTO enderecos (id_usuario,principal) VALUES (?,TRUE)', [String(legacy.id_usuario)]), { code: 'ER_DUP_ENTRY' });
    });
    await t.test('unicidade de CPF normalizado e rollback de auditoria junto à operação', async () => {
        await assert.rejects(database.execute('INSERT INTO usuarios (nome,email,cpf,senha,tipo_usuario,status) VALUES (?,?,?,?,?,?)', ['Duplicate Fixture', 'duplicate@example.invalid', '52998224725', legacy.senha, 'CLIENTE', 'ATIVO']), { code: 'ER_DUP_ENTRY' });
        await assert.rejects(database.transaction(async c => { await model.updateUser(c, String(legacy.id_usuario), { nome: 'Must rollback' }); await identity.audit(c, 'IDENTITY.TEST_ROLLBACK', String(legacy.id_usuario)); throw new Error('rollback'); }));
        assert.equal((await model.user(String(legacy.id_usuario))).nome, 'Legacy Fixture');
        const [[r]] = await database.execute("SELECT COUNT(*) AS total FROM auditoria_eventos WHERE event_type = 'IDENTITY.TEST_ROLLBACK'"); assert.equal(Number(r.total), 0);
    });
    await t.test('reset concorrente consome uma vez e revoga sessão persistida', async () => {
        // Fixture legado normalizado para entrega; teste não utiliza e-mail externo.
        await database.execute('UPDATE usuarios SET email = ? WHERE id_usuario = ?', ['legacy@example.invalid', String(legacy.id_usuario)]);
        await identity.forgot({ email: 'legacy@example.invalid' });
        const input = { token: sent.at(-1).token, password: 'Changed!Fixture123', passwordConfirmation: 'Changed!Fixture123' };
        const results = await Promise.allSettled([identity.reset(input), identity.reset(input)]);
        assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
        await request(app).get('/api/users/me').set('Authorization', `Bearer ${auth.accessToken}`).expect(401);
    });
    await t.test('bootstrap único, enrollment e duplo verify SQL não emitem duas sessões', async () => {
        const input = { name: 'Admin Fixture', email: 'admin@example.invalid', cpf: '11144477735', dateOfBirth: '2000-01-01', password, passwordConfirmation: password };
        await bootstrapAdmin(database, config, input);
        await assert.rejects(bootstrapAdmin(database, config, input));
        const login = await identity.login({ email: input.email, password });
        assert.equal(login.accessToken, undefined);
        const enroll = await identity.enroll({ method: 'APP', challengeToken: login.challengeToken });
        const code = OTPAuth.URI.parse(enroll.provisioningUri).generate();
        const results = await Promise.allSettled([identity.verify({ challengeToken: enroll.challengeToken, code }), identity.verify({ challengeToken: enroll.challengeToken, code })]);
        assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
        const adminToken = results.find(r => r.status === 'fulfilled').value.accessToken;
        await t.test('catálogo SQL: CRUD autenticado, filtros, dinheiro e arquivamento preservando FK', async () => {
            const api = (method, path) => request(app)[method](path).set('Authorization', `Bearer ${adminToken}`);
            const created = await api('post', '/api/films').send({ titulo: 'SQL 100%_literal', duracao: 100, disponivel_streaming: true, preco_aluguel: '99999999.99' }).expect(201);
            const filmId = created.body.data.id_filme;
            assert.equal(created.body.data.preco_aluguel, '99999999.99');
            assert.equal(typeof filmId, 'string');
            const genre = await api('post', '/api/genres').send({ nome: 'SQL Fixture' }).expect(201);
            const genreId = genre.body.data.id_genero;
            await api('post', '/api/genres').send({ nome: 'SQL Fixture' }).expect(409);
            for (let i = 0; i < 2; i++) await api('post', `/api/films/${filmId}/genres`).send({ genreId }).expect(200);
            // Valor privado legado permite verificar projeções sem configurar CDN externo.
            await database.execute('UPDATE filmes SET url_reproducao = ? WHERE id_filme = ?', ['https://media.example.invalid/private', filmId]);
            const page = await request(app).get('/api/films').query({ genreId, titulo: '%_', streaming: 'true', limit: '1' }).expect(200);
            assert.equal(page.body.data.items.length, 1);
            assert.ok(!page.text.includes('url_reproducao')); assert.ok(!page.text.includes('/private'));
            const none = await request(app).get('/api/films').query({ cinema: 'false' }).expect(200);
            assert.equal(none.body.data.items.length, 0);
            await api('patch', `/api/films/${filmId}`).send({ titulo: 'SQL Updated' }).expect(200);
            await api('delete', `/api/genres/${genreId}`).expect(204);
            const linked = await request(app).get(`/api/films/${filmId}/genres`).expect(200);
            assert.equal(linked.body.data.items.length, 0);
            await api('delete', `/api/films/${filmId}`).expect(204);
            await request(app).get(`/api/films/${filmId}`).expect(404);
            await api('get', `/api/admin/films/${filmId}`).expect(200);
            const [[row]] = await database.execute('SELECT COUNT(*) AS total FROM filme_generos WHERE id_filme = ? AND id_genero = ?', [filmId, genreId]);
            assert.equal(Number(row.total), 1);
            const [[audit]] = await database.execute("SELECT COUNT(*) AS total FROM auditoria_eventos WHERE event_type = 'CATALOG.FILM_ARCHIVED'");
            assert.equal(Number(audit.total), 1);
        });
    });
    // Preserva evidência no schema _test. Limpeza/recriação pelo operador, nunca DROP DATABASE automático.
});
