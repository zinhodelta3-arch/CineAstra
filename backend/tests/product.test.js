import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import { createProductService } from '../services/productService.js';
import { createProductController } from '../controllers/productController.js';
import { productRoutes } from '../routes/productRoutes.js';
import { createProductModel } from '../models/productModel.js';
import { errorMiddleware } from '../middlewares/errorMiddleware.js';
import { ApiError } from '../utils/ApiError.js';

function fixture() {
    let state = { suppliers: [
        { id_fornecedor: '10', id_usuario: '2', status: 'ATIVO', tipo_usuario: 'FORNECEDOR', usuario_status: 'ATIVO' },
        { id_fornecedor: '11', id_usuario: '3', status: 'ATIVO', tipo_usuario: 'FORNECEDOR', usuario_status: 'ATIVO' }
    ], locals: [{ id_local: '1', status: 'ATIVO' }, { id_local: '2', status: 'ATIVO' }], grants: [{ id_fornecedor: '10', id_local: '1', status: 'ATIVO', criado_em: '2026-10-08 00:00:00' }], inputs: [], equipment: [], audit: [] };
    const roles = new Map([['1','ADMIN'],['2','FORNECEDOR'],['3','FORNECEDOR'],['4','CLIENTE']]);
    let serial = Promise.resolve(), nextInput = 1, nextEquipment = 1;
    const data = type => state[type], key = type => type === 'inputs' ? 'id_insumo' : 'id_equipamento';
    const model = {
        async supplier(id) { return state.suppliers.find(s => s.id_fornecedor === String(id)) ?? null; },
        async supplierByUser(id) { return state.suppliers.find(s => s.id_usuario === String(id)) ?? null; },
        async local(id) { return state.locals.find(l => l.id_local === String(id)) ?? null; },
        async grant(supplierId, localId) { return state.grants.find(g => g.id_fornecedor === String(supplierId) && g.id_local === String(localId)) ?? null; },
        async listGrants(supplierId, q) { return state.grants.filter(g => g.id_fornecedor === String(supplierId) && BigInt(g.id_local) > BigInt(q.cursor ?? '0') && (!q.status || g.status === q.status)).slice(0, q.limit + 1); },
        async upsertGrant(c, supplierId, localId) { let grant = state.grants.find(g => g.id_fornecedor === String(supplierId) && g.id_local === String(localId)); if (grant) grant.status = 'ATIVO'; else state.grants.push({ id_fornecedor: String(supplierId), id_local: String(localId), status: 'ATIVO', criado_em: '2026-10-08 00:00:00' }); },
        async archiveGrant(c, supplierId, localId) { state.grants.find(g => g.id_fornecedor === String(supplierId) && g.id_local === String(localId)).status = 'INATIVO'; },
        async product(type, id) { return data(type).find(row => row[key(type)] === String(id)) ?? null; },
        async list(type, q, supplierId) { return data(type).filter(row => BigInt(row[key(type)]) > BigInt(q.cursor ?? '0') && (!supplierId || row.id_fornecedor === supplierId) && (!q.supplierId || row.id_fornecedor === q.supplierId) && (!q.localId || row.id_local === q.localId) && (!q.status || row.status === q.status)).slice(0, q.limit + 1); },
        async create(type, c, input) {
            if (type === 'equipment' && input.numero_patrimonio && state.equipment.some(e => e.numero_patrimonio?.trim().toUpperCase() === input.numero_patrimonio.trim().toUpperCase())) throw Object.assign(new Error('duplicate'), { code: 'ER_DUP_ENTRY' });
            const id = String(type === 'inputs' ? nextInput++ : nextEquipment++);
            data(type).push({ [key(type)]: id, id_fornecedor: String(input.supplierId), id_local: String(input.localId), nome: input.nome, descricao: input.descricao ?? null, categoria: input.categoria ?? null, quantidade: 0, ...(type === 'inputs' ? { quantidade_minima: input.quantidade_minima ?? 0, preco: input.preco } : { numero_patrimonio: input.numero_patrimonio ?? null }), status: 'DISPONIVEL', data_cadastro: '2026-10-08 00:00:00' }); return id;
        },
        async update(type, c, id, input) { Object.assign(data(type).find(row => row[key(type)] === String(id)), input); }
    };
    const identity = {
        async transaction(fn) { const prior = serial; let release; serial = new Promise(resolve => { release = resolve; }); await prior; const snapshot = structuredClone(state), oldInput = nextInput, oldEquipment = nextEquipment; try { return await fn({}); } catch (error) { state = snapshot; nextInput = oldInput; nextEquipment = oldEquipment; throw error; } finally { release(); } },
        async activeActor(c, context) { return { id_usuario: context.actor.id, tipo_usuario: roles.get(context.actor.id) }; },
        async audit(c, type, id) { state.audit.push({ type, id }); }
    };
    const service = createProductService({ model, identity });
    const app = express(); app.use(express.json());
    app.use((req, res, next) => { res.locals.requestId = '00000000-0000-4000-8000-000000000001'; next(); });
    app.use(productRoutes(createProductController(service), { auth(req, res, next) { const id = req.headers['x-user-id']; if (!id) throw ApiError.naoAutorizado(); const tipo = roles.get(id); if (!tipo) throw ApiError.naoAutorizado(); req.usuario = { id, tipo }; next(); } }));
    app.use(errorMiddleware);
    const api = (method, path, user = '1') => request(app)[method](path).set('X-User-Id', user);
    return { app, api, get state() { return state; } };
}

