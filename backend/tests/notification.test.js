import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import { createNotificationService } from '../services/notificationService.js';
import { createNotificationModel } from '../models/notificationModel.js';
import { createNotificationController } from '../controllers/notificationController.js';
import { notificationRoutes } from '../routes/notificationRoutes.js';
import { errorMiddleware } from '../middlewares/errorMiddleware.js';
import { ApiError } from '../utils/ApiError.js';

function fixture() {
    let state = { notifications: [] }, next = 1, serial = Promise.resolve();
    const model = {
        async list(userId, q) { return state.notifications.filter(n => n.id_usuario === userId && BigInt(n.id_notificacao) > BigInt(q.cursor ?? '0') && (q.unread === undefined || n.lida === !q.unread) && (!q.type || n.tipo === q.type)).slice(0, q.limit + 1); },
        async own(c, userId, id) { return state.notifications.find(n => n.id_usuario === userId && n.id_notificacao === String(id)) ?? null; },
        async emit(c, input) { let row = state.notifications.find(n => n.id_usuario === input.recipientId && n.dedupe_key === input.dedupeKey); if (!row) { row = { id_notificacao: String(next++), id_usuario: input.recipientId, titulo: input.title, mensagem: input.message, tipo: input.type, dedupe_key: input.dedupeKey, lida: false, data_envio: '2026-10-08 00:00:00' }; state.notifications.push(row); } return row; },
        async markRead(c, userId, id) { const row = await this.own(c, userId, id); if (row) row.lida = true; return row; }
    };
    const identity = {
        async transaction(fn) { const prior = serial; let release; serial = new Promise(resolve => { release = resolve; }); await prior; const snapshot = structuredClone(state), oldNext = next; try { return await fn({ execute() {} }); } catch (error) { state = snapshot; next = oldNext; throw error; } finally { release(); } },
        async activeActor(c, context) { return { id_usuario: context.actor.id, tipo_usuario: context.actor.tipo }; }
    };
    const service = createNotificationService({ model, identity });
    const app = express(); app.use(express.json());
    app.use((req, res, next) => { res.locals.requestId = '00000000-0000-4000-8000-000000000001'; next(); });
    app.use(notificationRoutes(createNotificationController(service), { auth(req, res, next) { const id = req.headers['x-user-id']; if (!id) throw ApiError.naoAutorizado(); req.usuario = { id, tipo: 'CLIENTE' }; next(); } }));
    app.use(errorMiddleware);
    const api = (method, path, user = '1') => request(app)[method](path).set('X-User-Id', user);
    return { app, api, service, get state() { return state; } };
}

test('emissão interna deduplica retry sem reabrir lida; não há POST público', async () => {
    const f = fixture(), input = { recipientId: '1', title: 'Convite', message: 'Convite para equipe', type: 'TEAM_INVITATION', dedupeKey: 'team-invitation:1' };
    await assert.rejects(f.service.emit(null, input), /Conexão transacional/);
    const first = await f.service.emit({ execute() {} }, input);
    assert.equal(first.id_notificacao, '1');
    await f.api('patch', '/api/notifications/me/1/read').expect(200);
    const retry = await f.service.emit({ execute() {} }, input);
    assert.equal(retry.id_notificacao, '1');
    assert.equal(retry.lida, true);
    assert.equal(f.state.notifications.length, 1);
    await f.api('post', '/api/notifications/me').send(input).expect(404);
});

test('usuário lista e marca apenas notificações próprias; filtros e cursor BIGINT', async () => {
    const f = fixture(), c = { execute() {} };
    await f.service.emit(c, { recipientId: '1', title: 'A', message: 'A', type: 'TEAM_INVITATION', dedupeKey: 'event:1' });
    await f.service.emit(c, { recipientId: '2', title: 'B', message: 'B', type: 'TEAM_INVITATION', dedupeKey: 'event:2' });
    await f.service.emit(c, { recipientId: '1', title: 'C', message: 'C', type: 'TASK', dedupeKey: 'event:3' });
    await request(f.app).get('/api/notifications/me').expect(401);
    const first = await f.api('get', '/api/notifications/me?limit=1').expect(200);
    assert.equal(first.body.data.items.length, 1);
    assert.equal(first.body.data.pagination.nextCursor, '1');
    assert.ok(!('id_usuario' in first.body.data.items[0]));
    const next = await f.api('get', '/api/notifications/me?limit=1&cursor=1').expect(200);
    assert.equal(next.body.data.items[0].id_notificacao, '3');
    await f.api('patch', '/api/notifications/me/2/read').expect(404);
    await f.api('patch', '/api/notifications/me/1/read').expect(200);
    assert.equal(f.state.notifications.find(n => n.id_notificacao === '2').lida, false);
    const unread = await f.api('get', '/api/notifications/me?unread=true').expect(200);
    assert.deepEqual(unread.body.data.items.map(n => n.id_notificacao), ['3']);
    const byType = await f.api('get', '/api/notifications/me?type=TEAM_INVITATION').expect(200);
    assert.deepEqual(byType.body.data.items.map(n => n.id_notificacao), ['1']);
    await f.api('get', '/api/notifications/me?cursor=18446744073709551616').expect(422);
});

test('SQL vincula leitura e marcação ao ator; dedupe tem chave estável', async () => {
    const calls = [], db = { async execute(sql, args) { calls.push({ sql, args }); return [[]]; } }, model = createNotificationModel(db);
    await model.list('7', { limit: 20, cursor: '9007199254740993', unread: true, type: 'TEAM_INVITATION' });
    assert.ok(calls[0].sql.includes('id_usuario = ?'));
    assert.deepEqual(calls[0].args, ['7', '9007199254740993', 0, 'TEAM_INVITATION']);
    await model.markRead(db, '7', '9');
    assert.deepEqual(calls[1].args, ['7', '9']);
    assert.deepEqual(calls[2].args, ['7', '9']);
});
