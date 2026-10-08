import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import request from 'supertest';
import * as OTPAuth from 'otpauth';
import { identityFixture, PASSWORD } from './identityFixture.js';
import { schemas, validCpf } from '../validators/identityValidators.js';
import { tokenHash, passwordPolicy, sealSecret, unsealSecret } from '../utils/identityCrypto.js';
import { unavailableIdentityProviders } from '../providers/identityProviders.js';
import { createIdentityModel } from '../models/identityModel.js';
import { fixture } from './helpers.js';
import { sqlDate } from '../services/identityService.js';

const bearer = token => `Bearer ${token}`;
const input = { name: 'Pessoa Teste', email: 'pessoa@example.invalid', cpf: '529.982.247-25', dateOfBirth: '2000-01-01', password: PASSWORD, passwordConfirmation: PASSWORD, termsVersion: 'fixture-v1', privacyVersion: 'fixture-v1', acceptTerms: true, acceptPrivacy: true, ageProof: 'fixture-only', captchaToken: 'fixture-only' };
const context = (f, token) => { const c = f.tokens.verify(token); return { actor: { id: c.sub, sessionId: c.sid } }; };
async function enrollment(f, user) {
    const login = await f.login(user);
    assert.equal(login.accessToken, undefined);
    const enrolled = await f.identity.enroll({ challengeToken: login.challengeToken, method: 'APP' });
    const totp = OTPAuth.URI.parse(enrolled.provisioningUri);
    const result = await f.identity.verify({ challengeToken: enrolled.challengeToken, code: totp.generate() });
    return { ...result, totp, enrolled };
}

test('validação estrita: CPF, datas, confirmação e limite bcrypt UTF-8 sem truncamento', () => {
    assert.equal(validCpf('52998224725'), true);
    for (const cpf of ['11111111111', '52998224726', 'abc']) assert.equal(validCpf(cpf), false);
    for (const patch of [{ role: 'ADMIN' }, { status: 'ATIVO' }, { dateOfBirth: '2024-02-30' }, { cpf: '00000000000' }]) assert.equal(schemas.register.safeParse({ ...input, ...patch }).success, false);
    assert.throws(() => passwordPolicy('A1!' + 'é'.repeat(35), 'A1!' + 'é'.repeat(35)));
    assert.throws(() => passwordPolicy(PASSWORD, 'diferente'));
    assert.doesNotThrow(() => passwordPolicy(PASSWORD, PASSWORD));
    assert.equal(schemas.register.parse({ ...input, email: ' PESSOA@EXAMPLE.INVALID ' }).email, input.email);
});

test('segredo 2FA cifrado autentica chave/usuário e detecta adulteração', () => {
    const key = randomBytes(32).toString('base64');
    const sealed = sealSecret('TEST_SECRET', key, '1');
    assert.ok(!sealed.includes('TEST_SECRET'));
    assert.equal(unsealSecret(sealed, key, '1'), 'TEST_SECRET');
    assert.throws(() => unsealSecret(sealed, key, '2'));
    assert.throws(() => unsealSecret(sealed, randomBytes(32).toString('base64'), '1'));
    assert.throws(() => unsealSecret('plain legacy secret', key, '1'));
});

test('cadastro HTTP somente CLIENTE, consentimentos/prova persistidos, duplicata 409 e DTO mínimo', async t => {
    const f = await identityFixture(); t.after(() => f.close());
    await request(f.app).post('/api/auth/register').send({ ...input, role: 'ADMIN' }).expect(422);
    const response = await request(f.app).post('/api/auth/register').send(input).expect(201);
    assert.equal(response.body.data.role, 'CLIENTE');
    assert.equal(response.body.data.id, f.state.users[0].id_usuario);
    assert.ok(!/senha|cpf|ageProof|hash|accessToken/.test(response.text));
    assert.equal(f.state.consents.length, 2); assert.equal(f.state.ages.length, 1);
    assert.match(f.state.users[0].senha, /^\$2/);
    assert.equal(response.headers['cache-control'], 'no-store');
    await request(f.app).post('/api/auth/register').send(input).expect(409);
    assert.equal(f.state.users.length, 1);
});

