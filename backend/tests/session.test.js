import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import { createSessionService, interval } from '../services/sessionService.js';
import { createSessionController } from '../controllers/sessionController.js';
import { sessionRoutes } from '../routes/sessionRoutes.js';
import { sessionSchemas } from '../validators/sessionValidators.js';
import { createSessionModel } from '../models/sessionModel.js';
import { deadline } from '../middlewares/requestMiddleware.js';
import { errorMiddleware } from '../middlewares/errorMiddleware.js';
import { ApiError } from '../utils/ApiError.js';

function fixture() {
    let state = { sessions: [], items: [], events: [], local: { id_local: '1', status: 'ATIVO' },
        rooms: [{ id_sala: '1', id_local: '1', sala_status: 'ATIVA', capacidade: 1 }, { id_sala: '2', id_local: '1', sala_status: 'ATIVA', capacidade: 1 }],
        film: { id_filme: '1', status: 'ATIVO', disponivel_cinema: true, duracao: 60 } }, next = 1, chain = Promise.resolve();
    const model = {
        async session(id) { return state.sessions.find(s => s.id_sessao === id) ?? null; },
        async sessionForUpdate(id) { return state.sessions.find(s => s.id_sessao === id) ?? null; },
        async room(id) { const room = state.rooms.find(r => r.id_sala === id); return room ? { ...room, local_status: state.local.status } : null; },
        async local(id) { return id === '1' ? state.local : null; },
        async film(id) { return id === state.film.id_filme ? state.film : null; },
        async activeSeats() { return { total: 1 }; },
        async hasItems(id) { return state.items.find(i => i === id) ? { id_item: '1' } : null; },
        async overlapCandidates(localId, start, end, excludeId) { return state.sessions.filter(s => s.id_local === localId && s.data >= start && s.data <= end && s.status !== 'CANCELADA' && s.id_sessao !== excludeId); },
        async list(q, admin) { return state.sessions.filter(s => BigInt(s.id_sessao) > BigInt(q.cursor ?? '0') && (!q.localId || s.id_local === q.localId) && (!q.date || s.data === q.date) && (!q.startFrom || s.horario_inicio >= q.startFrom) && (!q.startUntil || s.horario_inicio <= q.startUntil) && (admin ? !q.status || s.status === q.status : ['AGENDADA','EM_CARTAZ'].includes(s.status) && state.local.status === 'ATIVO' && state.rooms.find(r => r.id_sala === s.id_sala).sala_status === 'ATIVA' && state.film.status === 'ATIVO')).slice(0, q.limit + 1); },
        async publicSession(id) { const s = state.sessions.find(s => s.id_sessao === id); return s && ['AGENDADA','EM_CARTAZ'].includes(s.status) && state.local.status === 'ATIVO' ? s : null; },
        async insert(c, row) { const id = String(next++); state.sessions.push({ id_sessao: id, id_local: '1', ...row }); return id; },
        async update(c, id, input) { Object.assign(state.sessions.find(s => s.id_sessao === id), input); }
    };
    const identity = {
        async transaction(fn) { const previous = chain; let release; chain = new Promise(resolve => { release = resolve; }); await previous; const snapshot = structuredClone(state), oldNext = next; try { return await fn({}); } catch (error) { state = snapshot; next = oldNext; throw error; } finally { release(); } },
        async activeActor(c, context) { return { tipo_usuario: context.actor?.tipo }; },
        async audit(c, type, id) { state.events.push({ type, id }); }
    };
    const service = createSessionService({ model, identity });
    const app = express(); app.use(deadline(3000), express.json()); app.use((req, res, next) => { res.locals.requestId = '00000000-0000-4000-8000-000000000001'; next(); });
    app.use(sessionRoutes(createSessionController(service), { auth(req, res, next) { if (!req.headers['x-fixture-role']) throw ApiError.naoAutorizado(); req.usuario = { id: '1', tipo: req.headers['x-fixture-role'] }; next(); } })); app.use(errorMiddleware);
    const api = (method, path, role = 'ADMIN') => request(app)[method](path).set('X-Fixture-Role', role);
    return { app, api, service, get state() { return state; }, addItem(id) { state.items.push(id); } };
}
const body = (data = '2026-10-10', start = '10:00', end = '12:00', room = '1') => ({ id_filme: '1', id_sala: room, data, horario_inicio: start, horario_fim: end, preco_inteira: '20.00' });

