import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import { createVenueService } from '../services/venueService.js';
import { createVenueController } from '../controllers/venueController.js';
import { venueRoutes } from '../routes/venueRoutes.js';
import { venueSchemas } from '../validators/venueValidators.js';
import { createVenueModel } from '../models/venueModel.js';
import { errorMiddleware } from '../middlewares/errorMiddleware.js';
import { deadline } from '../middlewares/requestMiddleware.js';
import { ApiError } from '../utils/ApiError.js';

function fixture() {
    let state = { local: [], room: [], seat: [], sessions: [], events: [] }, next = 1, chain = Promise.resolve();
    const pk = { local: 'id_local', room: 'id_sala', seat: 'id_assento' };
    const status = { local: 'ATIVO', room: 'ATIVA', seat: 'ATIVA' };
    const model = {
        local: async id => state.local.find(r => r.id_local === id) ?? null,
        room: async (localId, id) => state.room.find(r => r.id_local === localId && r.id_sala === id) ?? null,
        seat: async (roomId, id) => state.seat.find(r => r.id_sala === roomId && r.id_assento === id) ?? null,
        async list(kind, parentId, q, admin) { return state[kind].filter(r => BigInt(r[pk[kind]]) > BigInt(q.cursor ?? '0') && (!parentId || r[kind === 'room' ? 'id_local' : 'id_sala'] === parentId) && (admin || r.status === status[kind]) && (!q.status || r.status === q.status) && (kind !== 'seat' || q.accessible === undefined || ['PCD', 'OBESO', 'IDOSO'].includes(r.tipo) === q.accessible)).slice(0, q.limit + 1); },
        async insert(kind, c, parentId, input) {
            const row = { [pk[kind]]: String(next++), ...(parentId ? { [kind === 'room' ? 'id_local' : 'id_sala']: parentId } : {}), ...input };
            if (kind === 'room' && state.room.some(r => r.id_local === parentId && r.nome === row.nome) || kind === 'seat' && state.seat.some(r => r.id_sala === parentId && r.fileira === row.fileira && r.numero === row.numero)) throw Object.assign(Error('duplicate'), { code: 'ER_DUP_ENTRY' });
            state[kind].push(row); return row[pk[kind]];
        },
        async update(kind, c, id, input) { const row = state[kind].find(r => r[pk[kind]] === id); Object.assign(row, input); },
        async activeSeats(c, roomId) { return { total: state.seat.filter(r => r.id_sala === roomId && r.status === 'ATIVA').length }; },
        async activeRooms(c, localId) { return { total: state.room.filter(r => r.id_local === localId && r.status === 'ATIVA').length }; },
        async roomSessions(c, roomId) { return state.sessions.find(r => r.roomId === roomId) ?? null; },
        async localSessions(c, localId) { return state.sessions.find(s => state.room.some(r => r.id_sala === s.roomId && r.id_local === localId)) ?? null; }
    };
    const identity = {
        async transaction(fn) { const prior = chain; let release; chain = new Promise(resolve => { release = resolve; }); await prior; const snapshot = structuredClone(state); const last = next; try { return await fn({}); } catch (error) { state = snapshot; next = last; throw error; } finally { release(); } },
        async activeActor(c, ctx) { return { tipo_usuario: ctx.actor?.tipo }; },
        async audit(c, type, id) { state.events.push({ type, id }); }
    };
    const service = createVenueService({ model, identity });
    const app = express(); app.use(deadline(3000), express.json()); app.use((req, res, next) => { res.locals.requestId = '00000000-0000-4000-8000-000000000001'; next(); });
    app.use(venueRoutes(createVenueController(service), { auth(req, res, next) { if (!req.headers['x-fixture-role']) throw ApiError.naoAutorizado(); req.usuario = { id: '1', tipo: req.headers['x-fixture-role'] }; next(); } })); app.use(errorMiddleware);
    const api = (method, path, role = 'ADMIN') => request(app)[method](path).set('X-Fixture-Role', role);
    return { app, api, service, get state() { return state; }, addSession(roomId) { state.sessions.push({ roomId }); } };
}
const localInput = { nome: 'Cine Centro', cidade: 'São Paulo', estado: 'SP' };

test('locais: CRUD autorizado, paginação e contexto público ativo', async () => {
    const f = fixture();
    await request(f.app).post('/api/admin/locations').send(localInput).expect(401);
    await f.api('post', '/api/admin/locations', 'CLIENTE').send(localInput).expect(403);
    const a = await f.api('post', '/api/admin/locations').send(localInput).expect(201);
    const b = await f.api('post', '/api/admin/locations').send({ ...localInput, nome: 'Cine Norte' }).expect(201);
    assert.equal(a.headers.location, `/api/admin/locations/${a.body.data.id_local}`);
    const first = await request(f.app).get('/api/locations?limit=1').expect(200);
    assert.equal(first.body.data.items.length, 1);
    assert.equal((await request(f.app).get(`/api/locations?limit=1&cursor=${first.body.data.pagination.nextCursor}`).expect(200)).body.data.items[0].id_local, b.body.data.id_local);
    await f.api('patch', a.headers.location).send({ telefone: '11999999999' }).expect(200);
    await f.api('delete', a.headers.location).expect(204);
    await request(f.app).get(`/api/locations/${a.body.data.id_local}`).expect(404);
    await f.api('get', a.headers.location).expect(200);
    assert.equal(f.state.local.length, 2);
});

