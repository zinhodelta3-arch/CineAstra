import { success } from '../utils/dto.js';
const context = req => ({ actor: req.usuario, signal: req.signal, requestId: req.res.locals.requestId });
export function createProductController(service) {
    return {
        list: async (req, res, type) => success(res, await service.list(type, req.productQuery, context(req))),
        get: async (req, res, type) => success(res, await service.get(type, req.params.id, context(req))),
        create: async (req, res, type) => { const data = await service.create(type, req.input, context(req)); res.location(`/api/${type}/${data[type === 'inputs' ? 'id_insumo' : 'id_equipamento']}`); success(res, data, 201); },
        patch: async (req, res, type) => success(res, await service.patch(type, req.params.id, req.input, context(req))),
        archive: async (req, res, type) => { await service.archive(type, req.params.id, context(req)); res.sendStatus(204); },
        grants: async (req, res) => success(res, await service.grants(req.params.supplierId, req.productQuery, context(req))),
        myGrants: async (req, res) => success(res, await service.myGrants(req.productQuery, context(req))),
        grant: async (req, res) => { const data = await service.grant(req.params.supplierId, req.input.localId, context(req)); res.location(`/api/admin/suppliers/${req.params.supplierId}/locations/${data.id_local}`); success(res, data, 201); },
        revokeGrant: async (req, res) => { await service.revokeGrant(req.params.supplierId, req.params.localId, context(req)); res.sendStatus(204); }
    };
}
