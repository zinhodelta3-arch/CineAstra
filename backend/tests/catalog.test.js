import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import express from 'express';
import { createCatalogService, filmDto } from '../services/catalogService.js';
import { createCatalogModel } from '../models/catalogModel.js';
import { createCatalogController } from '../controllers/catalogController.js';
import { catalogRoutes } from '../routes/catalogRoutes.js';
import { catalogSchemas } from '../validators/catalogValidators.js';
import { errorMiddleware } from '../middlewares/errorMiddleware.js';
import { ApiError } from '../utils/ApiError.js';
import { fixture } from './helpers.js';
import { createJwt } from '../config/jwt.js';

function catalogFixture() {
    // Repository e autenticação simulados só nesta fixture; suíte access cobre JWT/2FA reais.
    let films = [], genres = [], links = [], events = [], id = 0;
    const model = {
        async film(key, admin) { return films.find(r => r.id_filme === key && (admin || r.status === 'ATIVO')); },
        async genre(key, admin) { return genres.find(r => r.id_genero === key && (admin || r.status === 'ATIVO')); },
        async listFilms(q, admin) { return films.filter(r => (admin || r.status === 'ATIVO') && BigInt(r.id_filme) > BigInt(q.cursor ?? '0')).slice(0, (q.limit ?? 20) + 1); },
        async listGenres(q, admin, filmId) { return genres.filter(g => (admin || g.status === 'ATIVO') && (!filmId || links.some(l => l[0] === filmId && l[1] === g.id_genero))); },
        async createFilm(c, input) { const key = String(++id); films.push({ id_filme: key, ...input }); return key; },
        async createGenre(c, input) { const key = String(++id); genres.push({ id_genero: key, ...input }); return key; },
        async patchFilm(c, key, input) { Object.assign(await model.film(key, true), input); },
        async patchGenre(c, key, input) { Object.assign(await model.genre(key, true), input); },
        async link(c, f, g) { if (!links.some(l => l[0] === f && l[1] === g)) links.push([f, g]); },
        async unlink(c, f, g) { links = links.filter(l => l[0] !== f || l[1] !== g); }
    };
    const identity = {
        async transaction(fn) { const snapshot = structuredClone({ films, genres, links, events }); try { return await fn({}); } catch (e) { ({ films, genres, links, events } = snapshot); throw e; } },
        async activeActor(c, ctx) { if (ctx.actor.tipo === 'REVOKED') throw ApiError.naoAutorizado(); return { tipo_usuario: ctx.actor.tipo }; },
        async audit(c, type, id) { events.push({ type, id }); }
    };
    const service = createCatalogService({ model, identity, mediaHosts: ['media.example.invalid'] });
    const app = express(); app.use(express.json()); app.use((req, res, next) => { res.locals.requestId = '00000000-0000-4000-8000-000000000001'; next(); });
    app.use(catalogRoutes(createCatalogController(service), { auth(req, res, next) { if (!req.headers['x-fixture-role']) throw ApiError.naoAutorizado(); req.usuario = { id: '1', tipo: req.headers['x-fixture-role'] }; next(); } })); app.use(errorMiddleware);
    return { app, model, identity, service, get films() { return films; }, get links() { return links; }, get events() { return events; } };
}
const film = { titulo: 'Filme Teste', duracao: 100, classificacao: '12', disponivel_streaming: true, preco_aluguel: '12.50', dias_acesso_aluguel: 3 };

