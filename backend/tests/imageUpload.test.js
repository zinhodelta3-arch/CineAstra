import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { request as httpRequest } from 'node:http';
import express from 'express';
import request from 'supertest';
import sharp from 'sharp';
import * as OTPAuth from 'otpauth';
import { identityFixture } from './identityFixture.js';
import { normalizeImage, IMAGE_LIMITS } from '../services/imageProcessor.js';
import { createImageStorage, STAGING_TTL_MS } from '../models/imageStorage.js';
import { createImageUploadService } from '../services/imageUploadService.js';
import { createImageUploadController } from '../controllers/imageUploadController.js';
import { imageUploadRoutes } from '../routes/imageUploadRoutes.js';
import { errorMiddleware } from '../middlewares/errorMiddleware.js';
import { requestId, deadline } from '../middlewares/requestMiddleware.js';
import { ApiError } from '../utils/ApiError.js';
import { validateEnv } from '../config/env.js';
import { testEnvironment } from './helpers.js';

const endpoint = '/api/admin/uploads/images';
const png = () => sharp({ create: { width: 8, height: 4, channels: 3, background: 'red' } }).png().toBuffer();
const file = (buffer, mimetype = 'image/png') => ({ buffer, mimetype });
async function directory(t) {
    const root = await mkdtemp(join(tmpdir(), 'cineastra-image-test-'));
    t.after(async () => { assert.equal(dirname(resolve(root)), resolve(tmpdir())); assert.match(root, /cineastra-image-test-/); await rm(root, { recursive: true, force: true }); });
    return root;
}
async function fixture(t, options = {}) {
    const root = await directory(t), storage = createImageStorage({ directory: root });
    const service = createImageUploadService({ storage, authorize: async () => {}, ...options });
    const app = express(); app.use(requestId, deadline(1500));
    // Auth simulada somente nos casos parser/storage; teste abaixo usa app/JWT/TOTP reais.
    app.use(imageUploadRoutes(createImageUploadController(service), { auth(req, res, next) { req.usuario = { id: '1', tipo: 'ADMIN' }; next(); }, limits: { upload: [] } }));
    app.use(errorMiddleware);
    return { root, app, service, storage };
}

test('imagens: assinatura + decoder reais, metadados removidos, dimensões, formatos e animação', async () => {
    const input = await sharp(await png()).withMetadata({ orientation: 6 }).png().toBuffer();
    const result = await normalizeImage(file(Buffer.concat([input, Buffer.from('<script>fixture</script>')])));
    const meta = await sharp(result.buffer).metadata();
    assert.equal(meta.format, 'webp'); assert.equal(meta.exif, undefined); assert.equal(meta.icc, undefined);
    assert.ok(!result.buffer.includes(Buffer.from('<script>')));
    for (const [b, mime] of [[Buffer.from('<svg/>'), 'image/png'], [input, 'image/jpeg'], [input.subarray(0, 20), 'image/png']]) await assert.rejects(normalizeImage(file(b, mime)), { statusCode: 415 });
    const oversized = await sharp({ create: { width: 8200, height: 1, channels: 3, background: 'red' } }).png().toBuffer();
    await assert.rejects(normalizeImage(file(oversized)), { statusCode: 415 });
    const pixels = await sharp({ create: { width: 4100, height: 4000, channels: 3, background: 'red' } }).png().toBuffer();
    await assert.rejects(normalizeImage(file(pixels)), { statusCode: 415 });
    const large = await sharp({ create: { width: 3000, height: 100, channels: 3, background: 'red' } }).jpeg().toBuffer();
    assert.equal((await normalizeImage(file(large, 'image/jpeg'))).width, 2048);
    const frames = Buffer.from([255, 0, 0, 255, 255, 0, 0, 255, 0, 255, 0, 255, 0, 255, 0, 255]);
    const animated = await sharp(frames, { raw: { width: 2, height: 2, channels: 4, pageHeight: 1 } }).webp({ delay: [100, 100], loop: 0 }).toBuffer();
    assert.equal((await sharp(animated).metadata()).pages, 2);
    await assert.rejects(normalizeImage(file(animated, 'image/webp')), { statusCode: 415 });
    await assert.rejects(normalizeImage(file(Buffer.alloc(IMAGE_LIMITS.bytes + 1))), { statusCode: 413 });
});

