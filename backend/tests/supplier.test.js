import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import { createSupplierService } from '../services/supplierService.js';
import { createSupplierController } from '../controllers/supplierController.js';
import { supplierRoutes } from '../routes/supplierRoutes.js';
import { supplierSchemas } from '../validators/supplierValidators.js';
import { normalizeCnpj } from '../utils/cnpj.js';
import { createSupplierModel } from '../models/supplierModel.js';
import { errorMiddleware } from '../middlewares/errorMiddleware.js';
import { ApiError } from '../utils/ApiError.js';

function fixture() {
    let state = { suppliers: [], users: [
        { id_usuario: '1', tipo_usuario: 'ADMIN', status: 'ATIVO' },
        { id_usuario: '2', tipo_usuario: 'FORNECEDOR', status: 'ATIVO' },
        { id_usuario: '3', tipo_usuario: 'CLIENTE', status: 'ATIVO' },
        { id_usuario: '4', tipo_usuario: 'FORNECEDOR', status: 'ATIVO' },
        { id_usuario: '5', tipo_usuario: 'FORNECEDOR', status: 'INATIVO' }
    ], audit: [] }, next = 1, serial = Promise.resolve();
    const supplier = id => state.suppliers.find(s => s.id_fornecedor === String(id));
    const model = {
        async supplier(id) { return supplier(id) ?? null; },
        async byUser(id) { return state.suppliers.find(s => s.id_usuario === String(id)) ?? null; },
        async user(id) { return state.users.find(u => u.id_usuario === String(id)) ?? null; },
        async list(q) { return state.suppliers.filter(s => BigInt(s.id_fornecedor) > BigInt(q.cursor ?? '0') && (!q.status || s.status === q.status)).slice(0, q.limit + 1); },
        async create(c, input) {
            if (state.suppliers.some(s => normalizeCnpj(s.cnpj) === input.cnpj)) throw Object.assign(new Error('duplicate'), { code: 'ER_DUP_ENTRY' });
            const id = String(next++); state.suppliers.push({ id_fornecedor: id, id_usuario: input.userId, razao_social: input.razao_social, nome_cine: input.nome_cine ?? null, cnpj: input.cnpj, status: 'ATIVO', data_cadastro: '2026-10-08 00:00:00' }); return id;
        },
        async update(c, id, data) { Object.assign(supplier(id), data); }
    };
    const identity = {
        async transaction(fn) { const prior = serial; let release; serial = new Promise(resolve => { release = resolve; }); await prior; const snapshot = structuredClone(state), oldNext = next; try { return await fn({}); } catch (error) { state = snapshot; next = oldNext; throw error; } finally { release(); } },
        async activeActor(c, context) { return state.users.find(u => u.id_usuario === context.actor.id); },
        async audit(c, type, id) { state.audit.push({ type, id }); }
    };
    const service = createSupplierService({ model, identity });
    const app = express(); app.use(express.json());
    app.use((req, res, next) => { res.locals.requestId = '00000000-0000-4000-8000-000000000001'; next(); });
    app.use(supplierRoutes(createSupplierController(service), { auth(req, res, next) { const id = req.headers['x-user-id']; if (!id) throw ApiError.naoAutorizado(); const user = state.users.find(u => u.id_usuario === id); if (!user) throw ApiError.naoAutorizado(); req.usuario = { id, tipo: user.tipo_usuario }; next(); } }));
    app.use(errorMiddleware);
    const api = (method, path, user = '1') => request(app)[method](path).set('X-User-Id', user);
    return { app, api, get state() { return state; } };
}

test('CNPJ numérico e alfanumérico da Receita são normalizados e DVs inválidos recusados', () => {
    assert.equal(normalizeCnpj('04.252.011/0001-10'), '04252011000110');
    assert.equal(normalizeCnpj('00.000.000/E08G-12'), '00000000E08G12');
    assert.equal(normalizeCnpj('12.ABC.345/01DE-35'), '12ABC34501DE35');
    assert.equal(normalizeCnpj('12.ABC.345/01DE-36'), null);
    assert.equal(supplierSchemas.create.safeParse({ userId: '2', razao_social: 'A', cnpj: '00.000.000/E08G-12' }).success, true);
    assert.equal(supplierSchemas.create.safeParse({ userId: '2', razao_social: 'A', cnpj: '00.000.000/E08G-13' }).success, false);
});