test('catálogo: tipos, dinheiro exato, datas, flags, mass assignment e PATCH sem defaults', () => {
    for (const patch of [{ preco_aluguel: 12.5 }, { preco_compra: '-1.00' }, { duracao: 0 }, { classificacao: '21' }, { disponivel_cinema: 'true' }, { data_lancamento: '2026-02-30' }, { id_filme: '1' }, { trailer: 'http://media.example.invalid/a' }]) assert.equal(catalogSchemas.film.safeParse({ ...film, ...patch }).success, false);
    assert.deepEqual(catalogSchemas.filmPatch.parse({ titulo: 'Novo' }), { titulo: 'Novo' });
    assert.equal(catalogSchemas.filmPatch.safeParse({}).success, false);
    assert.equal(catalogSchemas.film.safeParse({ ...film, trailer: 'invalid URL' }).success, false);
    assert.equal(catalogSchemas.film.safeParse({ ...film, data_lancamento: '0001-01-01' }).success, false);
    assert.deepEqual(catalogSchemas.query.parse({ cinema: 'false', limit: '10' }), { cinema: false, limit: 10 });
    assert.equal(catalogSchemas.query.safeParse({ status: 'INATIVO' }).success, false);
});
test('CRUD HTTP ADMIN, público só ativos e sem URL privada, arquivamento preserva vínculos', async () => {
    const f = catalogFixture();
    await request(f.app).post('/api/films').send(film).expect(401);
    await request(f.app).post('/api/films').set('X-Fixture-Role', 'CLIENTE').send(film).expect(403);
    const created = await request(f.app).post('/api/films').set('X-Fixture-Role', 'ADMIN').send({ ...film, url_reproducao: 'https://media.example.invalid/private' }).expect(201);
    const id = created.body.data.id_filme;
    assert.equal(created.headers.location, `/api/admin/films/${id}`);
    assert.equal(created.body.data.preco_aluguel, '12.50');
    const g = await request(f.app).post('/api/genres').set('X-Fixture-Role', 'ADMIN').send({ nome: 'Aventura' }).expect(201);
    const genreId = g.body.data.id_genero;
    for (let i = 0; i < 2; i++) await request(f.app).post(`/api/films/${id}/genres`).set('X-Fixture-Role', 'ADMIN').send({ genreId }).expect(200);
    assert.equal(f.links.length, 1);
    for (const path of ['/api/films', `/api/films/${id}`, `/api/films/${id}/genres`]) { const result = await request(f.app).get(path).expect(200); assert.ok(!/url_reproducao|\/private/.test(result.text)); }
    await request(f.app).patch(`/api/films/${id}`).set('X-Fixture-Role', 'ADMIN').send({ titulo: 'Atualizado' }).expect(200);
    assert.equal(f.films[0].classificacao, '12'); assert.equal(f.films[0].disponivel_streaming, true);
    await request(f.app).delete(`/api/genres/${genreId}`).set('X-Fixture-Role', 'ADMIN').expect(204);
    assert.equal(f.links.length, 1);
    await request(f.app).get(`/api/genres/${genreId}`).expect(404);
    await request(f.app).post(`/api/films/${id}/genres`).set('X-Fixture-Role', 'ADMIN').send({ genreId }).expect(409);
    await request(f.app).delete(`/api/films/${id}`).set('X-Fixture-Role', 'ADMIN').expect(204);
    assert.equal(f.films.length, 1); assert.equal(f.links.length, 1);
    await request(f.app).get(`/api/films/${id}`).expect(404);
    await request(f.app).get(`/api/admin/films/${id}`).set('X-Fixture-Role', 'ADMIN').expect(200);
});
test('regras cruzadas, hosts, recurso ausente, paginação e revogação no service', async () => {
    const f = catalogFixture();
    await request(f.app).post('/api/films').set('X-Fixture-Role', 'ADMIN').send({ ...film, preco_aluguel: null }).expect(422);
    await request(f.app).post('/api/films').set('X-Fixture-Role', 'ADMIN').send({ ...film, trailer: 'https://evil.invalid/video' }).expect(422);
    await request(f.app).patch('/api/films/999').set('X-Fixture-Role', 'ADMIN').send({ titulo: 'X' }).expect(404);
    for (let i = 0; i < 2; i++) await request(f.app).post('/api/films').set('X-Fixture-Role', 'ADMIN').send(film).expect(201);
    const page = await request(f.app).get('/api/films?limit=1').expect(200); assert.equal(page.body.data.items.length, 1); assert.ok(page.body.data.pagination.nextCursor);
    for (const suffix of ['limit=101', 'limit=1%20OR%201=1', 'status=INATIVO', 'sort=DROP']) await request(f.app).get(`/api/films?${suffix}`).expect(422);
    await assert.rejects(f.service.saveFilm('1', { titulo: 'Não salvar' }, { actor: { tipo: 'REVOKED' } }), { statusCode: 401 });
    assert.equal(f.films[0].titulo, film.titulo);
    const before = f.events.length;
    const patch = f.model.patchFilm;
    f.model.patchFilm = async (...args) => { await patch(...args); throw new Error('fixture rollback'); };
    await assert.rejects(f.service.saveFilm('1', { titulo: 'Rollback' }, { actor: { tipo: 'ADMIN' } }));
    assert.equal(f.films[0].titulo, film.titulo); assert.equal(f.events.length, before);
});
test('SQL/projeção não expõem mídia privada; filtros parametrizados e uma query por lista', async () => {
    const calls = []; const db = { async execute(sql, params) { calls.push({ sql, params }); return [[]]; } }; const m = createCatalogModel(db);
    await m.listFilms({ limit: 10, titulo: "%' OR 1=1 --", genreId: '1', cinema: false });
    assert.equal(calls.length, 1); assert.ok(!calls[0].sql.includes('url_reproducao')); assert.ok(!calls[0].sql.includes('OR 1=1')); assert.ok(calls[0].params.includes(false));
    await m.film('1', true); assert.ok(calls[1].sql.includes('url_reproducao'));
    assert.throws(() => m.listFilms({ limit: '1;DROP' }));
    assert.ok(!Object.hasOwn(filmDto({ id_filme: '1', ...film, url_reproducao: 'private', segredo: 'extra' }), 'url_reproducao'));
    await assert.rejects(m.patchFilm(db, '1', { id_usuario: '2' }));
});
test('rotas montadas no app real aplicam JWT/ADMIN/2FA antes do SQL de catálogo', async t => {
    const f = fixture(); t.after(async () => { await f.app.locals.close(); await f.logQueue.close(); });
    await request(f.app).post('/api/films').send(film).expect(401);
    const token = createJwt(f.config.jwt).signAccess({ userId: '1', sessionId: '1' });
    await request(f.app).post('/api/films').set('Authorization', `Bearer ${token}`).send(film).expect(403);
});