test('salas e assentos: capacidade, acessibilidade, duplicidade e sala alheia', async () => {
    const f = fixture();
    const l1 = (await f.api('post', '/api/admin/locations').send(localInput).expect(201)).body.data.id_local;
    const l2 = (await f.api('post', '/api/admin/locations').send({ ...localInput, nome: 'Outro' }).expect(201)).body.data.id_local;
    const room = (await f.api('post', `/api/admin/locations/${l1}/rooms`).send({ nome: 'Sala 1', capacidade: 2 }).expect(201)).body.data;
    const base = `/api/admin/locations/${l1}/rooms/${room.id_sala}`;
    await f.api('post', `/api/admin/locations/${l1}/rooms`).send({ nome: 'Sala 1', capacidade: 2 }).expect(409);
    await request(f.app).get(`/api/locations/${l1}/rooms/${room.id_sala}`).expect(404);
    await f.api('post', `/api/admin/locations/${l2}/rooms/${room.id_sala}/seats`).send({ fileira: 'A', numero: 1 }).expect(404);
    const a = (await f.api('post', `${base}/seats`).send({ fileira: 'a', numero: 1, tipo: 'PCD' }).expect(201)).body.data;
    await f.api('post', `${base}/seats`).send({ fileira: 'A', numero: 1 }).expect(409);
    await f.api('patch', base).send({ status: 'ATIVA' }).expect(409);
    await f.api('post', `${base}/seats`).send({ fileira: 'A', numero: 2 }).expect(201);
    await f.api('post', `${base}/seats`).send({ fileira: 'A', numero: 3 }).expect(409);
    await f.api('patch', base).send({ status: 'ATIVA' }).expect(200);
    const accessible = await request(f.app).get(`/api/locations/${l1}/rooms/${room.id_sala}/seats?accessible=true`).expect(200);
    assert.deepEqual(accessible.body.data.items.map(r => r.id_assento), [a.id_assento]);
    assert.equal(accessible.body.data.items[0].acessivel, true);
    await request(f.app).get(`/api/locations/${l2}/rooms/${room.id_sala}/seats/${a.id_assento}`).expect(404);
});

test('sessão vinculada congela estrutura e impede arquivamento de local/sala/assento', async () => {
    const f = fixture(), l = (await f.api('post', '/api/admin/locations').send(localInput).expect(201)).body.data.id_local;
    const r = (await f.api('post', `/api/admin/locations/${l}/rooms`).send({ nome: 'Sala', capacidade: 1 }).expect(201)).body.data.id_sala;
    const base = `/api/admin/locations/${l}/rooms/${r}`;
    const s = (await f.api('post', `${base}/seats`).send({ fileira: 'A', numero: 1 }).expect(201)).body.data.id_assento;
    await f.api('patch', base).send({ status: 'ATIVA' }).expect(200);
    f.addSession(r);
    await f.api('patch', base).send({ capacidade: 2 }).expect(409);
    await f.api('post', `${base}/seats`).send({ fileira: 'A', numero: 2 }).expect(409);
    await f.api('delete', `${base}/seats/${s}`).expect(409);
    await f.api('delete', base).expect(409);
    await f.api('delete', `/api/admin/locations/${l}`).expect(409);
    await f.api('patch', `/api/admin/locations/${l}`).send({ telefone: '1133334444' }).expect(200);
    assert.equal(f.state.seat[0].status, 'ATIVA');
});

test('validação estrita e SQL parametrizado sem alterar chaves externas', async () => {
    assert.equal(venueSchemas.local.safeParse({ ...localInput, id_local: '1' }).success, false);
    assert.equal(venueSchemas.seat.safeParse({ fileira: 'A', numero: 0 }).success, false);
    assert.equal(venueSchemas.roomPatch.safeParse({}).success, false);
    const calls = [], db = { async execute(sql, params) { calls.push({ sql, params }); return [[{ total: 0 }]]; } }, model = createVenueModel(db);
    await model.list('room', '1', { limit: 10, cursor: '0' }, false);
    assert.ok(calls[0].sql.includes('id_local = ?'));
    await assert.rejects(model.update('seat', db, '1', { id_sala: '2' }), /Campo inválido/);
    await model.roomSessions(db, '3');
    assert.ok(calls.at(-1).sql.includes('id_sala = ?'));
    assert.deepEqual(calls.at(-1).params, ['3']);
});
