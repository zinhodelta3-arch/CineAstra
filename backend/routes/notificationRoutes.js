import { Router } from 'express';
import { notificationParams, notificationQuery } from '../validators/notificationValidators.js';

export const notificationOperations = [
    { method: 'get', path: '/api/notifications/me', operationId: 'list_my_notifications', action: 'list' },
    { method: 'patch', path: '/api/notifications/me/{id}/read', operationId: 'read_my_notification', action: 'read' }
];
export function notificationRoutes(controller, { auth }) {
    const router = Router();
    for (const r of notificationOperations) {
        const middleware = [(req, res, next) => { res.set('Cache-Control', 'no-store'); next(); }, auth];
        if (r.action === 'list') middleware.push(notificationQuery);
        else middleware.push(notificationParams);
        router[r.method](r.path.replace(/\{(\w+)\}/g, ':$1'), ...middleware, controller[r.action]);
    }
    return router;
}
