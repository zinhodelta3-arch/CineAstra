import { success } from '../utils/dto.js';
const context = req => ({ actor: req.usuario, signal: req.signal, requestId: req.res.locals.requestId });
export function createNotificationController(service) {
    return {
        list: async (req, res) => success(res, await service.list(req.notificationQuery, context(req))),
        read: async (req, res) => success(res, await service.markRead(req.params.id, context(req)))
    };
}