test('upload HTTP integrado: ADMIN/TOTP, prévia privada, nome aleatório, remoção e revogação', async t => {
    const root = await directory(t), f = await identityFixture({ env: { IMAGE_STAGING_DIR: root } }); t.after(() => f.close());
    const input = await png();
    await request(f.app).post(endpoint).attach('image', input, 'a.png').expect(401);
    const client = await f.addUser(), clientAuth = await f.login(client);
    await request(f.app).post(endpoint).set('Authorization', `Bearer ${clientAuth.accessToken}`).attach('image', input, 'a.png').expect(403);
    const admin = await f.addUser('ADMIN'), login = await f.login(admin);
    const enrollment = await f.identity.enroll({ challengeToken: login.challengeToken, method: 'APP' });
    const auth = await f.identity.verify({ challengeToken: enrollment.challengeToken, code: OTPAuth.URI.parse(enrollment.provisioningUri).generate() });
    const bearer = `Bearer ${auth.accessToken}`;
    const created = await request(f.app).post(endpoint).set('Authorization', bearer).attach('image', input, { filename: '../../payload.php', contentType: 'image/png' }).expect(201);
    const data = created.body.data;
    assert.match(data.key, /^[a-f0-9-]{36}\.webp$/); assert.ok(!created.text.includes(root));
    assert.equal(created.headers.location, data.previewUrl);
    const preview = await request(f.app).get(data.previewUrl).set('Authorization', bearer).expect(200).expect('Content-Type', 'image/webp');
    assert.equal(preview.headers['x-content-type-options'], 'nosniff'); assert.equal(preview.headers['cache-control'], 'no-store');
    assert.equal((await sharp(preview.body).metadata()).format, 'webp');
    await request(f.app).get(data.previewUrl).expect(401);
    await request(f.app).get(`/uploads/${data.key}`).expect(404);
    await request(f.app).delete(data.previewUrl).set('Authorization', bearer).expect(204);
    assert.deepEqual(await readdir(root), []);
    // POST + DELETE anteriores contam no mesmo limiter de upload por usuário/IP.
    for (let i = 0; i < 8; i++) await request(f.app).post(endpoint).set('Authorization', bearer).send({}).expect(415);
    await request(f.app).post(endpoint).set('Authorization', bearer).send({}).expect(429);
    await request(f.app).post('/api/auth/logout').set('Authorization', bearer).expect(204);
    await request(f.app).post(endpoint).set('Authorization', bearer).attach('image', input, 'a.png').expect(401);
});

test('multipart: forjado, tamanho, partes, campo indevido e formato quebrado não persistem', async t => {
    const f = await fixture(t), input = await png();
    await request(f.app).post(endpoint).attach('image', Buffer.from('fake'), { filename: 'fake.png', contentType: 'image/png' }).expect(415);
    await request(f.app).post(endpoint).attach('image', Buffer.alloc(IMAGE_LIMITS.bytes + 1), 'huge.png').expect(413);
    await request(f.app).post(endpoint).field('url', 'http://127.0.0.1/private').attach('image', input, 'a.png').expect(400);
    await request(f.app).post(endpoint).attach('image', input, 'a.png').attach('image', input, 'b.png').expect(400);
    await request(f.app).post(endpoint).attach('other', input, 'a.png').expect(400);
    await request(f.app).post(endpoint).set('Content-Type', 'multipart/form-data; boundary=bad').send('--bad\r\nwrong').expect(400);
    await request(f.app).post(endpoint).send({ url: 'http://localhost' }).expect(415);
    await request(f.app).get(`${endpoint}/..%5Csecret`).expect(404);
    assert.deepEqual(await readdir(f.root), []);
});

test('storage real: expiração, quota, chave segura, abort e admissão concorrente', async t => {
    const root = await directory(t); let now = Date.now();
    const storage = createImageStorage({ directory: root, maxFiles: 1, now: () => now });
    const image = await normalizeImage(file(await png()));
    const saved = await storage.put(image);
    await assert.rejects(storage.put(image), { code: 'UPLOAD_STORAGE_FULL' });
    await assert.rejects(storage.read('../secret'), { statusCode: 404 });
    now += STAGING_TTL_MS + 1000;
    await assert.rejects(storage.read(saved.key), { statusCode: 404 });
    const controller = new AbortController(); controller.abort();
    await assert.rejects(storage.put(image, controller.signal), { statusCode: 408 });
    assert.deepEqual(await readdir(root), []);
    await assert.rejects(createImageStorage().put(image), { statusCode: 503 });
    const service = createImageUploadService({ storage, authorize: async () => { throw ApiError.naoAutorizado(); } });
    const a = service.acquire(), b = service.acquire(); assert.throws(() => service.acquire(), { statusCode: 503 }); a(); a(); const c = service.acquire(); b(); c();
    await assert.rejects(service.upload(file(await png()), {}), { statusCode: 401 });
    assert.deepEqual(await readdir(root), []);
    assert.throws(() => validateEnv(testEnvironment({ IMAGE_STAGING_DIR: '../public' })), /IMAGE_STAGING_DIR/);
});

test('conexão abortada durante multipart e após armazenamento limpa arquivos e libera slot', async t => {
    const f = await fixture(t);
    const server = f.app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
    t.after(() => new Promise(resolve => server.close(resolve)));
    await new Promise(resolve => {
        const req = httpRequest({ host: '127.0.0.1', port: server.address().port, path: endpoint, method: 'POST', headers: { 'Content-Type': 'multipart/form-data; boundary=abort-test', 'Content-Length': 100000 } });
        req.on('error', () => {}); req.on('close', resolve);
        req.write('--abort-test\r\nContent-Disposition: form-data; name="image"; filename="a.png"\r\nContent-Type: image/png\r\n\r\npartial');
        setTimeout(() => req.destroy(), 30);
    });
    // Esperar o encerramento do parser abortado no servidor, não simular sucesso.
    await new Promise(resolve => setTimeout(resolve, 30));
    assert.deepEqual(await readdir(f.root), []);
    const result = await request(f.app).post(endpoint).attach('image', await png(), 'a.png').expect(201);
    await f.storage.remove(result.body.data.key);
    const controller = new AbortController();
    const storage = { async put(image, signal) { const result = await f.storage.put(image, signal); controller.abort(); return result; }, remove: key => f.storage.remove(key) };
    const service = createImageUploadService({ storage, authorize: async () => {} });
    // O serviço deve compensar um abort ocorrido imediatamente após put.
    await assert.rejects(service.upload(file(await png()), { signal: controller.signal }), { statusCode: 408 });
    assert.deepEqual(await readdir(f.root), []);
});
