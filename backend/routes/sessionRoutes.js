import { Router } from 'express';
import { allowRoles } from '../middlewares/authMiddleware.js';
import { validateBody } from '../validators/identityValidators.js';
import { sessionSchemas, sessionQuery, sessionParams } from '../validators/sessionValidators.js';

export const sessionOperations = [
    { method: 'get', path: '/api/sessions', operationId: 'list_sessions', action: 'list', admin: false },
    { method: 'get', path: '/api/sessions/{id}', operationId: 'get_session', action: 'get', admin: false },
    { method: 'get', path: '/api/admin/sessions', operationId: 'admin_list_sessions', action: 'list', admin: true },
    { method: 'get', path: '/api/admin/sessions/{id}', operationId: 'admin_get_session', action: 'get', admin: true },
    { method: 'post', path: '/api/admin/sessions', operationId: 'create_session', action: 'create', admin: true },
    { method: 'patch', path: '/api/admin/sessions/{id}', operationId: 'update_session', action: 'patch', admin: true },
    { method: 'delete', path: '/api/admin/sessions/{id}', operationId: 'cancel_session', action: 'cancel', admin: true }
];
export function sessionRoutes(controller, { auth }) {
    const router = Router();
    for (const r of sessionOperations) {
        const middleware = [(req, res, next) => { res.set('Cache-Control', 'no-store'); next(); }];
        if (r.admin) middleware.push(auth, allowRoles('ADMIN'));
        middleware.push(sessionParams);
        if (r.action === 'list') middleware.push(sessionQuery(sessionSchemas[r.admin ? 'adminQuery' : 'query']));
        if (r.action === 'create' || r.action === 'patch') middleware.push(validateBody(sessionSchemas[r.action]));
        const handler = r.action === 'list' ? controller.list(r.admin) : r.action === 'get' ? controller.get(r.admin) : controller[r.action];
        router[r.method](r.path.replace(/\{(\w+)\}/g, ':$1'), ...middleware, handler);
    }
    return router;
}
