import { success } from '../utils/dto.js';
const context = req => ({ actor: req.usuario, signal: req.signal, requestId: req.res.locals.requestId });
export function createSessionController(service) {
    return {
        list: admin => async (req, res) => success(res, await service.list(req.sessionQuery, admin)),
        get: admin => async (req, res) => success(res, await service.get(req.params.id, admin)),
        async create(req, res) { const data = await service.create(req.input, context(req)); res.location(`/api/admin/sessions/${data.id_sessao}`); success(res, data, 201); },
        async patch(req, res) { success(res, await service.patch(req.params.id, req.input, context(req))); },
        async cancel(req, res) { await service.cancel(req.params.id, context(req)); res.sendStatus(204); }
    };
}
