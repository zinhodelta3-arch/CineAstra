import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { fixture } from './helpers.js';
import { createJwt } from '../config/jwt.js';
import { allowRoles, requireOwner, requireOperationalScope } from '../middlewares/authMiddleware.js';
import { createApp } from '../app.js';
import { unavailableCaptchaProvider, requireCaptcha } from '../providers/captchaProvider.js';

function secureFixture(options = {}) {
    return fixture({ ...options, registerRoutes(app, { auth, limits }) {
        app.get('/__test/private', auth, (req, res) => res.json(req.usuario));
        app.get('/__test/admin', auth, allowRoles('ADMIN'), (req, res) => res.json({ ok: true }));
        app.get('/__test/owner', auth, requireOwner(async () => '2'), (req, res) => res.json({ ok: true }));
        app.get('/__test/scope', auth, requireOperationalScope(async () => false), (req, res) => res.json({ ok: true }));
        app.get('/__test/no-scope', auth, requireOperationalScope(), (req, res) => res.json({ ok: true }));
        app.post('/__test/login-limit', ...limits.login, (req, res) => res.json({ ok: true }));
    } });
}
const token = f => createJwt(f.config.jwt).signAccess({ userId: '1', sessionId: '9007199254740993' });
test('JWT válido exige sessão ativa e usuário atual; payload mínimo sem role/email/hash', async () => {
    const f = secureFixture();
    const signed = token(f);
    const claims = jwt.decode(signed);
    assert.equal(claims.sub, '1');
    assert.equal(claims.sid, '9007199254740993');
    assert.equal(claims.tipo, undefined); assert.equal(claims.email, undefined);
    const res = await request(f.app).get('/__test/private').set('Authorization', `Bearer ${signed}`).expect(200);
    assert.deepEqual(res.body, { id: '1', tipo: 'CLIENTE', sessionId: '9007199254740993' });
});
test('JWT ausente/formato inválido/expirado/issuer-audience/algoritmo/tampering são 401', async () => {
    const f = secureFixture();
    await request(f.app).get('/__test/private').expect(401);
    const base = { sid: '1', jti: 'test-jti', purpose: 'access' };
    const make = opts => jwt.sign(base, f.config.jwt.secret, { subject: '1', issuer: f.config.jwt.issuer, audience: f.config.jwt.audience, expiresIn: 60, ...opts });
    for (const header of ['Basic abc', `Bearer ${token(f)}x`, `Bearer ${make({ expiresIn: -1 })}`, `Bearer ${make({ issuer: 'evil' })}`, `Bearer ${make({ audience: 'evil' })}`, `Bearer ${make({ algorithm: 'HS384' })}`, `Bearer ${make({ expiresIn: 3600 })}`]) {
        const res = await request(f.app).get('/__test/private').set('Authorization', header).expect(401);
        assert.equal(res.headers['www-authenticate'], 'Bearer');
        assert.ok(!res.text.includes(header));
    }
});
test('perfil CLIENTE negado em ADMIN; uppercase ADMIN reconhecido; 2FA obrigatório', async () => {
    const client = secureFixture();
    await request(client.app).get('/__test/admin').set('Authorization', `Bearer ${token(client)}`).expect(403);
    const database = { async execute() { return [[{ id_usuario: '1', tipo_usuario: 'ADMIN', status: 'ATIVO' }]]; }, async ping() {} };
    const admin = secureFixture({ database });
    await request(admin.app).get('/__test/admin').set('Authorization', `Bearer ${token(admin)}`).expect(200);
    const incomplete = secureFixture({ database, sessionProvider: { async verifyActive() { return { userId: '1', expiresAt: new Date(Date.now() + 60000), revoked: false, twoFactorVerified: false }; } } });
    await request(incomplete.app).get('/__test/admin').set('Authorization', `Bearer ${token(incomplete)}`).expect(403);
    assert.throws(() => allowRoles('admin'));
});
test('usuário bloqueado, sessão revogada, vencida ou data inválida não autenticam', async () => {
    const blocked = secureFixture({ database: { async execute() { return [[{ id_usuario: '1', tipo_usuario: 'CLIENTE', status: 'BLOQUEADO' }]]; } } });
    await request(blocked.app).get('/__test/private').set('Authorization', `Bearer ${token(blocked)}`).expect(401);
    for (const session of [{ userId: '1', revoked: true, expiresAt: new Date(Date.now() + 10000) }, { userId: '1', expiresAt: 'invalid' }, { userId: '1', expiresAt: new Date(0) }]) {
        const f = secureFixture({ sessionProvider: { async verifyActive() { return session; } } });
        await request(f.app).get('/__test/private').set('Authorization', `Bearer ${token(f)}`).expect(401);
    }
});
test('propriedade e vínculo operacional negam IDOR; provider de vínculo ausente dá 503', async () => {
    const f = secureFixture();
    for (const [path, status] of [['owner', 403], ['scope', 403], ['no-scope', 503]]) await request(f.app).get(`/__test/${path}`).set('Authorization', `Bearer ${token(f)}`).expect(status);
});
test('sem provider de sessão do Prompt02: JWT válido falha 503, não ignora revogação', async () => {
    const f = fixture();
    const app = createApp({ config: f.config, database: f.database, logQueue: f.logQueue, retention: { async check() { return true; } }, registerRoutes(app, { auth }) { app.get('/__test/private', auth, (req, res) => res.json({ ok: true })); } });
    await request(app).get('/__test/private').set('Authorization', `Bearer ${token(f)}`).expect(503);
});
test('limiter login por identidade independente do IP, sem persistir email em chave', async () => {
    // Proxy local explicitamente confiável SOMENTE nesta fixture para simular IPs distintos.
    const f = secureFixture({ config: { trustProxy: ['127.0.0.1', '::1'] } });
    for (let i = 0; i < 10; i++) await request(f.app).post('/__test/login-limit').set('X-Forwarded-For', `203.0.113.${i + 1}`).send({ email: 'test@invalid.example' }).expect(200);
    await request(f.app).post('/__test/login-limit').set('X-Forwarded-For', '203.0.113.100').send({ email: 'test@invalid.example' }).expect(429);
});
test('CAPTCHA fail-closed: ausência 422, token + provider não configurado 503, false 422', async () => {
    for (const [provider, body, status] of [[unavailableCaptchaProvider(), {}, 422], [unavailableCaptchaProvider(), { captchaToken: 'opaque' }, 503], [{ async verify() { return false; } }, { captchaToken: 'opaque' }, 422]]) {
        const f = fixture({ registerRoutes(app) { app.post('/__test/captcha', requireCaptcha(provider), (req, res) => res.json({ ok: true })); } });
        await request(f.app).post('/__test/captcha').send(body).expect(status);
    }
});
