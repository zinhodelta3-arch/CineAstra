import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import express from 'express';
import request from 'supertest';
import { createImageStorage } from '../models/imageStorage.js';
import { createGalleryStorage } from '../models/galleryStorage.js';
import { createFilmGalleryService } from '../services/filmGalleryService.js';
import { createFilmGalleryController } from '../controllers/filmGalleryController.js';
import { filmGalleryRoutes } from '../routes/filmGalleryRoutes.js';
import { errorMiddleware } from '../middlewares/errorMiddleware.js';
import { deadline } from '../middlewares/requestMiddleware.js';
import { ApiError } from '../utils/ApiError.js';
import { gallerySchemas } from '../validators/filmGalleryValidators.js';
import { createFilmGalleryModel } from '../models/filmGalleryModel.js';

async function fixture(t) {
    const root = await mkdtemp(join(tmpdir(), 'cineastra-gallery-'));
    t.after(() => rm(root, { recursive: true, force: true }));
    const staging = createImageStorage({ directory: join(root, 'staging') });
    const storage = createGalleryStorage({ directory: join(root, 'gallery'), staging });
    let rows = [], legacy = null, status = 'ATIVO', next = 1, chain = Promise.resolve(), failInsert = false;
    const model = {
        async film(id, admin) { return id === '1' && (admin || status === 'ATIVO') ? { id_filme: id } : null; },
        async lockFilm(c, id) { return id === '1' ? { id_filme: id, status } : null; },
        async image(c, filmId, id) { return rows.find(r => r.id_filme === filmId && r.id_imagem === id) ?? null; },
        async list(id, q, admin) { const [order, key] = q.cursor?.split(':') ?? ['0', '0']; return rows.filter(r => r.id_filme === id && (admin || status === 'ATIVO') && (!q.tipo || r.tipo === q.tipo) && (r.ordem > Number(order) || (r.ordem === Number(order) && BigInt(r.id_imagem) > BigInt(key)))).sort((a, b) => a.ordem - b.ordem || Number(BigInt(a.id_imagem) - BigInt(b.id_imagem))).slice(0, q.limit + 1); },
        async clearPrincipal(c, id, type) { rows.filter(r => r.id_filme === id && r.tipo === type).forEach(r => { r.principal = false; }); },
        async insert(c, id, data) { if (failInsert) throw Error('SQL fixture'); const key = String(next++); rows.push({ id_imagem: key, id_filme: id, ...data }); return key; },
        async patch(c, id, key, data) { Object.assign(rows.find(r => r.id_imagem === key), data); },
        async remove(c, id, key) { rows = rows.filter(r => r.id_imagem !== key); },
        async syncCover() { legacy = rows.find(r => r.tipo === 'CAPA' && r.principal)?.url ?? null; },
        async reference(c, url) { return rows.find(r => r.url === url) ?? null; },
        async publicReference(url) { return status === 'ATIVO' ? rows.find(r => r.url === url) ?? null : null; }
    };
    const identity = {
        async transaction(fn) { const prior = chain; let release; chain = new Promise(resolve => { release = resolve; }); await prior; const snapshot = structuredClone({ rows, legacy, next }); try { return await fn({}); } catch (error) { ({ rows, legacy, next } = snapshot); throw error; } finally { release(); } },
        async activeActor(c, ctx) { return { tipo_usuario: ctx.actor?.tipo }; }, async audit() {}
    };
    const service = createFilmGalleryService({ model, identity, storage });
    const app = express(); app.use(deadline(3000), express.json()); app.use((req, res, next) => { res.locals.requestId = '00000000-0000-4000-8000-000000000001'; next(); });
    app.use(filmGalleryRoutes(createFilmGalleryController(service), { auth(req, res, next) { if (!req.headers['x-fixture-role']) throw ApiError.naoAutorizado(); req.usuario = { id: '1', tipo: req.headers['x-fixture-role'] }; next(); }, limits: { upload: [] } })); app.use(errorMiddleware);
    return { app, staging, storage, service, root, get rows() { return rows; }, get legacy() { return legacy; }, set status(v) { status = v; }, set failInsert(v) { failInsert = v; } };
}
const endpoint = '/api/admin/films/1/images';
const context = { actor: { tipo: 'ADMIN' } };

