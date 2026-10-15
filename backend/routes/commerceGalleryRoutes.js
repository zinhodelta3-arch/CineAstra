import { Router } from 'express';
import { allowRoles } from '../middlewares/authMiddleware.js';
import { validateBody } from '../validators/identityValidators.js';
import { commerceGalleryParams, commerceGallerySchemas } from '../validators/commerceGalleryValidators.js';
import { IMAGE_KEY } from '../models/imageStorage.js';
import { ApiError } from '../utils/ApiError.js';

export const commerceGalleryOperations = ['inputs','combos'].flatMap(type => {
    const base = `/api/${type}/{id}/images`, admin = `/api/admin/${type}/{id}/images`, prefix = type === 'inputs' ? 'input' : 'combo';
    return [
        { method: 'get', path: base, operationId: `list_${prefix}_images`, action: 'list', type },
        { method: 'get', path: admin, operationId: `admin_list_${prefix}_images`, action: 'adminList', type },
        { method: 'post', path: type === 'inputs' ? base : admin, operationId: `create_${prefix}_image`, action: 'create', type },
        { method: 'patch', path: `${type === 'inputs' ? base : admin}/{imageId}`, operationId: `update_${prefix}_image`, action: 'patch', type },
        { method: 'delete', path: `${type === 'inputs' ? base : admin}/{imageId}`, operationId: `delete_${prefix}_image`, action: 'remove', type },
        { method: 'post', path: `${type === 'inputs' ? base : admin}/reconcile`, operationId: `reconcile_${prefix}_images`, action: 'reconcile', type },
        { method: 'get', path: `/api/${prefix}-images/{key}`, operationId: `get_${prefix}_image_content`, action: 'content', type }
    ];
});
export function commerceGalleryRoutes(controller, { auth, limits }) {
    const router = Router();
    const query = (req,res,next) => { const parsed = commerceGallerySchemas.query.safeParse(req.query); if (!parsed.success) throw ApiError.validacao('Consulta inválida'); req.galleryQuery = parsed.data; next(); };
    for (const r of commerceGalleryOperations) {
        const middleware = [(req,res,next) => { res.set('Cache-Control', 'no-store'); next(); }];
        if (!['list','content'].includes(r.action)) middleware.push(auth, allowRoles(...(r.type === 'combos' || r.action === 'adminList' ? ['ADMIN'] : ['ADMIN','FORNECEDOR'])));
        if (r.action === 'create') middleware.push(...limits.upload);
        if (r.path.includes('{id}')) middleware.push(commerceGalleryParams);
        if (r.action === 'list' || r.action === 'adminList') middleware.push(query);
        if (r.action === 'create' || r.action === 'patch') middleware.push(validateBody(commerceGallerySchemas[r.action]));
        if (r.action === 'content') middleware.push((req,res,next) => { if (!IMAGE_KEY.test(req.params.key)) throw ApiError.naoEncontrado(); next(); });
        const route = r.path.replace(/\{(\w+)\}/g, ':$1');
        const handler = r.action === 'list' || r.action === 'adminList' ? controller.list(r.type, r.action === 'adminList') : controller[r.action](r.type);
        router[r.method](route, ...middleware, handler);
    }
    return router;
}
