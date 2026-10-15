import { Router } from 'express';
import { allowRoles } from '../middlewares/authMiddleware.js';
import { validateBody } from '../validators/identityValidators.js';
import { inventoryParams, inventoryQuery, inventorySchemas } from '../validators/inventoryValidators.js';

export const inventoryOperations = [
    { method: 'get', path: '/api/inventory/inputs/{id}', operationId: 'get_input_balance', action: 'balance', kind: 'inputs' },
    { method: 'get', path: '/api/inventory/equipment/{id}', operationId: 'get_equipment_balance', action: 'balance', kind: 'equipment' },
    { method: 'get', path: '/api/inventory/movements', operationId: 'list_inventory_movements', action: 'list' },
    { method: 'post', path: '/api/inventory/movements', operationId: 'create_inventory_movement', action: 'move' },
    { method: 'get', path: '/api/inventory/alerts', operationId: 'list_inventory_alerts', action: 'alerts' }
];
export function inventoryRoutes(controller,{ auth }) {
    const router = Router();
    for (const r of inventoryOperations) {
        const middleware = [(req,res,next) => { res.set('Cache-Control','no-store'); next(); },auth,allowRoles('ADMIN','FORNECEDOR')];
        if (r.path.includes('{id}')) middleware.push(inventoryParams);
        if (r.action === 'list' || r.action === 'alerts') middleware.push(inventoryQuery(r.action === 'list' ? inventorySchemas.movementsQuery : inventorySchemas.alertsQuery));
        if (r.action === 'move') middleware.push(validateBody(inventorySchemas.movement));
        router[r.method](r.path.replace('{id}',':id'),...middleware,r.action === 'balance' ? controller.balance(r.kind) : controller[r.action]);
    }
    return router;
}