test('CRUD ADMIN exige conta FORNECEDOR ativa, preserva vínculo e arquiva logicamente', async () => {
    const f = fixture(), base = '/api/admin/suppliers';
    await request(f.app).post(base).send({ userId: '2', razao_social: 'Empresa', cnpj: '04.252.011/0001-10' }).expect(401);
    await f.api('post', base, '2').send({ userId: '2', razao_social: 'Empresa', cnpj: '04.252.011/0001-10' }).expect(403);
    await f.api('post', base).send({ userId: '3', razao_social: 'Empresa', cnpj: '04.252.011/0001-10' }).expect(409);
    await f.api('post', base).send({ userId: '5', razao_social: 'Empresa', cnpj: '04.252.011/0001-10' }).expect(409);
    const created = await f.api('post', base).send({ userId: '2', razao_social: 'Empresa', nome_cine: 'Cinema', cnpj: '04.252.011/0001-10' }).expect(201);
    assert.equal(created.body.data.cnpj, '04252011000110');
    assert.equal(created.body.data.id_usuario, '2');
    assert.equal(created.headers.location, `${base}/1`);
    await f.api('post', base).send({ userId: '2', razao_social: 'Outra', cnpj: '00.000.000/E08G-12' }).expect(409);
    await f.api('post', base).send({ userId: '4', razao_social: 'Outra', cnpj: '04.252.011/0001-10' }).expect(409);
    await f.api('post', base).send({ userId: '4', razao_social: 'Outra', cnpj: '00.000.000/E08G-12' }).expect(201);
    await f.api('patch', `${base}/1`).send({ nome_cine: 'Novo Cinema' }).expect(200);
    await f.api('patch', `${base}/1`).send({ id_usuario: '4' }).expect(422);
    const page = await f.api('get', `${base}?limit=1&status=ATIVO`).expect(200);
    assert.equal(page.body.data.items.length, 1);
    assert.equal(page.body.data.pagination.nextCursor, '1');
    await f.api('delete', `${base}/1`).expect(204);
    await f.api('delete', `${base}/1`).expect(204);
    assert.equal(f.state.suppliers[0].status, 'INATIVO');
    assert.ok(f.state.audit.some(e => e.type === 'SUPPLIER.ARCHIVED'));
});

test('FORNECEDOR vê apenas próprio DTO redigido; outro ID e ADMIN ficam fechados', async () => {
    const f = fixture(), base = '/api/admin/suppliers';
    await f.api('post', base).send({ userId: '2', razao_social: 'Primeira', cnpj: '04.252.011/0001-10' }).expect(201);
    await f.api('post', base).send({ userId: '4', razao_social: 'Segunda', cnpj: '00.000.000/E08G-12' }).expect(201);
    f.state.suppliers[0].cnpj = '04.252.011/0001-10'; // linha legada conserva pontuação
    await f.api('get', `${base}/2`, '2').expect(403);
    const mine = await f.api('get', '/api/suppliers/me', '2').expect(200);
    assert.equal(mine.body.data.id_fornecedor, '1');
    assert.equal(mine.body.data.cnpj_ultimos4, '0110');
    assert.ok(!('cnpj' in mine.body.data));
    assert.ok(!('id_usuario' in mine.body.data));
    await f.api('get', '/api/suppliers/me', '3').expect(403);
    await f.api('get', '/api/suppliers/me', '1').expect(403);
});

test('SQL final usa nome_cine, IDs parametrizados e campos permitidos', async () => {
    const calls = [], db = { async execute(sql, args) { calls.push({ sql, args }); return [[]]; } }, model = createSupplierModel(db);
    await model.list({ limit: 10, cursor: '3', status: 'ATIVO' });
    assert.ok(calls[0].sql.includes('nome_cine'));
    assert.ok(!calls[0].sql.includes('nome_fantasia'));
    assert.deepEqual(calls[0].args, ['3', 'ATIVO']);
    assert.throws(() => model.update(db, '1', { id_usuario: '4' }), /Campos inválidos/);
});