test('fornecedor cria apenas no local autorizado; ADMIN controla vínculo', async () => {
    const f = fixture();
    await request(f.app).post('/api/inputs').send({ localId: '1', nome: 'Milho', preco: '12.00' }).expect(401);
    await f.api('post', '/api/inputs', '4').send({ localId: '1', nome: 'Milho', preco: '12.00' }).expect(403);
    await f.api('post', '/api/inputs', '2').send({ localId: '2', nome: 'Milho', preco: '12.00' }).expect(403);
    await f.api('post', '/api/inputs', '2').send({ supplierId: '11', localId: '1', nome: 'Milho', preco: '12.00' }).expect(403);
    await f.api('post', '/api/inputs').send({ localId: '1', nome: 'Milho', preco: '12.00' }).expect(422);
    const created = await f.api('post', '/api/inputs', '2').send({ localId: '1', nome: 'Milho', preco: '12.00', quantidade_minima: 5 }).expect(201);
    assert.equal(created.body.data.id_fornecedor, '10');
    assert.equal(created.body.data.quantidade, 0);
    assert.equal(created.body.data.preco, '12.00');
    await f.api('get', '/api/suppliers/me/locations', '2').expect(200);
    await f.api('post', '/api/admin/suppliers/10/locations', '2').send({ localId: '2' }).expect(403);
    await f.api('post', '/api/admin/suppliers/10/locations').send({ localId: '2' }).expect(201);
    await f.api('post', '/api/inputs', '2').send({ localId: '2', nome: 'Óleo', preco: '1.00' }).expect(201);
    await f.api('delete', '/api/admin/suppliers/10/locations/2').expect(204);
    await f.api('post', '/api/inputs', '2').send({ localId: '2', nome: 'Açúcar', preco: '2.00' }).expect(403);
});

test('fornecedor alheio não lê/edita; saldo e custo não aceitam PATCH genérico', async () => {
    const f = fixture();
    await f.api('post', '/api/inputs', '2').send({ localId: '1', nome: 'Milho', preco: '12.00' }).expect(201);
    await f.api('get', '/api/inputs/1', '3').expect(403);
    await f.api('patch', '/api/inputs/1', '3').send({ nome: 'Invadido' }).expect(403);
    await f.api('delete', '/api/inputs/1', '3').expect(403);
    await f.api('patch', '/api/inputs/1', '2').send({ quantidade: 100 }).expect(422);
    await f.api('patch', '/api/inputs/1', '2').send({ custo: '0.01' }).expect(422);
    await f.api('post', '/api/inputs', '2').send({ localId: '1', nome: 'Falso', preco: '1.00', quantidade: 100 }).expect(422);
    await f.api('patch', '/api/inputs/1', '2').send({ preco: 1.5 }).expect(422);
    await f.api('patch', '/api/inputs/1', '2').send({ preco: '13.50' }).expect(200);
    const mine = await f.api('get', '/api/inputs?supplierId=11', '2').expect(403);
    assert.equal(f.state.inputs[0].quantidade, 0);
    assert.equal(mine.status, 403);
});

test('patrimônio único normalizado, equipamento e arquivamento preservam registro', async () => {
    const f = fixture();
    const created = await f.api('post', '/api/equipment', '2').send({ localId: '1', nome: 'Projetor', numero_patrimonio: ' ab-1 ' }).expect(201);
    assert.equal(created.body.data.numero_patrimonio, 'AB-1');
    await f.api('post', '/api/equipment', '2').send({ localId: '1', nome: 'Outro', numero_patrimonio: 'ab-1' }).expect(409);
    await f.api('patch', '/api/equipment/1', '2').send({ quantidade: 9 }).expect(422);
    await f.api('patch', '/api/equipment/1', '2').send({ status: 'MANUTENCAO' }).expect(200);
    await f.api('delete', '/api/equipment/1', '2').expect(204);
    assert.equal(f.state.equipment[0].status, 'INDISPONIVEL');
    await f.api('get', '/api/equipment/1', '2').expect(200);
});

test('SQL usa filtros por fornecedor/local, preço exato e bloqueia atualização de saldo', async () => {
    const calls = [], db = { async execute(sql, args) { calls.push({ sql, args }); return [[]]; } }, model = createProductModel(db);
    await model.list('inputs', { limit: 10, cursor: '2', localId: '7', status: 'DISPONIVEL' }, '10');
    assert.ok(calls[0].sql.includes('id_fornecedor = ?'));
    assert.ok(calls[0].sql.includes('id_local = ?'));
    assert.deepEqual(calls[0].args, ['2', '10', '7', 'DISPONIVEL']);
    assert.throws(() => model.update('inputs', db, '1', { quantidade: 100 }), /Campos inválidos/);
    assert.throws(() => model.update('inputs', db, '1', { custo: '1.00' }), /Campos inválidos/);
    assert.throws(() => model.update('equipment', db, '1', { id_local: '2' }), /Campos inválidos/);
});