test('providers ausentes falham fechado: CAPTCHA, idade, e-mail e SMS; não persistem falso sucesso', async t => {
    const generic = fixture(); t.after(async () => { await generic.app.locals.close(); await generic.logQueue.close(); });
    await request(generic.app).post('/api/auth/register').send(input).expect(503);
    const f = await identityFixture({ providers: unavailableIdentityProviders() }); t.after(() => f.close());
    await request(f.app).post('/api/auth/register').send(input).expect(503);
    await request(f.app).post('/api/auth/password/forgot').send({ email: input.email, captchaToken: 'fixture' }).expect(503);
    await assert.rejects(f.identity.enroll({ method: 'SMS' }), { statusCode: 503 });
    assert.equal(f.state.users.length, 0); assert.equal(f.state.recoveries.length, 0);
});

test('login/logout persistentes: sessão/JTI corretos, usuário bloqueado nega, credenciais genéricas', async t => {
    const f = await identityFixture(); t.after(() => f.close()); const u = await f.addUser();
    const res = await request(f.app).post('/api/auth/login').send({ email: u.email, password: PASSWORD, captchaToken: 'fixture' }).expect(200);
    const token = res.body.data.accessToken;
    const claims = f.tokens.verify(token);
    assert.ok(f.state.sessions.some(s => Buffer.from(s.hash).equals(tokenHash(claims.jti))));
    await request(f.app).get('/api/users/me').set('Authorization', bearer(token)).expect(200);
    const missing = await request(f.app).post('/api/auth/login').send({ email: 'missing@example.invalid', password: PASSWORD, captchaToken: 'fixture' }).expect(401);
    const wrong = await request(f.app).post('/api/auth/login').send({ email: u.email, password: 'WrongPassword!', captchaToken: 'fixture' }).expect(401);
    assert.equal(missing.body.code, wrong.body.code); assert.equal(missing.body.message, wrong.body.message);
    await request(f.app).post('/api/auth/logout').set('Authorization', bearer(token)).expect(204);
    await request(f.app).get('/api/users/me').set('Authorization', bearer(token)).expect(401);
    u.status = 'BLOQUEADO';
    await assert.rejects(f.login(u), { statusCode: 401 });
});

test('ADMIN sem fator só recebe enrollment; prova emite sessão, replay e bypass negados', async t => {
    const f = await identityFixture(); t.after(() => f.close()); const u = await f.addUser('ADMIN');
    const auth = await enrollment(f, u);
    await request(f.app).get('/api/users/me').set('Authorization', bearer(auth.accessToken)).expect(200);
    assert.ok(f.state.sessions[0].two_factor_verified);
    assert.ok(!f.state.factors[0].chave.includes(auth.totp.secret.base32));
    await assert.rejects(f.identity.verify({ challengeToken: auth.enrolled.challengeToken, code: auth.totp.generate() }), { statusCode: 401 });
    const login = await f.login(u);
    assert.equal(login.next, 'VERIFY_2FA'); assert.equal(login.accessToken, undefined);
    await assert.rejects(f.identity.verify({ challengeToken: login.challengeToken, code: auth.totp.generate() }), { statusCode: 401 });
    await assert.rejects(f.identity.enroll({ challengeToken: login.challengeToken, method: 'APP' }), { statusCode: 401 });
    const accepted = await f.identity.verify({ challengeToken: login.challengeToken, code: auth.totp.generate({ timestamp: Date.now() + 30000 }) });
    assert.ok(accepted.accessToken);
    await assert.rejects(f.identity.disableFactor({ password: PASSWORD, code: auth.totp.generate() }, context(f, accepted.accessToken)), { statusCode: 403 });
});

