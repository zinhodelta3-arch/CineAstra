import { Router } from 'express';
import { allowRoles } from '../middlewares/authMiddleware.js';

export const imageUploadOperations = [
    { method: 'post', path: '/api/admin/uploads/images', operationId: 'upload_image' },
    { method: 'get', path: '/api/admin/uploads/images/{key}', operationId: 'preview_image' },
    { method: 'delete', path: '/api/admin/uploads/images/{key}', operationId: 'delete_staged_image' }
];
export function imageUploadRoutes(controller, { auth, limits }) {
    const router = Router();
    const access = [auth, allowRoles('ADMIN'), (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); }];
    router.post('/api/admin/uploads/images', ...access, ...limits.upload, controller.upload);
    router.get('/api/admin/uploads/images/:key', ...access, controller.preview);
    router.delete('/api/admin/uploads/images/:key', ...access, ...limits.upload, controller.remove);
    return router;
}
