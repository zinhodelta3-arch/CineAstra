import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import { createTeamService } from '../services/teamService.js';
import { createTeamController } from '../controllers/teamController.js';
import { teamRoutes } from '../routes/teamRoutes.js';
import { createTeamModel } from '../models/teamModel.js';
import { errorMiddleware } from '../middlewares/errorMiddleware.js';
import { ApiError } from '../utils/ApiError.js';

function fixture() {
    let state = {
        sessions: [{ id_sessao: '1', status: 'AGENDADA' }, { id_sessao: '2', status: 'CANCELADA' }],
        users: [{ id_usuario: '1', tipo_usuario: 'SUPERVISOR', status: 'ATIVO' }, { id_usuario: '2', tipo_usuario: 'SUPERVISOR', status: 'ATIVO' }, { id_usuario: '3', tipo_usuario: 'COLABORADOR', status: 'ATIVO' }, { id_usuario: '4', tipo_usuario: 'COLABORADOR', status: 'ATIVO' }, { id_usuario: '5', tipo_usuario: 'CLIENTE', status: 'ATIVO' }, { id_usuario: '6', tipo_usuario: 'ADMIN', status: 'ATIVO' }],
        teams: [], members: [], entries: [], events: [], notifications: []
    };
    let serial = Promise.resolve(), next = { team: 1, member: 1, entry: 1 }, notificationFailure = false;
    const team = id => state.teams.find(t => t.id_equipe === String(id));
    const member = (teamId, userId) => state.members.find(m => m.id_equipe === String(teamId) && m.id_usuario === String(userId));
    const entry = (teamId, entryId) => state.entries.find(e => e.id_equipe === String(teamId) && e.id_entrada === String(entryId));
    const model = {
        async team(id) { const t = team(id); return t && { ...t, sessao_status: state.sessions.find(s => s.id_sessao === t.id_sessao).status }; },
        async lockTeam(id) { return team(id) ?? null; },
        async session(id) { return state.sessions.find(s => s.id_sessao === String(id)) ?? null; },
        async activeTeamForSession(id) { return state.teams.find(t => t.id_sessao === String(id) && t.status === 'ATIVA') ?? null; },
        async user(id) { return state.users.find(u => u.id_usuario === String(id)) ?? null; },
        async listTeams(actor, q) { return state.teams.filter(t => BigInt(t.id_equipe) > BigInt(q.cursor ?? '0') && (actor.tipo === 'ADMIN' || actor.tipo === 'SUPERVISOR' && actor.id === t.id_supervisor || actor.tipo === 'COLABORADOR' && t.status === 'ATIVA' && ['AGENDADA','EM_CARTAZ'].includes(state.sessions.find(s => s.id_sessao === t.id_sessao).status))); },
        async create(c, data) { const id = String(next.team++); state.teams.push({ id_equipe: id, id_supervisor: String(data.supervisorId), id_sessao: String(data.sessionId), nome: data.nome, status: 'ATIVA' }); return id; },
        async update(c, id, data) { Object.assign(team(id), data); },
        async member(id, memberId) { return state.members.find(m => m.id_equipe === String(id) && m.id_equipe_membro === String(memberId)) ?? null; },
        async memberByUser(id, userId) { return member(id, userId) ?? null; },
        async listMembers(id, q) { return state.members.filter(m => m.id_equipe === String(id) && BigInt(m.id_equipe_membro) > BigInt(q.cursor ?? '0')); },
        async activateMember(c, teamId, userId, funcao, previous) { if (previous) Object.assign(previous, { status: 'ATIVO', funcao }); else state.members.push({ id_equipe_membro: String(next.member++), id_equipe: String(teamId), id_usuario: String(userId), funcao, data_entrada: '2026-10-08', status: 'ATIVO' }); },
        async updateMember(c, id, memberId, data) { Object.assign(state.members.find(m => m.id_equipe === String(id) && m.id_equipe_membro === String(memberId)), data); },
        async entry(id, entryId) { return entry(id, entryId) ?? null; },
        async pendingEntry(id, userId) { return state.entries.find(e => e.id_equipe === String(id) && e.id_usuario === String(userId) && e.status === 'PENDENTE') ?? null; },
        async listEntries(id, q, userId) { return state.entries.filter(e => e.id_equipe === String(id) && (!userId || e.id_usuario === userId) && BigInt(e.id_entrada) > BigInt(q.cursor ?? '0')); },
        async createEntry(c, data) { const id = String(next.entry++); state.entries.push({ id_entrada: id, id_equipe: String(data.teamId), id_usuario: String(data.userId), id_emissor: String(data.actorId), tipo: data.type, funcao_proposta: data.functionName, status: 'PENDENTE', criado_em: '2026-10-08 00:00:00', decidido_em: null }); return id; },
        async decideEntry(c, teamId, id, status) { Object.assign(entry(teamId, id), { status, decidido_em: '2026-10-08 00:00:01' }); },
        async cancelPending(c, id) { for (const e of state.entries.filter(e => e.id_equipe === String(id) && e.status === 'PENDENTE')) e.status = 'CANCELADA'; }
    };
    const identity = {
        async transaction(fn) { const prior = serial; let release; serial = new Promise(resolve => { release = resolve; }); await prior; const snapshot = structuredClone(state), oldNext = structuredClone(next); try { return await fn({}); } catch (error) { state = snapshot; next = oldNext; throw error; } finally { release(); } },
        async activeActor(c, context) { return state.users.find(u => u.id_usuario === context.actor.id); },
        async audit(c, type, id) { state.events.push({ type, id }); }
    };
    const notifications = { async emit(c, event) { if (notificationFailure) throw new Error('Fixture notification failure'); if (!state.notifications.some(n => n.recipientId === event.recipientId && n.dedupeKey === event.dedupeKey)) state.notifications.push(event); } };
    const service = createTeamService({ model, identity, notifications });
    const app = express(); app.use(express.json());
    app.use((req, res, next) => { res.locals.requestId = '00000000-0000-4000-8000-000000000001'; next(); });
    app.use(teamRoutes(createTeamController(service), { auth(req, res, next) { const id = req.headers['x-user-id']; if (!id) throw ApiError.naoAutorizado(); const u = state.users.find(u => u.id_usuario === id); if (!u) throw ApiError.naoAutorizado(); req.usuario = { id, tipo: u.tipo_usuario }; next(); } }));
    app.use(errorMiddleware);
    const api = (method, path, user = '1') => request(app)[method](path).set('X-User-Id', user);
    return { app, api, service, get state() { return state; }, failNotifications(value) { notificationFailure = value; } };
}

