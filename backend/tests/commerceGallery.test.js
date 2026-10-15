import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import express from 'express';
import request from 'supertest';
import { createImageStorage } from '../models/imageStorage.js';
import { createGalleryStorage } from '../models/galleryStorage.js';
import { createCommerceGalleryService } from '../services/commerceGalleryService.js';
import { createCommerceGalleryController } from '../controllers/commerceGalleryController.js';
import { commerceGalleryRoutes } from '../routes/commerceGalleryRoutes.js';
import { errorMiddleware } from '../middlewares/errorMiddleware.js';
import { deadline } from '../middlewares/requestMiddleware.js';
import { ApiError } from '../utils/ApiError.js';

async function fixture(t) {
    const root = await mkdtemp(join(tmpdir(), 'cineastra-commerce-gallery-'));
    t.after(() => rm(root, { recursive: true, force: true }));
    const staging = createImageStorage({ directory: join(root, 'staging'), enforceOwner: true });
    const storage = {
        inputs: createGalleryStorage({ directory: join(root, 'inputs'), staging, namespace: 'input-images' }),
        combos: createGalleryStorage({ directory: join(root, 'combos'), staging, namespace: 'combo-images' })
    };
    let rows = { inputs: [], combos: [] }, next = 1, chain = Promise.resolve(), failInsert = false, visible = true;
    const parentKey = type => type === 'inputs' ? 'id_insumo' : 'id_combo';
    const model = {
        async parent(type, id) { return id === '1' ? { [parentKey(type)]: id } : null; },
        async lockParent(type, c, id) { return id === '1' ? { [parentKey(type)]: id } : null; },
        async publicParent(type, id) { return visible && id === '1' ? { [parentKey(type)]: id } : null; },
        async ownership() { return { id_usuario: '2', fornecedor_status: 'ATIVO', usuario_status: 'ATIVO', tipo_usuario: 'FORNECEDOR', local_status: 'ATIVO', vinculo_status: 'ATIVO' }; },
        async image(type, c, id, imageId) { return rows[type].find(r => r[parentKey(type)] === id && r.id_imagem === imageId) ?? null; },
        async list(type, id, q) { return rows[type].filter(r => r[parentKey(type)] === id && (!q.tipo || r.tipo === q.tipo)).sort((a,b) => a.ordem - b.ordem || Number(BigInt(a.id_imagem) - BigInt(b.id_imagem))).slice(0,q.limit + 1); },
        async clearPrincipal(type, c, id) { rows[type].filter(r => r[parentKey(type)] === id && r.tipo === 'PRINCIPAL').forEach(r => { r.tipo = 'ALTERNATIVA'; }); },
        async insert(type, c, id, data) { if (failInsert) throw new Error('SQL fixture'); const imageId = String(next++); rows[type].push({ id_imagem: imageId, [parentKey(type)]: id, ...data }); return imageId; },
        async patch(type, c, id, imageId, data) { Object.assign(rows[type].find(r => r.id_imagem === imageId), data); },
        async remove(type, c, id, imageId) { rows[type] = rows[type].filter(r => r.id_imagem !== imageId); },
        async reference(type, c, url) { return rows[type].find(r => r.url === url) ?? null; },
        async publicReference(type, url) { return visible ? rows[type].find(r => r.url === url) ?? null : null; }
    };
    const identity = {
        async transaction(fn) { const previous = chain; let release; chain = new Promise(resolve => { release = resolve; }); await previous; const snapshot = structuredClone({ rows, next }); try { return await fn({}); } catch (error) { ({ rows, next } = snapshot); throw error; } finally { release(); } },
        async activeActor(c, context) { return { id_usuario: context.actor.id, tipo_usuario: context.actor.tipo }; }, async audit() {}
    };
    const service = createCommerceGalleryService({ model, identity, storage });
    const app = express(); app.use(deadline(3000), express.json()); app.use((req,res,next) => { res.locals.requestId = '00000000-0000-4000-8000-000000000001'; next(); });
    app.use(commerceGalleryRoutes(createCommerceGalleryController(service), { auth(req,res,next) { const role = req.headers['x-role']; if (!role) throw ApiError.naoAutorizado(); req.usuario = { id: req.headers['x-user'] ?? '1', tipo: role }; next(); }, limits: { upload: [] } })); app.use(errorMiddleware);
    return { app, staging, storage, root, get rows() { return rows; }, set failInsert(v) { failInsert = v; }, set visible(v) { visible = v; } };
}

