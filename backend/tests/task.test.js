import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import { createTaskService } from '../services/taskService.js';
import { createTaskController } from '../controllers/taskController.js';
import { taskRoutes } from '../routes/taskRoutes.js';
import { createTaskModel } from '../models/taskModel.js';
import { errorMiddleware } from '../middlewares/errorMiddleware.js';
import { ApiError } from '../utils/ApiError.js';

function fixture() {
    let state = {
        team: { id_equipe: '1', id_supervisor: '1', id_sessao: '10', status: 'ATIVA', sessao_status: 'AGENDADA' },
        members: [{ id_usuario: '3', status: 'ATIVO', tipo_usuario: 'COLABORADOR', usuario_status: 'ATIVO', funcao: 'Projeção' }, { id_usuario: '4', status: 'ATIVO', tipo_usuario: 'COLABORADOR', usuario_status: 'ATIVO', funcao: 'Portaria' }],
        tasks: [], events: [], audit: []
    };
    const users = new Map([['1','SUPERVISOR'],['2','SUPERVISOR'],['3','COLABORADOR'],['4','COLABORADOR'],['5','COLABORADOR'],['6','ADMIN'],['7','CLIENTE']]);
    let nextTask = 1, nextEvent = 1, serial = Promise.resolve();
    const item = id => state.tasks.find(t => t.id_chamado === String(id));
    const model = {
        async team(id) { return String(id) === '1' ? state.team : null; },
        async membership(id, userId) { return String(id) === '1' ? state.members.find(m => m.id_usuario === String(userId)) ?? null : null; },
        async task(teamId, id) { const t = item(id); return t?.id_equipe === String(teamId) ? t : null; },
        async list(teamId, sessionId, q, actorId) { return state.tasks.filter(t => t.id_equipe === String(teamId) && t.id_sessao === String(sessionId) && BigInt(t.id_chamado) > BigInt(q.cursor ?? '0') && (!q.status || t.status === q.status) && (!q.assigned || t.id_responsavel === actorId)); },
        async create(c, input) { const id = String(nextTask++); state.tasks.push({ id_chamado: id, id_criador: input.actorId, id_responsavel: null, id_sessao: String(input.sessionId), id_equipe: String(input.teamId), titulo: input.titulo, descricao: input.descricao ?? null, prioridade: input.prioridade ?? 'MEDIA', status: 'ABERTO', data_abertura: '2026-10-08 00:00:00', data_fechamento: null }); return id; },
        async update(c, teamId, id, data) { Object.assign(item(id), data); },
        async event(c, input) { const id = String(nextEvent++); state.events.push({ id_evento: id, id_chamado: String(input.taskId), id_ator: input.actorId, acao: input.action, status_anterior: input.before, status_novo: input.after, id_responsavel: input.responsibleId, criado_em: '2026-10-08 00:00:00' }); return id; },
        async history(teamId, taskId, q) { return state.events.filter(e => e.id_chamado === String(taskId) && BigInt(e.id_evento) > BigInt(q.cursor ?? '0')); }
    };
    const identity = {
        async transaction(fn) { const prior = serial; let release; serial = new Promise(resolve => { release = resolve; }); await prior; const snapshot = structuredClone(state), oldTask = nextTask, oldEvent = nextEvent; try { return await fn({}); } catch (error) { state = snapshot; nextTask = oldTask; nextEvent = oldEvent; throw error; } finally { release(); } },
        async activeActor(c, context) { return { id_usuario: context.actor.id, tipo_usuario: users.get(context.actor.id) }; },
        async audit(c, type, id) { state.audit.push({ type, id }); }
    };
    const service = createTaskService({ model, identity });
    const app = express(); app.use(express.json());
    app.use((req, res, next) => { res.locals.requestId = '00000000-0000-4000-8000-000000000001'; next(); });
    app.use(taskRoutes(createTaskController(service), { auth(req, res, next) { const id = req.headers['x-user-id']; if (!id || !users.has(id)) throw ApiError.naoAutorizado(); req.usuario = { id, tipo: users.get(id) }; next(); } }));
    app.use(errorMiddleware);
    const api = (method, path, user = '1') => request(app)[method](path).set('X-User-Id', user);
    return { app, api, service, get state() { return state; } };
}

