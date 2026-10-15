import { Router } from 'express';
import { allowRoles } from '../middlewares/authMiddleware.js';
import { validateBody } from '../validators/identityValidators.js';
import { comboParams, comboQuery, comboSchemas } from '../validators/comboValidators.js';

export const comboOperations = [
    { method: 'get', path: '/api/combos', operationId: 'list_combos', action: 'list' },
    { method: 'get', path: '/api/combos/{id}', operationId: 'get_combo', action: 'get' },
    { method: 'get', path: '/api/admin/combos/{id}', operationId: 'get_admin_combo', action: 'adminGet', admin: true },
    { method: 'post', path: '/api/admin/combos', operationId: 'create_combo', action: 'create', admin: true },
    { method: 'patch', path: '/api/admin/combos/{id}', operationId: 'update_combo', action: 'patch', admin: true },
    { method: 'put', path: '/api/admin/combos/{id}/items', operationId: 'replace_combo_items', action: 'replace', admin: true },
    { method: 'delete', path: '/api/admin/combos/{id}', operationId: 'archive_combo', action: 'archive', admin: true }
];
export function comboRoutes(controller, { auth }) {
    const router = Router();
    for (const r of comboOperations) {
        const middleware = [(req, res, next) => { res.set('Cache-Control', 'no-store'); next(); }];
        if (r.admin) middleware.push(auth, allowRoles('ADMIN'));
        if (r.path.includes('{id}')) middleware.push(comboParams);
        if (r.action === 'list') middleware.push(comboQuery);
        if (['create','patch','replace'].includes(r.action)) middleware.push(validateBody(comboSchemas[r.action === 'replace' ? 'composition' : r.action]));
        router[r.method](r.path.replace('{id}', ':id'), ...middleware, controller[r.action]);
    }
    return router;
}