test('equipe exige sessão ativa e supervisor autorizado; outro supervisor não administra', async () => {
    const f = fixture();
    await request(f.app).post('/api/teams').send({ sessionId: '1', nome: 'A' }).expect(401);
    await f.api('post', '/api/teams', '5').send({ sessionId: '1', nome: 'A' }).expect(403);
    await f.api('post', '/api/teams').send({ sessionId: '2', nome: 'A' }).expect(409);
    await f.api('post', '/api/teams').send({ sessionId: '1', nome: 'A', supervisorId: '2' }).expect(403);
    const created = await f.api('post', '/api/teams').send({ sessionId: '1', nome: 'A' }).expect(201);
    assert.equal(created.body.data.id_supervisor, '1');
    await f.api('post', '/api/teams').send({ sessionId: '1', nome: 'B' }).expect(409);
    await f.api('patch', '/api/teams/1', '2').send({ nome: 'Invasão' }).expect(403);
    await f.api('get', '/api/teams/1', '2').expect(403);
    const list = await f.api('get', '/api/teams', '2').expect(200);
    assert.equal(list.body.data.items.length, 0);
});

test('solicitação não cria membro; apenas gestor próprio aceita e define função', async () => {
    const f = fixture(); await f.api('post', '/api/teams').send({ sessionId: '1', nome: 'A' }).expect(201);
    const proposal = await f.api('post', '/api/teams/1/entries/requests', '3').send({}).expect(201);
    assert.equal(f.state.members.length, 0);
    await f.api('post', '/api/teams/1/entries/requests', '3').send({}).expect(409);
    await f.api('post', '/api/teams/1/entries/1/decision', '3').send({ decision: 'ACEITAR', funcao: 'Projeção' }).expect(403);
    await f.api('post', '/api/teams/1/entries/1/decision', '2').send({ decision: 'ACEITAR', funcao: 'Projeção' }).expect(403);
    await f.api('post', '/api/teams/1/entries/1/decision').send({ decision: 'ACEITAR' }).expect(422);
    await f.api('post', '/api/teams/1/entries/1/decision').send({ decision: 'ACEITAR', funcao: 'Projeção' }).expect(200);
    assert.equal(proposal.body.data.status, 'PENDENTE');
    assert.equal(f.state.members[0].funcao, 'Projeção');
    await f.api('patch', '/api/teams/1/members/1', '3').send({ funcao: 'Chefe' }).expect(403);
    await f.api('patch', '/api/teams/1/members/1').send({ funcao: 'Portaria' }).expect(200);
    assert.equal(f.state.members[0].funcao, 'Portaria');
});