test('insumo: fornecedor próprio promove PRINCIPAL sob lock; alheio não usa staging nem altera galeria', async t => {
    const f = await fixture(t);
    const first = await f.staging.put({ buffer: Buffer.from('webp') }, undefined, '2');
    await assert.rejects(f.staging.read(first.key, '3'), { statusCode: 403 });
    await request(f.app).post('/api/inputs/1/images').set('X-Role','FORNECEDOR').set('X-User','3').send({ stagingKey: first.key, tipo: 'PRINCIPAL' }).expect(403);
    const send = () => request(f.app).post('/api/inputs/1/images').set('X-Role','FORNECEDOR').set('X-User','2').send({ stagingKey: first.key, tipo: 'ALTERNATIVA', texto_alternativo: 'Milho', ordem: 0 });
    const firstImage = await send().expect(201);
    const secondImage = await send().expect(201);
    const result = await Promise.all([firstImage, secondImage].map(r => request(f.app).patch(`/api/inputs/1/images/${r.body.data.id_imagem}`).set('X-Role','FORNECEDOR').set('X-User','2').send({ tipo: 'PRINCIPAL' })));
    assert.deepEqual(result.map(r => r.status).sort(), [200,200]);
    assert.equal(f.rows.inputs.filter(r => r.tipo === 'PRINCIPAL').length, 1);
    assert.ok(f.rows.inputs.every(r => r.url.startsWith('/api/input-images/')));
    const id = firstImage.body.data.id_imagem;
    await request(f.app).patch(`/api/inputs/1/images/${id}`).set('X-Role','FORNECEDOR').set('X-User','3').send({ ordem: 1 }).expect(403);
    await request(f.app).get('/api/inputs/1/images').expect(200);
    f.visible = false;
    await request(f.app).get('/api/inputs/1/images').expect(404);
    await request(f.app).get(f.rows.inputs[0].url).expect(404);
});

test('combo: ADMIN exclusivo, compensação SQL e remoção preservam staging privado', async t => {
    const f = await fixture(t);
    const source = await f.staging.put({ buffer: Buffer.from('webp') }, undefined, '1');
    await request(f.app).post('/api/admin/combos/1/images').set('X-Role','FORNECEDOR').set('X-User','2').send({ stagingKey: source.key }).expect(403);
    f.failInsert = true;
    await request(f.app).post('/api/admin/combos/1/images').set('X-Role','ADMIN').send({ stagingKey: source.key, tipo: 'PRINCIPAL' }).expect(500);
    assert.equal((await readdir(join(f.root,'combos'))).filter(x => x.endsWith('.webp')).length, 0);
    f.failInsert = false;
    const created = await request(f.app).post('/api/admin/combos/1/images').set('X-Role','ADMIN').send({ stagingKey: source.key, tipo: 'PRINCIPAL' }).expect(201);
    assert.equal(created.body.data.tipo, 'PRINCIPAL');
    await request(f.app).get(created.body.data.url).expect(200);
    await request(f.app).delete(`/api/admin/combos/1/images/${created.body.data.id_imagem}`).set('X-Role','ADMIN').expect(204);
    await request(f.app).get(created.body.data.url).expect(404);
    assert.equal((await readdir(join(f.root,'combos'))).filter(x => x.endsWith('.webp')).length, 0);
});
