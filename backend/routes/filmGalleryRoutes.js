import { Router } from 'express';
import { allowRoles } from '../middlewares/authMiddleware.js';
import { validateBody } from '../validators/identityValidators.js';
import { gallerySchemas, galleryParams } from '../validators/filmGalleryValidators.js';
import { IMAGE_KEY } from '../models/imageStorage.js';
import { ApiError } from '../utils/ApiError.js';

export const filmGalleryOperations = [
    { method: 'get', path: '/api/films/{id}/images', operationId: 'list_film_images' },
    { method: 'get', path: '/api/admin/films/{id}/images', operationId: 'admin_list_film_images' },
    { method: 'post', path: '/api/admin/films/{id}/images', operationId: 'create_film_image' },
    { method: 'patch', path: '/api/admin/films/{id}/images/{imageId}', operationId: 'update_film_image' },
    { method: 'delete', path: '/api/admin/films/{id}/images/{imageId}', operationId: 'delete_film_image' },
    { method: 'post', path: '/api/admin/films/{id}/images/reconcile', operationId: 'reconcile_film_images' },
    { method: 'get', path: '/api/film-images/{key}', operationId: 'get_film_image_content' }
];
export function filmGalleryRoutes(controller, { auth, limits }) {
    const router = Router();
    const noStore = (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); };
    const admin = [auth, allowRoles('ADMIN')];
    const query = (req, res, next) => {
        const parsed = gallerySchemas.query.safeParse(req.query);
        if (!parsed.success) throw ApiError.validacao('Consulta inválida');
        req.galleryQuery = parsed.data; next();
    };
    router.get('/api/films/:id/images', noStore, galleryParams, query, controller.list(false));
    router.get('/api/admin/films/:id/images', noStore, ...admin, galleryParams, query, controller.list(true));
    router.post('/api/admin/films/:id/images', noStore, ...admin, ...limits.upload, galleryParams, validateBody(gallerySchemas.create), controller.create);
    router.patch('/api/admin/films/:id/images/:imageId', noStore, ...admin, galleryParams, validateBody(gallerySchemas.patch), controller.patch);
    router.delete('/api/admin/films/:id/images/:imageId', noStore, ...admin, galleryParams, controller.remove);
    router.post('/api/admin/films/:id/images/reconcile', noStore, ...admin, galleryParams, controller.reconcile);
    router.get('/api/film-images/:key', noStore, (req, res, next) => { if (!IMAGE_KEY.test(req.params.key)) throw ApiError.naoEncontrado(); next(); }, controller.content);
    return router;
}
