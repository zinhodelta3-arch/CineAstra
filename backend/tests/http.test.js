import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { fixture } from './helpers.js';
import { ApiError } from '../utils/ApiError.js';
import { validateOpenapi } from '../scripts/validateOpenapi.js';

test('app importável sem listen; raiz/liveness com requestId e Helmet, sem dados internos', async () => {
    const { app } = fixture();
    for (const path of ['/', '/health']) {
        const res = await request(app).get(path).set('X-Request-Id', 'cliente-nao-confiavel').expect(200);
        assert.equal(res.body.success, true);
        assert.match(res.body.requestId, /^[a-f0-9-]{36}$/);
        assert.equal(res.body.requestId, res.headers['x-request-id']);
        assert.equal(res.headers['x-powered-by'], undefined);
        assert.equal(res.headers['x-content-type-options'], 'nosniff');
        assert.ok(res.headers['content-security-policy'].includes("script-src 'self'"));
        assert.ok(!JSON.stringify(res.body).includes('DB_'));
    }
});
test('readiness real dependência: falha de banco, retenção ou shutdown retorna 503 seguro', async () => {
    await request(fixture().app).get('/ready').expect(200);
    for (const overrides of [{ database: { async ping() { throw new Error('SQL senha token'); } } }, { retention: { async check() { return false; } } }, { lifecycle: { stopping: true } }]) {
        const res = await request(fixture(overrides).app).get('/ready').expect(503);
        assert.equal(res.headers['retry-after'], '5');
        assert.equal(res.body.code, 'DEPENDENCY_UNAVAILABLE');
        assert.ok(!res.text.includes('SQL'));
    }
});
test('404/erro assíncrono/validação não expõem URL, SQL, stack ou detalhes arbitrários', async () => {
    const { app } = fixture({ registerRoutes(app) {
        app.get('/__test/error', async () => { throw new Error('SELECT segredo senha token'); });
        app.get('/__test/validation', () => { throw ApiError.validacao('Entrada inválida', [{ field: 'nome', code: 'REQUIRED', token: 'segredo' }, { field: 'senha', code: 'insecure message' }]); });
    } });
    const missing = await request(app).get('/nao-existe/segredo?token=segredo').expect(404);
    assert.ok(!missing.text.includes('segredo'));
    const failed = await request(app).get('/__test/error').expect(500);
    assert.ok(!/SELECT|segredo|stack/.test(failed.text));
    const invalid = await request(app).get('/__test/validation').expect(422);
    assert.deepEqual(invalid.body.details, [{ field: 'nome', code: 'REQUIRED' }]);
});
test('CORS whitelist, PATCH, sem cookie credencial e sem confiar X-Forwarded-For', async () => {
    const { app } = fixture({ registerRoutes(app) { app.get('/__test/ip', (req, res) => res.json({ ip: req.ip })); } });
    const res = await request(app).options('/health').set('Origin', 'http://localhost:3000').set('Access-Control-Request-Method', 'PATCH').expect(204);
    assert.ok(res.headers['access-control-allow-methods'].includes('PATCH'));
    assert.equal(res.headers['access-control-allow-credentials'], undefined);
    await request(app).get('/health').set('Origin', 'https://evil.invalid').expect(403);
    const ip = await request(app).get('/__test/ip').set('X-Forwarded-For', '203.0.113.5').expect(200);
    assert.notEqual(ip.body.ip, '203.0.113.5');
});
test('JSON/urlencoded limitados; parser errors e 429 são registrados sem bodies/query/URL real', async () => {
    const { app, logs, logQueue } = fixture({ config: { bodyLimit: 1024 }, registerRoutes(app) { app.post('/__test/body', (req, res) => res.json({ ok: true })); } });
    await request(app).post('/__test/body').set('Content-Type', 'application/json').send('{invalido').expect(400);
    await request(app).post('/__test/body?token=segredo').send({ senha: 'x'.repeat(2000) }).expect(413);
    await request(app).post('/__test/body').set('Content-Type', 'application/x-www-form-urlencoded').send('a=' + 'x'.repeat(2000)).expect(413);
    await logQueue.drain();
    assert.equal(logs.length, 3);
    assert.ok(!/senha|token|segredo|invalido/.test(JSON.stringify(logs)));
    assert.equal(logs[0].route, '[unmatched-or-middleware]');
});
test('limite geral 429 Retry-After e erro registrado', async () => {
    const { app, logs, logQueue } = fixture({ config: { rate: { max: 1, windowMs: 60000 } } });
    await request(app).get('/health').expect(200);
    const limited = await request(app).get('/health').expect(429);
    assert.ok(Number(limited.headers['retry-after']) > 0);
    await logQueue.drain();
    assert.equal(logs.at(-1).status, 429);
});
test('deadline dá feedback 503 e aborta sinal recebido pelo provider', async () => {
    let aborted = false;
    const { app } = fixture({ config: { httpTimeout: 40 }, registerRoutes(app) {
        app.get('/__test/hang', req => new Promise(resolve => req.signal.addEventListener('abort', () => { aborted = true; resolve(); }, { once: true })));
    } });
    await request(app).get('/__test/hang').expect(503);
    assert.equal(aborted, true);
});
test('Swagger JSON/UI/assets servidos, Authorize e CSP restrito à documentação', async () => {
    const spec = await validateOpenapi();
    const { app } = fixture();
    const json = await request(app).get('/openapi.json').expect(200);
    assert.deepEqual(Object.keys(json.body.paths), Object.keys(spec.paths));
    assert.equal(json.body.components.securitySchemes.bearerAuth.scheme, 'bearer');
    const ui = await request(app).get('/api-docs/').expect(200);
    assert.match(ui.text, /swagger-ui/);
    assert.ok(ui.headers['content-security-policy'].includes("style-src 'self' 'unsafe-inline'"));
    const script = await request(app).get('/api-docs/swagger-ui-init.js').expect(200);
    assert.ok(script.text.includes('persistAuthorization'));
    assert.ok(script.text.includes('false'));
    // A biblioteca inclui branches genéricos de preauthorize; nenhuma opção os ativa.
    assert.ok(!/"preauthorizeApiKey"\s*:|"authAction"\s*:/.test(script.text));
    await request(app).get('/api-docs/swagger-ui-bundle.js').expect(200);
    await request(fixture({ config: { production: true, docsEnabled: false } }).app).get('/openapi.json').expect(404);
    await request(fixture({ config: { docsEnabled: false } }).app).get('/api-docs/').expect(404);
});
test('BigInt JSON e IDs grandes são transmitidos sem arredondamento', async () => {
    const { app } = fixture({ registerRoutes(app) { app.get('/__test/id', (req, res) => res.json({ id: 9007199254740993n })); } });
    const res = await request(app).get('/__test/id').expect(200);
    assert.equal(res.body.id, '9007199254740993');
});
