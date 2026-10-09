import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import { createComboService } from '../services/comboService.js';
import { createComboController } from '../controllers/comboController.js';
import { comboRoutes } from '../routes/comboRoutes.js';
import { errorMiddleware } from '../middlewares/errorMiddleware.js';
import { ApiError } from '../utils/ApiError.js';
import { createComboModel } from '../models/comboModel.js';

function fixture() {
    let state = { locals: [{ id_local: '1', status: 'ATIVO' }, { id_local: '2', status: 'ATIVO' }], inputs: [
        { id_insumo: '10', id_local: '1', id_fornecedor: '5', nome: 'Milho', status: 'DISPONIVEL', fornecedor_status: 'ATIVO', usuario_status: 'ATIVO', tipo_usuario: 'FORNECEDOR', vinculo_status: 'ATIVO' },
        { id_insumo: '11', id_local: '2', id_fornecedor: '5', nome: 'Copo', status: 'DISPONIVEL', fornecedor_status: 'ATIVO', usuario_status: 'ATIVO', tipo_usuario: 'FORNECEDOR', vinculo_status: 'ATIVO' },
        { id_insumo: '12', id_local: '1', id_fornecedor: '5', nome: 'Sal', status: 'INDISPONIVEL', fornecedor_status: 'ATIVO', usuario_status: 'ATIVO', tipo_usuario: 'FORNECEDOR', vinculo_status: 'ATIVO' }
    ], combos: [], items: [], references: new Set(), audit: [] };
    let next = 1;
    const model = {
        async local(id) { return state.locals.find(x => x.id_local === String(id)) ?? null; },
        async combo(id) { return state.combos.find(x => x.id_combo === String(id)) ?? null; },
        async inputs(ids) { return state.inputs.filter(x => ids.includes(x.id_insumo)); },
        async items(id) { return state.items.filter(x => x.id_combo === String(id)).map(x => ({ id_insumo: x.inputId, quantidade: x.quantidade, nome: state.inputs.find(i => i.id_insumo === x.inputId).nome })); },
        async referenced(id) { return state.references.has(String(id)); },
        async list(q) { return state.combos.filter(c => c.id_local === q.localId && BigInt(c.id_combo) > BigInt(q.cursor ?? '0') && c.ativo && state.locals.find(l => l.id_local === c.id_local)?.status === 'ATIVO' && state.items.some(i => i.id_combo === c.id_combo) && state.items.filter(i => i.id_combo === c.id_combo).every(i => { const input = state.inputs.find(x => x.id_insumo === i.inputId); return input?.id_local === c.id_local && input.status === 'DISPONIVEL' && input.fornecedor_status === 'ATIVO' && input.usuario_status === 'ATIVO' && input.tipo_usuario === 'FORNECEDOR' && input.vinculo_status === 'ATIVO'; })).slice(0, q.limit + 1); },
        async create(c, input) { const id = String(next++); state.combos.push({ id_combo: id, id_local: input.localId, nome: input.nome, descricao: input.descricao ?? null, preco: input.preco, ativo: 1, data_cadastro: '2026-10-08 00:00:00' }); return id; },
        async update(c, id, input) { Object.assign(state.combos.find(x => x.id_combo === String(id)), input); },
        async replaceItems(c, id, items) { state.items = state.items.filter(x => x.id_combo !== String(id)); state.items.push(...items.map(x => ({ ...x, id_combo: String(id) }))); }
    };
    const identity = { async activeActor(c, context) { return { tipo_usuario: context.actor.tipo }; }, async transaction(work) { const saved = structuredClone(state); try { return await work({}); } catch (e) { state = saved; throw e; } }, async audit(c, action, id) { state.audit.push({ action, id }); } };
    const app = express(); app.use(express.json()); app.use((req,res,next) => { res.locals.requestId = '00000000-0000-4000-8000-000000000001'; next(); });
    app.use(comboRoutes(createComboController(createComboService({ model, identity })), { auth(req,res,next) { const role = req.headers['x-role']; if (!role) throw ApiError.naoAutorizado(); req.usuario = { id: '1', tipo: role }; next(); } })); app.use(errorMiddleware);
    const api = (method, path, role = 'ADMIN') => request(app)[method](path).set('X-Role', role);
    return { api, app, get state() { return state; } };
}

test('combo exige itens positivos, distintos e do mesmo local; público só vê composição disponível', async () => {
    const f = fixture(), base = { localId: '1', nome: 'Combo Pipoca', preco: '15.00' };
    await f.api('post', '/api/admin/combos', 'FORNECEDOR').send({ ...base, items: [{ inputId: '10', quantidade: 1 }] }).expect(403);
    await f.api('post', '/api/admin/combos').send({ ...base, items: [{ inputId: '10', quantidade: 1 }, { inputId: '10', quantidade: 2 }] }).expect(422);
    await f.api('post', '/api/admin/combos').send({ ...base, items: [{ inputId: '10', quantidade: 0 }] }).expect(422);
    await f.api('post', '/api/admin/combos').send({ ...base, items: [{ inputId: '11', quantidade: 1 }] }).expect(409);
    await f.api('post', '/api/admin/combos').send({ ...base, items: [{ inputId: '12', quantidade: 1 }] }).expect(409);
    const created = (await f.api('post', '/api/admin/combos').send({ ...base, items: [{ inputId: '10', quantidade: 2 }] }).expect(201)).body.data;
    assert.equal(created.id_local, '1'); assert.equal(created.preco, '15.00'); assert.equal(created.items[0].quantidade, 2);
    const visible = await request(f.app).get('/api/combos?localId=1').expect(200);
    assert.equal(visible.body.data.items.length, 1);
    f.state.inputs[0].status = 'INDISPONIVEL';
    await request(f.app).get('/api/combos?localId=1').expect(200, /"items":\[\]/);
    await request(f.app).get('/api/combos/1').expect(404);
});

test('referência histórica congela edição/composição e arquivamento preserva linhas', async () => {
    const f = fixture();
    await f.api('post', '/api/admin/combos').send({ localId: '1', nome: 'Combo', preco: '10.00', items: [{ inputId: '10', quantidade: 1 }] }).expect(201);
    f.state.references.add('1');
    await f.api('patch', '/api/admin/combos/1').send({ preco: '12.00' }).expect(409);
    await f.api('put', '/api/admin/combos/1/items').send({ items: [{ inputId: '10', quantidade: 3 }] }).expect(409);
    await f.api('delete', '/api/admin/combos/1').expect(204);
    assert.equal(f.state.combos[0].ativo, 0);
    assert.equal(f.state.items.length, 1);
    await f.api('get', '/api/admin/combos/1').expect(200);
    await request(f.app).get('/api/combos/1').expect(404);
});

test('SQL de combos usa IDs parametrizados, valida local e não confunde imagem com variante', async () => {
    const queries = [];
    const db = { async execute(sql, params) { queries.push({ sql, params }); return [[{ id_combo: 1, id_local: 1, nome: 'Combo', descricao: null, preco: '10.00', ativo: 1, data_cadastro: '2026-10-08' }]]; } };
    const model = createComboModel(db);
    await model.combo('1'); await model.referenced('1', db);
    assert.ok(queries.every(q => q.sql.includes('?') && q.params?.length));
    assert.ok(!queries.some(q => /combos_imagens/.test(q.sql)));
});
