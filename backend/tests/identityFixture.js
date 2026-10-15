// Repository de teste isolado. NÃO representa SQL, locks ou garantias de MySQL.
import { serialize, deserialize } from 'node:v8';
import { randomBytes } from 'node:crypto';
import { validateEnv } from '../config/env.js';
import { testEnvironment } from './helpers.js';
import { createApp } from '../app.js';
import { createJwt } from '../config/jwt.js';
import { createIdentityService } from '../services/identityService.js';
import { createProfileService } from '../services/profileService.js';
import { hashPassword } from '../utils/identityCrypto.js';
import { createLogQueue } from '../services/logService.js';
import { unavailableIdentityProviders } from '../providers/identityProviders.js';

export const PASSWORD = 'Fixture!Password123';
const same = (a, b) => Buffer.from(a).equals(Buffer.from(b));
export async function identityFixture(overrides = {}) {
    const config = validateEnv(testEnvironment({ BCRYPT_COST: '10', TWO_FACTOR_ENCRYPTION_KEY: randomBytes(32).toString('base64'), TERMS_VERSION: 'fixture-v1', PRIVACY_VERSION: 'fixture-v1', IDENTITY_LEGAL_BASIS: 'Fixture isolada', RATE_LIMIT_MAX: '1000', ...overrides.env }));
    let state = { users: [], sessions: [], factors: [], challenges: [], recoveries: [], addresses: [], contacts: [], preferences: {}, consents: [], ages: [], guardians: [], controls: {}, authorizations: [], privacy: [], events: [] };
    let sequence = 100, chain = Promise.resolve();
    const next = () => String(++sequence);
    const connection = { async execute(sql, params) { state.events.push({ sql, params }); return [{ affectedRows: 1 }]; } };
    const database = {
        async execute(sql, values) {
            if (sql.includes('FROM usuarios')) { const u = state.users.find(u => u.id_usuario === String(values[0])); return [u ? [u] : []]; }
            throw new Error('SQL não previsto pela fixture');
        }, async ping() {},
        async transaction(fn) {
            const previous = chain; let release; chain = new Promise(resolve => { release = resolve; }); await previous;
            const snapshot = deserialize(serialize(state));
            try { return await fn(connection); } catch (e) { state = snapshot; throw e; } finally { release(); }
        }
    };
    const model = {
        async user(id) { return state.users.find(u => u.id_usuario === String(id)) ?? null; },
        async byEmail(email) { return state.users.find(u => u.email === email) ?? null; },
        async createUser(c, input) {
            if (state.users.some(u => u.email === input.email || u.cpf === input.cpf)) throw Object.assign(new Error('duplicate'), { code: 'ER_DUP_ENTRY' });
            const id = next(); state.users.push({ id_usuario: id, nome: input.name, email: input.email, cpf: input.cpf, data_nascimento: input.dateOfBirth, senha: input.hash, tipo_usuario: input.role, status: input.status }); return id;
        },
        async updateUser(c, id, input) { Object.assign(await model.user(id), input); },
        async factors(c, id) { return state.factors.filter(f => f.id_usuario === String(id) && f.ativo); },
        async activateFactor(c, id, method, secret, step) { let f = state.factors.find(f => f.id_usuario === String(id) && f.metodo === method); if (!f) { f = { id_2fa: next(), id_usuario: String(id), metodo: method }; state.factors.push(f); } Object.assign(f, { chave: secret, ultimo_passo: step, ativo: true }); },
        async step(c, id, step) { state.factors.find(f => f.id_2fa === id).ultimo_passo = step; },
        async disableFactor(c, id) { for (const f of state.factors.filter(f => f.id_usuario === id)) Object.assign(f, { ativo: false, chave: null }); },
        async createSession(c, userId, hash, expiry, verified) { const id = next(); state.sessions.push({ id, id_usuario: String(userId), hash, expiracao: expiry, two_factor_verified: verified, revogada_em: null }); return id; },
        async session(id, userId, hash) { return state.sessions.find(s => s.id === id && s.id_usuario === String(userId) && same(s.hash, hash)); },
        async activeSession(c, userId, id) { return state.sessions.find(s => s.id === id && s.id_usuario === String(userId)); },
        async revoke(c, userId, id) { state.sessions.filter(s => s.id_usuario === String(userId) && (!id || s.id === id)).forEach(s => { s.revogada_em = new Date().toISOString(); }); },
        async createChallenge(c, id, d) { state.challenges.push({ id_desafio: next(), id_usuario: String(id), hash: d.hash, finalidade: d.purpose, metodo: d.method, chave_pendente: d.secret, expiracao: d.expiry, tentativas: 0, consumido_em: null }); },
        async challenge(hash) { return state.challenges.find(d => same(d.hash, hash)); },
        async challengeAttempt(c, id) { state.challenges.find(d => d.id_desafio === id).tentativas++; },
        async invalidateChallenges(c, id) { state.challenges.filter(d => d.id_usuario === String(id)).forEach(d => { d.consumido_em = new Date().toISOString(); d.chave_pendente = null; }); },
        async recovery(hash) { return state.recoveries.find(r => r.token === hash); },
        async invalidateRecovery(c, id) { state.recoveries.filter(r => r.id_usuario === String(id)).forEach(r => { r.utilizado = true; }); },
        async createRecovery(c, id, token, expiry) { state.recoveries.push({ id_recuperacao: next(), id_usuario: String(id), token, expiracao: expiry, utilizado: false }); },
        async consent(c, id, purpose, version, basis) { state.consents.push({ id, purpose, version, basis }); },
        async age(c, id, proof) { state.ages.push({ id, ...proof }); },
        async latestAge(c, id) { const a = state.ages.findLast(a => a.id === String(id) && Date.parse(a.expiresAt.replace(' ', 'T') + 'Z') > Date.now()); return a ? { faixa_etaria: a.ageBand, expiracao: a.expiresAt } : null; },
        async guardian(c, id, proof) { state.guardians.push({ id_vinculo: next(), id_menor: id, id_responsavel: proof.guardianId }); state.controls[id] = { compras_permitidas: false, assinaturas_permitidas: false, limite_minutos_diarios: 120 }; },
        async guardianLink(c, guardianId, minorId) { return state.guardians.find(g => g.id_menor === minorId && g.id_responsavel === guardianId); },
        async controls(c, id) { return state.controls[id]; },
        async updateControls(c, id, input) { Object.assign(state.controls[id], input); },
        async authorize(c, id, input) { const key = next(); state.authorizations.push({ id: key, linkId: id, ...input }); return key; },
        async authorization() { return null; },
        async resource(kind, id, userId) { const row = state[kind].find(r => r[pk(kind)] === id && r.userId === userId); if (!row) return null; const { userId: owner, ...dto } = row; return dto; },
        async list(kind, userId, limit, cursor) { return state[kind].filter(r => r.userId === userId && BigInt(r[pk(kind)]) > BigInt(cursor ?? 0)).slice(0, limit + 1).map(({ userId, ...r }) => r); },
        async clearPrincipal(c, kind, userId, type) { state[kind].filter(r => r.userId === userId && (kind === 'addresses' || r.tipo === type)).forEach(r => { r.principal = false; }); },
        async addResource(c, kind, userId, input) { const id = next(); state[kind].push({ [pk(kind)]: id, userId, ...input }); return id; },
        async patchResource(c, kind, id, userId, input) { Object.assign(state[kind].find(r => r[pk(kind)] === id && r.userId === userId), input); },
        async deleteResource(c, kind, id, userId) { state[kind] = state[kind].filter(r => !(r[pk(kind)] === id && r.userId === userId)); },
        async preferences(id) { return state.preferences[id] ?? null; },
        async updatePreferences(c, id, input) { state.preferences[id] = { tema: 'SISTEMA', tamanho_fonte: 'MEDIO', alto_contraste: false, modo_acessibilidade: false, idioma: 'pt-BR', aparencia: 'cineastra', ...state.preferences[id], ...input }; },
        async privacyRequest(c, userId) { const r = { id_solicitacao: next(), id_usuario: userId, status: 'RECEBIDA' }; state.privacy.push(r); return r; },
        async privacyStatus(c, id) { return state.privacy.find(r => r.id_solicitacao === id); },
        async adminGuard() {},
        async adminCount() { return { total: state.users.filter(u => u.tipo_usuario === 'ADMIN' && u.status === 'ATIVO').length }; },
        async exportSection() { return []; }
    };
    function pk(kind) { return kind === 'addresses' ? 'id_endereco' : 'id_contato'; }
    const sent = [];
    const unavailable = unavailableIdentityProviders();
    const providers = { ...unavailable,
        email: { async assertAvailable() {}, async sendRecovery(input) { sent.push(input); }, async verifyAddress() { return true; } },
        age: { async verify(input) { return { verified: true, ageBand: 'MAIOR_16', dateOfBirth: input.dateOfBirth, reference: 'fixture-age', verifiedAt: new Date(Date.now() - 1000).toISOString(), expiresAt: new Date(Date.now() + 3600000).toISOString() }; } },
        ...overrides.providers };
    const logs = [];
    const logQueue = createLogQueue(async log => logs.push(log), { limit: 1000 });
    const tokens = createJwt(config.jwt);
    const identity = createIdentityService({ database, model, config, tokens, providers });
    const profile = createProfileService({ identity, config, providers });
    const app = createApp({ config, database, logQueue, retention: { async check() { return true; } }, identityModel: model, identityProviders: providers, captchaProvider: { async verify() { return true; } } });
    async function addUser(role = 'CLIENTE', data = {}) {
        const id = next(); state.users.push({ id_usuario: id, nome: 'Fixture User', email: `fixture-${id}@example.invalid`, cpf: `fixture-${id}`, data_nascimento: '2000-01-01', senha: await hashPassword(PASSWORD, 10), tipo_usuario: role, status: 'ATIVO', ...data }); return state.users.at(-1);
    }
    async function login(user) { return identity.login({ email: user.email, password: PASSWORD }); }
    return { app, model, database, identity, profile, config, providers, sent, logs, logQueue, tokens, addUser, login, get state() { return state; }, async close() { await app.locals.close(); await logQueue.close(); } };
}