test('tentativas inválidas são commitadas; cinco erros e desafio vencido não emitem sessão', async t => {
    const f = await identityFixture(); t.after(() => f.close()); const u = await f.addUser('SUPERVISOR');
    const login = await f.login(u);
    const enrolled = await f.identity.enroll({ challengeToken: login.challengeToken, method: 'APP' });
    const otp = OTPAuth.URI.parse(enrolled.provisioningUri);
    const valid = new Set([-30000, 0, 30000].map(offset => otp.generate({ timestamp: Date.now() + offset })));
    const invalid = ['000000', '111111', '222222', '333333'].find(code => !valid.has(code));
    for (let i = 0; i < 5; i++) await assert.rejects(f.identity.verify({ challengeToken: enrolled.challengeToken, code: invalid }), { statusCode: 401 });
    assert.equal(f.state.challenges.at(-1).tentativas, 5);
    await assert.rejects(f.identity.verify({ challengeToken: enrolled.challengeToken, code: otp.generate() }), { statusCode: 401 });
    const fresh = await f.login(u); f.state.challenges.at(-1).expiracao = '2000-01-01 00:00:00.000';
    await assert.rejects(f.identity.enroll({ challengeToken: fresh.challengeToken, method: 'APP' }), { statusCode: 401 });
    assert.equal(f.state.sessions.length, 0);
});

test('recuperação genérica, hash no banco, consumo único e revogação de sessões/desafios', async t => {
    const f = await identityFixture(); t.after(() => f.close()); const u = await f.addUser(); const auth = await f.login(u);
    const expected = await f.identity.forgot({ email: u.email });
    assert.deepEqual(await f.identity.forgot({ email: 'absent@example.invalid' }), expected);
    assert.equal(f.sent.length, 1); const token = f.sent[0].token;
    assert.notEqual(f.state.recoveries[0].token, token);
    const payload = { token, password: 'Another!Password123', passwordConfirmation: 'Another!Password123' };
    const results = await Promise.allSettled([f.identity.reset(payload), f.identity.reset(payload)]);
    assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
    assert.equal(f.state.recoveries[0].utilizado, true);
    await request(f.app).get('/api/users/me').set('Authorization', bearer(auth.accessToken)).expect(401);
    await assert.rejects(f.login(u), { statusCode: 401 });
    assert.ok((await f.identity.login({ email: u.email, password: payload.password })).accessToken);
});

test('falha de entrega mantém resposta genérica e invalida reset; vencido negado', async t => {
    const providers = { email: { async assertAvailable() {}, async sendRecovery() { throw new Error('fixture delivery failure'); } } };
    const f = await identityFixture({ providers }); t.after(() => f.close()); const u = await f.addUser();
    assert.deepEqual(await f.identity.forgot({ email: u.email }), await f.identity.forgot({ email: 'absent@example.invalid' }));
    assert.equal(f.state.recoveries[0].utilizado, true);
    await assert.rejects(f.identity.reset({ token: 'a'.repeat(64), password: PASSWORD, passwordConfirmation: PASSWORD }), { statusCode: 401 });
});