test('contexto de equipe/sessão, perfil e autor restritos em cada chamado', async () => {
    const f = fixture(), base = '/api/teams/1/chamados';
    await request(f.app).post(base).send({ titulo: 'Projetor' }).expect(401);
    await f.api('post', base, '7').send({ titulo: 'Projetor' }).expect(403);
    await f.api('post', base, '2').send({ titulo: 'Projetor' }).expect(403);
    await f.api('post', base, '5').send({ titulo: 'Projetor' }).expect(403);
    f.state.members[0].funcao = null;
    await f.api('post', base, '3').send({ titulo: 'Projetor' }).expect(403);
    f.state.members[0].funcao = 'Projeção';
    const created = await f.api('post', base, '3').send({ titulo: 'Projetor', prioridade: 'ALTA' }).expect(201);
    assert.equal(created.body.data.id_sessao, '10');
    assert.equal(created.body.data.id_equipe, '1');
    await f.api('get', `${base}/1`, '2').expect(403);
    await f.api('get', '/api/teams/2/chamados/1', '6').expect(404);
    await f.api('patch', `${base}/1`, '4').send({ titulo: 'Invasão' }).expect(403);
    await f.api('patch', `${base}/1`, '3').send({ id_sessao: '99' }).expect(422);
    f.state.team.sessao_status = 'CANCELADA';
    await f.api('post', base, '3').send({ titulo: 'Tarde' }).expect(409);
});

test('atribuição e duplo aceite atômico; transições e histórico', async () => {
    const f = fixture(), base = '/api/teams/1/chamados';
    await f.api('post', base).send({ titulo: 'Áudio' }).expect(201);
    await f.api('post', `${base}/1/assign`, '3').send({ userId: '3' }).expect(403);
    await f.api('post', `${base}/1/assign`).send({ userId: '5' }).expect(409);
    await f.api('post', `${base}/1/assign`).send({ userId: '4' }).expect(200);
    await f.api('post', `${base}/1/accept`, '3').expect(409);
    await f.api('post', `${base}/1/accept`, '4').expect(200);
    await f.api('post', `${base}/1/accept`, '4').expect(409);
    await f.api('post', `${base}/1/close`, '4').expect(409);
    await f.api('post', `${base}/1/resolve`, '3').expect(403);
    await f.api('post', `${base}/1/resolve`, '4').expect(200);
    await f.api('post', `${base}/1/close`, '4').expect(200);
    assert.equal(f.state.tasks[0].status, 'FECHADO');
    assert.deepEqual(f.state.events.map(e => e.acao), ['CRIADO','ATRIBUIDO','ACEITO','RESOLVIDO','FECHADO']);
    const history = await f.api('get', `${base}/1/history`, '4').expect(200);
    assert.equal(history.body.data.items.length, 5);
    const mine = await f.api('get', `${base}?assigned=me`, '4').expect(200);
    assert.equal(mine.body.data.items.length, 1);
});

test('aceite simultâneo sem atribuição tem exatamente um vencedor', async () => {
    const f = fixture(), base = '/api/teams/1/chamados';
    await f.api('post', base).send({ titulo: 'Cabo' }).expect(201);
    const outcomes = await Promise.all([f.api('post', `${base}/1/accept`, '3'), f.api('post', `${base}/1/accept`, '4')]);
    assert.deepEqual(outcomes.map(r => r.status).sort(), [200, 409]);
    assert.equal(f.state.events.filter(e => e.acao === 'ACEITO').length, 1);
    assert.equal(f.state.tasks[0].status, 'EM_ANDAMENTO');
});

test('exclusão é cancelamento lógico apenas de chamado aberto não atribuído', async () => {
    const f = fixture(), base = '/api/teams/1/chamados';
    await f.api('post', base, '3').send({ titulo: 'Sinal' }).expect(201);
    await f.api('delete', `${base}/1`, '4').expect(403);
    await f.api('delete', `${base}/1`, '3').expect(204);
    assert.equal(f.state.tasks[0].status, 'CANCELADO');
    assert.equal(f.state.events.at(-1).acao, 'CANCELADO');
    await f.api('delete', `${base}/1`, '3').expect(409);
    await f.api('get', `${base}/1`, '3').expect(200);
});

test('SQL parametrizado, filtro por responsável e whitelist de campos', async () => {
    const calls = [], db = { async execute(sql, args) { calls.push({ sql, args }); return [[]]; } }, model = createTaskModel(db);
    await model.list('1', '10', { limit: 10, cursor: '2', status: 'ABERTO', assigned: 'me' }, '3');
    assert.ok(calls[0].sql.includes('id_responsavel = ?'));
    assert.deepEqual(calls[0].args, ['1', '10', '2', 'ABERTO', '3']);
    assert.throws(() => model.update(db, '1', '2', { id_sessao: '999' }), /Campos inválidos/);
});
