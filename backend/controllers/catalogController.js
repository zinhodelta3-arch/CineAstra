import { success } from '../utils/dto.js';
const context = req => ({ actor: req.usuario, signal: req.signal, requestId: req.res.locals.requestId });
export function createCatalogController(service) {
    return {
        listFilms: admin => async (req, res) => success(res, await service.listFilms(req.catalogQuery, admin)),
        film: admin => async (req, res) => success(res, await service.film(req.params.id, admin)),
        listGenres: admin => async (req, res) => success(res, await service.listGenres(req.catalogQuery, admin, req.params.id)),
        genre: admin => async (req, res) => success(res, await service.genre(req.params.id, admin)),
        saveFilm: async (req, res) => { const data = await service.saveFilm(req.params.id, req.input, context(req)); if (!req.params.id) res.location(`/api/admin/films/${data.id_filme}`); success(res, data, req.params.id ? 200 : 201); },
        saveGenre: async (req, res) => { const data = await service.saveGenre(req.params.id, req.input, context(req)); if (!req.params.id) res.location(`/api/admin/genres/${data.id_genero}`); success(res, data, req.params.id ? 200 : 201); },
        archive: kind => async (req, res) => { await service.archive(kind, req.params.id, context(req)); res.sendStatus(204); },
        associate: remove => async (req, res) => { const data = await service.associate(req.params.id, remove ? req.params.genreId : req.input.genreId, remove, context(req)); if (remove) res.sendStatus(204); else success(res, data); }
    };
}
