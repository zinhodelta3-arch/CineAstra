import { Router } from 'express';
import { allowRoles } from '../middlewares/authMiddleware.js';
import { validateBody } from '../validators/identityValidators.js';
import { catalogSchemas, catalogQuery, catalogParams } from '../validators/catalogValidators.js';

export const catalogOperations = [
    ...['films', 'genres'].flatMap(kind => [
        ['get', `/api/${kind}`, `list_${kind}`, false, null, kind === 'films' ? 'query' : 'genreQuery', ['list', kind]],
        ['get', `/api/${kind}/{id}`, `get_${kind}`, false, null, null, ['get', kind]],
        ['get', `/api/admin/${kind}`, `admin_list_${kind}`, true, null, kind === 'films' ? 'adminQuery' : 'adminGenreQuery', ['list', kind]],
        ['get', `/api/admin/${kind}/{id}`, `admin_get_${kind}`, true, null, null, ['get', kind]],
        ['post', `/api/${kind}`, `create_${kind}`, true, kind === 'films' ? 'film' : 'genre', null, ['save', kind], 201],
        ['patch', `/api/${kind}/{id}`, `update_${kind}`, true, kind === 'films' ? 'filmPatch' : 'genrePatch', null, ['save', kind]],
        ['delete', `/api/${kind}/{id}`, `archive_${kind}`, true, null, null, ['archive', kind], 204]
    ]),
    ['get', '/api/films/{id}/genres', 'film_genres', false, null, 'genreQuery', ['list', 'genres']],
    ['get', '/api/admin/films/{id}/genres', 'admin_film_genres', true, null, 'adminGenreQuery', ['list', 'genres']],
    ['post', '/api/films/{id}/genres', 'link_film_genre', true, 'link', null, ['link']],
    ['delete', '/api/films/{id}/genres/{genreId}', 'unlink_film_genre', true, null, null, ['unlink'], 204]
].map(([method, path, operationId, admin, schema, query, action, status = 200]) => ({ method, path, operationId, admin, schema, query, action, status }));
export function catalogRoutes(controller, { auth }) {
    const router = Router();
    for (const r of catalogOperations) {
        const middlewares = [(req, res, next) => { res.set('Cache-Control', 'no-store'); next(); }];
        if (r.admin) middlewares.push(auth, allowRoles('ADMIN'));
        middlewares.push(catalogParams);
        if (r.schema) middlewares.push(validateBody(catalogSchemas[r.schema]));
        if (r.query) middlewares.push(catalogQuery(catalogSchemas[r.query]));
        const [operation, kind] = r.action;
        const handler = operation === 'list' ? (kind === 'films' ? controller.listFilms : controller.listGenres)(r.admin)
            : operation === 'get' ? (kind === 'films' ? controller.film : controller.genre)(r.admin)
            : operation === 'save' ? (kind === 'films' ? controller.saveFilm : controller.saveGenre)
            : operation === 'archive' ? controller.archive(kind === 'films' ? 'film' : 'genre') : controller.associate(operation === 'unlink');
        router[r.method](r.path.replace(/\{(\w+)\}/g, ':$1'), ...middlewares, handler);
    }
    return router;
}