test('endereços/contatos: CRUD HTTP, principal, paginação, validação e IDOR em rota aninhada', async t => {
    const f = await identityFixture(); t.after(() => f.close()); const a = await f.addUser(), b = await f.addUser();
    const ta = (await f.login(a)).accessToken, tb = (await f.login(b)).accessToken;
    const address = { logradouro: 'Rua Teste', numero: '1', cidade: 'Teste', estado: 'SP', principal: true };
    const first = await request(f.app).post('/api/users/me/addresses').set('Authorization', bearer(ta)).send(address).expect(201);
    const id = first.body.data.id_endereco;
    await request(f.app).post('/api/users/me/addresses').set('Authorization', bearer(ta)).send(address).expect(201);
    assert.equal(f.state.addresses.filter(a => a.principal).length, 1);
    for (const method of ['get', 'patch', 'delete']) await request(f.app)[method](`/api/users/me/addresses/${id}`).set('Authorization', bearer(tb)).send(method === 'patch' ? { principal: true } : undefined).expect(404);
    const page = await request(f.app).get('/api/users/me/addresses?limit=1').set('Authorization', bearer(ta)).expect(200);
    assert.equal(page.body.data.items.length, 1); assert.ok(page.body.data.pagination.nextCursor);
    await request(f.app).get('/api/users/me/addresses?limit=1%20OR%201=1').set('Authorization', bearer(ta)).expect(422);
    const contact = await request(f.app).post('/api/users/me/contacts').set('Authorization', bearer(ta)).send({ tipo: 'EMAIL_SECUNDARIO', valor: 'test@example.invalid', principal: true }).expect(201);
    await request(f.app).patch(`/api/users/me/contacts/${contact.body.data.id_contato}`).set('Authorization', bearer(ta)).send({ valor: 'not-email' }).expect(422);
    await request(f.app).delete(`/api/users/me/addresses/${id}`).set('Authorization', bearer(ta)).expect(204);
});

test('perfil/preferências: campos permitidos, troca de senha revoga sessão, export sem segredos', async t => {
    const f = await identityFixture(); t.after(() => f.close()); const u = await f.addUser(); const auth = await f.login(u), token = auth.accessToken;
    await request(f.app).patch('/api/users/me').set('Authorization', bearer(token)).send({ role: 'ADMIN' }).expect(422);
    await request(f.app).patch('/api/users/me/preferences').set('Authorization', bearer(token)).send({ tema: 'ESCURO', aparencia: 'catppucin' }).expect(200);
    const exported = await request(f.app).post('/api/users/me/export').set('Authorization', bearer(token)).send({ password: PASSWORD }).expect(200);
    assert.equal(exported.body.data.data.cpf, u.cpf); assert.ok(!/senha|chave|jti|hash/.test(exported.text));
    await request(f.app).patch('/api/users/me').set('Authorization', bearer(token)).send({ currentPassword: PASSWORD, password: 'NewSecure!Password123', passwordConfirmation: 'NewSecure!Password123' }).expect(200);
    await request(f.app).get('/api/users/me').set('Authorization', bearer(token)).expect(401);
});