test('galeria: segunda CAPA principal substitui primeira, URL pública, legado e ordenação', async t => {
    const f = await fixture(t), source = await f.staging.put({ buffer: Buffer.from('webp fixture') });
    const body = { stagingKey: source.key, tipo: 'CAPA', principal: true, texto_alternativo: 'Cartaz', ordem: 2 };
    await request(f.app).post(endpoint).send(body).expect(401);
    await request(f.app).post(endpoint).set('X-Fixture-Role', 'CLIENTE').send(body).expect(403);
    const results = [await request(f.app).post(endpoint).set('X-Fixture-Role', 'ADMIN').send(body), await request(f.app).post(endpoint).set('X-Fixture-Role', 'ADMIN').send({ ...body, ordem: 1 })];
    assert.deepEqual(results.map(r => r.status), [201, 201], JSON.stringify(results.map(r => r.body)));
    assert.equal(f.rows.filter(r => r.tipo === 'CAPA' && r.principal).length, 1);
    assert.equal(f.legacy, f.rows.find(r => r.principal).url);
    const page = await request(f.app).get('/api/films/1/images?limit=1').expect(200);
    assert.equal(page.body.data.items[0].ordem, 1);
    const cursor = page.body.data.pagination.nextCursor;
    assert.equal((await request(f.app).get(`/api/films/1/images?limit=1&cursor=${cursor}`).expect(200)).body.data.items[0].ordem, 2);
    assert.ok(!page.text.includes('staging'));
    const image = await request(f.app).get(results[0].body.data.url).expect(200).expect('Content-Type', 'image/webp');
    assert.deepEqual(image.body, Buffer.from('webp fixture'));
    f.status = 'INATIVO';
    await request(f.app).get(results[0].body.data.url).expect(404);
    await request(f.app).get('/api/films/1/images').expect(404);
    await request(f.app).get(endpoint).set('X-Fixture-Role', 'ADMIN').expect(200);
});

test('galeria: promoção falha no SQL, compensação remove arquivo e staging permanece', async t => {
    const f = await fixture(t), source = await f.staging.put({ buffer: Buffer.from('webp fixture') });
    f.failInsert = true;
    await assert.rejects(f.service.create('1', { stagingKey: source.key, tipo: 'CAPA', principal: true, ordem: 0 }, context), /SQL fixture/);
    assert.equal(f.rows.length, 0);
    assert.deepEqual(await readdir(join(f.root, 'gallery')), []);
    assert.deepEqual(await f.staging.read(source.key), Buffer.from('webp fixture'));
});

test('galeria: PATCH troca principal e tipo, DELETE remove arquivo e projeção legada', async t => {
    const f = await fixture(t), source = await f.staging.put({ buffer: Buffer.from('webp fixture') });
    const a = await f.service.create('1', { stagingKey: source.key, tipo: 'CAPA', principal: true, ordem: 0 }, context);
    const b = await f.service.create('1', { stagingKey: source.key, tipo: 'CAPA', principal: false, ordem: 1 }, context);
    await request(f.app).patch(`${endpoint}/${b.id_imagem}`).set('X-Fixture-Role', 'ADMIN').send({ principal: true }).expect(200);
    assert.equal(f.rows.find(r => r.id_imagem === a.id_imagem).principal, false);
    assert.equal(f.legacy, b.url);
    await request(f.app).patch(`${endpoint}/${b.id_imagem}`).set('X-Fixture-Role', 'ADMIN').send({ tipo: 'BANNER' }).expect(200);
    assert.equal(f.legacy, null);
    await request(f.app).delete(`${endpoint}/${a.id_imagem}`).set('X-Fixture-Role', 'ADMIN').expect(204);
    await request(f.app).get(a.url).expect(404);
    await request(f.app).get(b.url).expect(200);
    assert.equal((await request(f.app).post(`${endpoint}/reconcile`).set('X-Fixture-Role', 'ADMIN').expect(200)).body.data.pending, 0);
});

test('galeria: schemas estritos e SQL não escreve coluna gerada', async () => {
    for (const value of [{ stagingKey: 'https://private.invalid/img' }, { stagingKey: 'x.webp', tipo_principal: 'CAPA' }]) assert.equal(gallerySchemas.create.safeParse(value).success, false);
    assert.equal(gallerySchemas.query.safeParse({ cursor: '4294967296:1' }).success, false);
    const calls = [], database = { async execute(sql, params) { calls.push({ sql, params }); return [sql.startsWith('INSERT') ? { insertId: '9007199254740993' } : []]; } }, model = createFilmGalleryModel(database);
    await model.list('1', { limit: 2, cursor: '4:9007199254740993' }, false);
    assert.ok(calls[0].sql.includes('ORDER BY i.ordem,i.id_imagem'));
    assert.ok(calls[0].params.includes('9007199254740993'));
    await model.insert(database, '1', { tipo: 'CAPA', url: '/api/film-images/test', ordem: 0, principal: true });
    assert.ok(!calls[1].sql.includes('tipo_principal'));
});
