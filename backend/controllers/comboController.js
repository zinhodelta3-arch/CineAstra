import { success } from '../utils/dto.js';
const context = req => ({ actor: req.usuario, signal: req.signal, requestId: req.res.locals.requestId });
export function createComboController(service) {
    return {
        list: async (req, res) => success(res, await service.list(req.comboQuery)),
        get: async (req, res) => success(res, await service.get(req.params.id)),
        adminGet: async (req, res) => success(res, await service.adminGet(req.params.id, context(req))),
        create: async (req, res) => { const data = await service.create(req.input, context(req)); res.location(`/api/admin/combos/${data.id_combo}`); success(res, data, 201); },
        patch: async (req, res) => success(res, await service.patch(req.params.id, req.input, context(req))),
        replace: async (req, res) => success(res, await service.replace(req.params.id, req.input, context(req))),
        archive: async (req, res) => { await service.archive(req.params.id, context(req)); res.sendStatus(204); }
    };
}
