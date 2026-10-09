import { Router } from 'express';
import { allowRoles } from '../middlewares/authMiddleware.js';

export const imageUploadOperations = [
    { method: 'post', path: '/api/admin/uploads/images', operationId: 'upload_image' },
    { method: 'get', path: '/api/admin/uploads/images/{key}', operationId: 'preview_image' },
    { method: 'delete', path: '/api/admin/uploads/images/{key}', operationId: 'delete_staged_image' },
    { method: 'post', path: '/api/uploads/images', operationId: 'supplier_upload_image' },
    { method: 'get', path: '/api/uploads/images/{key}', operationId: 'supplier_preview_image' },
    { method: 'delete', path: '/api/uploads/images/{key}', operationId: 'supplier_delete_staged_image' }
];
export function imageUploadRoutes(controller, { auth, limits }) {
    const router = Router();
    const access = [auth, allowRoles('ADMIN'), (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); }];
    router.post('/api/admin/uploads/images', ...access, ...limits.upload, controller.upload);
    router.get('/api/admin/uploads/images/:key', ...access, controller.preview);
    router.delete('/api/admin/uploads/images/:key', ...access, ...limits.upload, controller.remove);
    const supplier = [auth, allowRoles('FORNECEDOR'), (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); }];
    router.post('/api/uploads/images', ...supplier, ...limits.upload, controller.upload);
    router.get('/api/uploads/images/:key', ...supplier, controller.preview);
    router.delete('/api/uploads/images/:key', ...supplier, ...limits.upload, controller.remove);
    return router;
}
