import { success } from '../utils/dto.js';
const context = req => ({ actor: req.usuario, signal: req.signal, requestId: req.res.locals.requestId });
export function createInventoryController(service) {
    return {
        balance: kind => async (req,res) => success(res,await service.balance(kind,req.params.id,context(req))),
        list: async (req,res) => success(res,await service.listMovements(req.inventoryQuery,context(req))),
        alerts: async (req,res) => success(res,await service.alerts(req.inventoryQuery,context(req))),
        move: async (req,res) => success(res,await service.move(req.input,context(req)),201)
    };
}