test('exclusão é solicitação rastreável + desativação; preserva usuário, histórico e nega acesso', async t => {
    const f = await identityFixture(); t.after(() => f.close()); const u = await f.addUser(); const { accessToken } = await f.login(u);
    const res = await request(f.app).delete('/api/users/me').set('Authorization', bearer(accessToken)).send({ password: PASSWORD }).expect(202);
    assert.equal(res.body.data.status, 'RECEBIDA'); assert.match(res.headers.location, /^\/api\/admin\/privacy-requests\//);
    assert.equal(f.state.users.length, 1); assert.equal(f.state.users[0].status, 'INATIVO');
    await request(f.app).get('/api/users/me').set('Authorization', bearer(accessToken)).expect(401);
});

test('admin com 2FA gerencia perfis, revoga alvo; cliente negado e último ADMIN preservado', async t => {
    const f = await identityFixture(); t.after(() => f.close()); const admin = await f.addUser('ADMIN'), client = await f.addUser();
    const adminAuth = await enrollment(f, admin), clientAuth = await f.login(client);
    await request(f.app).patch(`/api/admin/users/${client.id_usuario}/access`).set('Authorization', bearer(clientAuth.accessToken)).send({ role: 'ADMIN' }).expect(403);
    await request(f.app).patch(`/api/admin/users/${admin.id_usuario}/access`).set('Authorization', bearer(adminAuth.accessToken)).send({ status: 'BLOQUEADO' }).expect(409);
    await request(f.app).patch(`/api/admin/users/${client.id_usuario}/access`).set('Authorization', bearer(adminAuth.accessToken)).send({ status: 'BLOQUEADO' }).expect(200);
    await request(f.app).get('/api/users/me').set('Authorization', bearer(clientAuth.accessToken)).expect(401);
});

test('idade/responsável: sem prova não registra, menor exige vínculo e controles são do responsável', async t => {
    const bad = await identityFixture({ providers: { age: { async verify() { return { verified: false }; } } } }); t.after(() => bad.close());
    await request(bad.app).post('/api/auth/register').send(input).expect(422);
    assert.equal(bad.state.users.length, 0);
    const f = await identityFixture(); t.after(() => f.close()); const parent = await f.addUser(), outsider = await f.addUser(), minor = await f.addUser();
    await f.model.guardian(null, minor.id_usuario, { guardianId: parent.id_usuario });
    await f.model.age(null, minor.id_usuario, { ageBand: 'ATE_16', expiresAt: sqlDate(Date.now() + 3600000) });
    const own = (await f.login(parent)).accessToken, other = (await f.login(outsider)).accessToken;
    await request(f.app).get(`/api/users/me/children/${minor.id_usuario}/controls`).set('Authorization', bearer(other)).expect(404);
    await request(f.app).patch(`/api/users/me/children/${minor.id_usuario}/controls`).set('Authorization', bearer(own)).send({ compras_permitidas: true }).expect(200);
    await assert.rejects(f.identity.requireAge({}, minor.id_usuario, 'COMPRA', 'fixture-order'), { statusCode: 403 });
});

test('model SQL parametrizado: input não vira identificador, DTO não seleciona segredo indevidamente', async () => {
    const calls = []; const database = { async execute(sql, values) { calls.push({ sql, values }); return [[]]; } }; const m = createIdentityModel(database);
    await m.byEmail("x' OR 1=1 --");
    assert.ok(!calls[0].sql.includes('OR 1=1')); assert.deepEqual(calls[0].values, ["x' OR 1=1 --"]);
    await m.resource('addresses', '1', '2'); assert.ok(calls[1].sql.includes('AND id_usuario = ?')); assert.deepEqual(calls[1].values, ['1', '2']);
    assert.throws(() => m.resource('usuarios; DROP TABLE usuarios', '1', '2'));
    await assert.rejects(m.updateUser(database, '1', { arbitrary_column: 'x' }));
});

test('cliente pode ativar e rotacionar TOTP; exige prova atual e revoga sessões antigas', async t => {
    const f = await identityFixture(); t.after(() => f.close()); const user = await f.addUser();
    const login = await f.login(user);
    const enrollment = await f.identity.enroll({ method: 'APP', password: PASSWORD }, context(f, login.accessToken));
    const first = OTPAuth.URI.parse(enrollment.provisioningUri);
    const auth = await f.identity.verify({ challengeToken: enrollment.challengeToken, code: first.generate() });
    await request(f.app).get('/api/users/me').set('Authorization', bearer(login.accessToken)).expect(401);
    const originalSecret = f.state.factors[0].chave;
    await assert.rejects(f.identity.enroll({ method: 'APP', password: PASSWORD }, context(f, auth.accessToken)), { statusCode: 401 });
    assert.equal(f.state.factors[0].chave, originalSecret);
    const rotation = await f.identity.enroll({ method: 'APP', password: PASSWORD, code: first.generate({ timestamp: Date.now() + 30000 }) }, context(f, auth.accessToken));
    assert.equal(f.state.factors[0].chave, originalSecret, 'fator atual só muda após comprovação do novo');
    const second = OTPAuth.URI.parse(rotation.provisioningUri);
    await f.identity.verify({ challengeToken: rotation.challengeToken, code: second.generate() });
    assert.notEqual(f.state.factors[0].chave, originalSecret);
    await request(f.app).get('/api/users/me').set('Authorization', bearer(auth.accessToken)).expect(401);
});

test('cadastro de menor exige provider do vínculo e responsável ativo verificado', async t => {
    const f = await identityFixture(); t.after(() => f.close()); const parent = await f.addUser();
    await f.model.age(null, parent.id_usuario, { ageBand: 'MAIOR_16', expiresAt: sqlDate(Date.now() + 3600000) });
    f.providers.age.verify = async data => ({ verified: true, dateOfBirth: data.dateOfBirth, ageBand: 'ATE_16', reference: 'fixture-minor', verifiedAt: new Date(Date.now() - 1000).toISOString(), expiresAt: new Date(Date.now() + 3600000).toISOString() });
    const minor = { ...input, dateOfBirth: '2015-01-01' };
    await request(f.app).post('/api/auth/register').send(minor).expect(422);
    await request(f.app).post('/api/auth/register').send({ ...minor, guardianProof: 'fixture-binding' }).expect(503);
    f.providers.guardian.verify = async () => ({ verified: true, guardianId: parent.id_usuario, reference: 'fixture-binding' });
    const result = await request(f.app).post('/api/auth/register').send({ ...minor, guardianProof: 'fixture-binding' }).expect(201);
    assert.equal(f.state.guardians[0].id_menor, result.body.data.id);
    assert.equal(f.state.controls[result.body.data.id].compras_permitidas, false);
    assert.equal(f.state.controls[result.body.data.id].assinaturas_permitidas, false);
});

test('renovação de idade valida provider, mantém dados e registra novas evidências/aceites', async t => {
    const f = await identityFixture(); t.after(() => f.close()); const user = await f.addUser(); const auth = await f.login(user);
    const body = { ageProof: 'fixture-renewal', termsVersion: 'fixture-v1', privacyVersion: 'fixture-v1', acceptTerms: true, acceptPrivacy: true };
    await request(f.app).post('/api/users/me/age-verification').set('Authorization', bearer(auth.accessToken)).send({ ...body, dateOfBirth: '1990-01-01' }).expect(422);
    await request(f.app).post('/api/users/me/age-verification').set('Authorization', bearer(auth.accessToken)).send(body).expect(200);
    assert.equal(f.state.ages.length, 1); assert.equal(f.state.consents.length, 2);
    assert.equal(f.state.users[0].data_nascimento, '2000-01-01');
});

test('revogação anterior à mutação e falha transacional não deixam alteração parcial', async t => {
    const f = await identityFixture(); t.after(() => f.close()); const user = await f.addUser(); const auth = await f.login(user); const ctx = context(f, auth.accessToken);
    await f.model.revoke(null, user.id_usuario);
    await assert.rejects(f.profile.patch({ name: 'Forbidden mutation' }, ctx), { statusCode: 401 });
    assert.equal(f.state.users[0].nome, 'Fixture User');
    const fresh = await f.login(f.state.users[0]);
    const original = f.model.updateUser;
    f.model.updateUser = async (...args) => { await original(...args); throw new Error('fixture transactional failure'); };
    await assert.rejects(f.profile.patch({ name: 'Rolled back' }, context(f, fresh.accessToken)));
    assert.equal(f.state.users[0].nome, 'Fixture User');
});

test('logs das rotas de identidade não contêm senha, bearer, provas ou token de recuperação', async t => {
    const f = await identityFixture(); t.after(() => f.close()); const u = await f.addUser();
    const res = await request(f.app).post('/api/auth/login').send({ email: u.email, password: PASSWORD, captchaToken: 'fixture-private-captcha' }).expect(200);
    await request(f.app).post('/api/auth/password/forgot').send({ email: u.email, captchaToken: 'fixture-private-captcha' }).expect(200);
    await f.logQueue.drain();
    const logs = JSON.stringify(f.logs);
    for (const secret of [PASSWORD, res.body.data.accessToken, u.email, 'fixture-private-captcha', f.sent[0].token]) assert.ok(!logs.includes(secret));
});
