import { success } from '../utils/dto.js';
const context = req => ({ actor: req.usuario, signal: req.signal, requestId: req.res.locals.requestId });
export function createTaskController(service) {
    return {
        list: async (req, res) => success(res, await service.list(req.params.id, req.taskQuery, context(req))),
        get: async (req, res) => success(res, await service.get(req.params.id, req.params.taskId, context(req))),
        create: async (req, res) => { const data = await service.create(req.params.id, req.input, context(req)); res.location(`/api/teams/${req.params.id}/chamados/${data.id_chamado}`); success(res, data, 201); },
        edit: async (req, res) => success(res, await service.edit(req.params.id, req.params.taskId, req.input, context(req))),
        assign: async (req, res) => success(res, await service.assign(req.params.id, req.params.taskId, req.input, context(req))),
        accept: async (req, res) => success(res, await service.accept(req.params.id, req.params.taskId, context(req))),
        resolve: async (req, res) => success(res, await service.resolve(req.params.id, req.params.taskId, context(req))),
        close: async (req, res) => success(res, await service.close(req.params.id, req.params.taskId, context(req))),
        cancel: async (req, res) => { await service.cancel(req.params.id, req.params.taskId, context(req)); res.sendStatus(204); },
        history: async (req, res) => success(res, await service.history(req.params.id, req.params.taskId, req.taskQuery, context(req)))
    };
}
