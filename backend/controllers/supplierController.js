import { success } from '../utils/dto.js';
const context = req => ({ actor: req.usuario, signal: req.signal, requestId: req.res.locals.requestId });
export function createSupplierController(service) {
    return {
        list: async (req, res) => success(res, await service.list(req.supplierQuery, context(req))),
        get: async (req, res) => success(res, await service.get(req.params.id, context(req))),
        me: async (req, res) => success(res, await service.me(context(req))),
        create: async (req, res) => { const data = await service.create(req.input, context(req)); res.location(`/api/admin/suppliers/${data.id_fornecedor}`); success(res, data, 201); },
        patch: async (req, res) => success(res, await service.patch(req.params.id, req.input, context(req))),
        archive: async (req, res) => { await service.archive(req.params.id, context(req)); res.sendStatus(204); }
    };
}
