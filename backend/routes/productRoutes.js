import { Router } from 'express';
import { allowRoles } from '../middlewares/authMiddleware.js';
import { validateBody } from '../validators/identityValidators.js';
import { productParams, productQuery, productSchemas } from '../validators/productValidators.js';

const productOps = ['inputs','equipment'].flatMap(type => [
    { method: 'get', path: `/api/${type}`, operationId: `list_${type}`, action: 'list', type },
    { method: 'post', path: `/api/${type}`, operationId: `create_${type}`, action: 'create', type },
    { method: 'get', path: `/api/${type}/{id}`, operationId: `get_${type}`, action: 'get', type },
    { method: 'patch', path: `/api/${type}/{id}`, operationId: `update_${type}`, action: 'patch', type },
    { method: 'delete', path: `/api/${type}/{id}`, operationId: `archive_${type}`, action: 'archive', type }
]);
export const productOperations = [
    ...productOps,
    { method: 'get', path: '/api/admin/suppliers/{supplierId}/locations', operationId: 'list_supplier_locations', action: 'grants', admin: true },
    { method: 'post', path: '/api/admin/suppliers/{supplierId}/locations', operationId: 'grant_supplier_location', action: 'grant', admin: true },
    { method: 'delete', path: '/api/admin/suppliers/{supplierId}/locations/{localId}', operationId: 'revoke_supplier_location', action: 'revokeGrant', admin: true },
    { method: 'get', path: '/api/suppliers/me/locations', operationId: 'my_supplier_locations', action: 'myGrants', admin: false }
];
export function productRoutes(controller, { auth }) {
    const router = Router();
    for (const r of productOperations) {
        const middleware = [(req, res, next) => { res.set('Cache-Control', 'no-store'); next(); }, auth, r.admin ? allowRoles('ADMIN') : allowRoles('ADMIN','FORNECEDOR')];
        if (r.path.includes('{')) middleware.push(productParams);
        if (['list','grants','myGrants'].includes(r.action)) middleware.push(productQuery(r.type ? productSchemas[r.type].query : productSchemas.grantQuery));
        if (['create','patch','grant'].includes(r.action)) middleware.push(validateBody(r.type ? productSchemas[r.type][r.action] : productSchemas.grant));
        router[r.method](r.path.replace(/\{(\w+)\}/g, ':$1'), ...middleware, (req, res) => controller[r.action](req, res, r.type));
    }
    return router;
}