test('convite só incorpora após aceite do destinatário e rejeita perfil indevido', async () => {
    const f = fixture(); await f.api('post', '/api/teams').send({ sessionId: '1', nome: 'A' }).expect(201);
    await f.api('post', '/api/teams/1/entries/invitations').send({ userId: '5', funcao: 'Apoio' }).expect(409);
    await f.api('post', '/api/teams/1/entries/invitations', '2').send({ userId: '4', funcao: 'Apoio' }).expect(403);
    await f.api('post', '/api/teams/1/entries/invitations').send({ userId: '4', funcao: 'Apoio' }).expect(201);
    assert.equal(f.state.notifications.length, 1);
    assert.equal(f.state.notifications[0].recipientId, '4');
    assert.equal(f.state.members.length, 0);
    await f.api('post', '/api/teams/1/entries/1/decision', '3').send({ decision: 'ACEITAR' }).expect(403);
    await f.api('post', '/api/teams/1/entries/1/decision', '4').send({ decision: 'ACEITAR', funcao: 'Chefe' }).expect(422);
    await f.api('post', '/api/teams/1/entries/1/decision', '4').send({ decision: 'ACEITAR' }).expect(200);
    assert.equal(f.state.members[0].funcao, 'Apoio');
    await f.api('get', '/api/teams/1/members', '3').expect(403);
    await f.api('get', '/api/teams/1/members', '4').expect(200);
    await f.api('delete', '/api/teams/1/members/1').expect(204);
    await f.api('get', '/api/teams/1/members', '4').expect(403);
});

test('concorrência de criação e encerramento da sessão bloqueiam nova entrada', async () => {
    const f = fixture();
    const results = await Promise.all([
        f.api('post', '/api/teams').send({ sessionId: '1', nome: 'A' }),
        f.api('post', '/api/teams').send({ sessionId: '1', nome: 'B' })
    ]);
    assert.deepEqual(results.map(r => r.status).sort(), [201, 409]);
    assert.equal(f.state.teams.length, 1);
    f.state.sessions[0].status = 'ENCERRADA';
    await f.api('post', '/api/teams/1/entries/requests', '3').send({}).expect(409);
    await f.api('post', '/api/teams/1/entries/invitations').send({ userId: '4', funcao: 'Apoio' }).expect(409);
});

test('falha de notificação desfaz convite na mesma transação', async () => {
    const f = fixture();
    await f.api('post', '/api/teams').send({ sessionId: '1', nome: 'A' }).expect(201);
    f.failNotifications(true);
    await f.api('post', '/api/teams/1/entries/invitations').send({ userId: '4', funcao: 'Apoio' }).expect(500);
    assert.equal(f.state.entries.length, 0);
    assert.equal(f.state.notifications.length, 0);
    f.failNotifications(false);
    await f.api('post', '/api/teams/1/entries/invitations').send({ userId: '4', funcao: 'Apoio' }).expect(201);
    assert.equal(f.state.entries.length, 1);
    assert.equal(f.state.notifications.length, 1);
});

test('SQL parametrizado, IDs BIGINT e campos de atualização restritos', async () => {
    const calls = [], db = { async execute(sql, args) { calls.push({ sql, args }); return [[]]; } }, model = createTeamModel(db);
    await model.listEntries('7', { limit: 20, cursor: '9007199254740993' }, '3');
    assert.ok(calls[0].sql.includes('id_entrada > ?'));
    assert.deepEqual(calls[0].args, ['7', '9007199254740993', '3']);
    assert.throws(() => model.update(db, '1', { id_sessao: '2' }), /Campos inválidos/);
    assert.throws(() => model.updateMember(db, '1', '2', { id_usuario: '3' }), /Campos inválidos/);
});