test('RN19: intervalo de uma hora no mesmo local, inclusive salas distintas e limite exato', async () => {
    const f = fixture();
    await request(f.app).post('/api/admin/sessions').send(body()).expect(401);
    await f.api('post', '/api/admin/sessions', 'CLIENTE').send(body()).expect(403);
    const first = await f.api('post', '/api/admin/sessions').send(body()).expect(201);
    assert.equal(first.body.data.data_fim, '2026-10-10');
    assert.equal(first.headers.location, `/api/admin/sessions/${first.body.data.id_sessao}`);
    await f.api('post', '/api/admin/sessions').send(body('2026-10-10', '12:59', '14:00', '2')).expect(409);
    const boundary = await f.api('post', '/api/admin/sessions').send(body('2026-10-10', '13:00', '15:00', '2')).expect(201);
    assert.equal(boundary.body.data.preco_inteira, '20.00');
    const list = await request(f.app).get('/api/sessions?localId=1&date=2026-10-10&limit=1').expect(200);
    assert.equal(list.body.data.items.length, 1);
    assert.ok(list.body.data.pagination.nextCursor);
    await f.api('patch', `/api/admin/sessions/${boundary.body.data.id_sessao}`).send({ horario_inicio: '12:30' }).expect(409);
    assert.equal(f.state.sessions[1].horario_inicio, '13:00:00');
});

test('meia-noite, dia anterior/seguinte e corrida concorrente', async () => {
    const f = fixture();
    const overnight = await f.api('post', '/api/admin/sessions').send(body('2026-10-10', '23:30', '00:30')).expect(201);
    assert.equal(overnight.body.data.data_fim, '2026-10-11');
    await f.api('post', '/api/admin/sessions').send(body('2026-10-11', '01:29', '03:00', '2')).expect(409);
    await f.api('post', '/api/admin/sessions').send(body('2026-10-11', '01:30', '03:00', '2')).expect(201);
    await f.api('post', '/api/admin/sessions').send(body('2026-10-09', '22:30', '22:31', '2')).expect(422);
    const g = fixture();
    const outcomes = await Promise.all([g.api('post', '/api/admin/sessions').send(body()), g.api('post', '/api/admin/sessions').send(body('2026-10-10', '11:00', '13:00', '2'))]);
    assert.deepEqual(outcomes.map(r => r.status).sort(), [201, 409]);
    assert.equal(g.state.sessions.length, 1);
    assert.equal(interval({ data: '2026-10-10', horario_inicio: '23:30:00', horario_fim: '00:30:00' }).end - interval({ data: '2026-10-10', horario_inicio: '23:30:00', horario_fim: '00:30:00' }).start, 3_600_000);
});

test('itens de pedido congelam preço/horário e cancelamento; avanço de status permitido', async () => {
    const f = fixture(), created = await f.api('post', '/api/admin/sessions').send(body()).expect(201), id = created.body.data.id_sessao;
    f.addItem(id);
    await f.api('patch', `/api/admin/sessions/${id}`).send({ preco_inteira: '30.00' }).expect(409);
    await f.api('patch', `/api/admin/sessions/${id}`).send({ data: '2026-10-11' }).expect(409);
    await f.api('delete', `/api/admin/sessions/${id}`).expect(409);
    await f.api('patch', `/api/admin/sessions/${id}`).send({ status: 'EM_CARTAZ' }).expect(200);
    await f.api('patch', `/api/admin/sessions/${id}`).send({ status: 'ENCERRADA' }).expect(200);
    await request(f.app).get(`/api/sessions/${id}`).expect(404);
    await f.api('get', `/api/admin/sessions/${id}`).expect(200);
    assert.equal(f.state.sessions[0].preco_inteira, '20.00');
});

test('RN20 não limita sessão administrativa; validação e SQL parametrizado', async () => {
    const f = fixture();
    await f.api('post', '/api/admin/sessions').send(body('2026-10-10', '10:00', '16:00')).expect(201);
    assert.equal(sessionSchemas.create.safeParse({ ...body(), preco_inteira: 20 }).success, false);
    assert.equal(sessionSchemas.create.safeParse({ ...body(), horario_inicio: '25:00' }).success, false);
    assert.equal(sessionSchemas.patch.safeParse({ id_sala: '2' }).success, false);
    assert.equal(sessionSchemas.patch.safeParse({}).success, false);
    const calls = [], db = { async execute(sql, args) { calls.push({ sql, args }); return [[]]; } }, model = createSessionModel(db);
    await model.overlapCandidates('1', '2026-10-08', '2026-10-12', '9', db);
    assert.ok(calls[0].sql.includes('sa.id_local = ?'));
    assert.deepEqual(calls[0].args, ['1', '2026-10-08', '2026-10-12', '9']);
    assert.throws(() => model.update(db, '1', { id_sala: '2' }), /Campos inválidos/);
});
