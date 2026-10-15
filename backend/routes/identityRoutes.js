import { Router } from 'express';
import { schemas, validateBody, validateId } from '../validators/identityValidators.js';
import { allowRoles } from '../middlewares/authMiddleware.js';
import { requireCaptcha } from '../providers/captchaProvider.js';

// Registro único consumido pelo roteador e pela validação OpenAPI.
export const identityOperations = [
    ['post', '/api/auth/register', 'register', 'register', 'public', 'register', true, 201],
    ['post', '/api/auth/registrar', 'registerAlias', 'register', 'public', 'register', true, 201, 'register'],
    ['post', '/api/auth/login', 'login', 'login', 'public', 'login', true],
    ['post', '/api/auth/logout', 'logout', null, 'private', 'login', false, 204],
    ['post', '/api/auth/password/forgot', 'forgot', 'forgot', 'public', 'recovery', true],
    ['post', '/api/auth/password/reset', 'reset', 'reset', 'public', 'recovery', true, 204],
    ['post', '/api/auth/2fa/enroll', 'enroll', 'enroll', 'enrollment', 'twoFactor'],
    ['post', '/api/auth/2fa/verify', 'verify', 'verify', 'public', 'twoFactor'],
    ['post', '/api/auth/2fa/disable', 'disableFactor', 'factorDisable', 'private', 'twoFactor', false, 204],
    ['get', '/api/users/me', 'me', null, 'private'],
    ['post', '/api/users/me/age-verification', 'renewAge', 'ageVerification', 'private', 'register'],
    ['patch', '/api/users/me', 'patch', 'profile', 'private', 'twoFactor'],
    ['delete', '/api/users/me', 'deleteAccount', 'reauthenticate', 'private', 'twoFactor', false, 202],
    ['post', '/api/users/me/export', 'export', 'reauthenticate', 'private', 'twoFactor'],
    ['get', '/api/users/me/preferences', 'getPreferences', null, 'private', null, false, 200, 'preferences'],
    ['patch', '/api/users/me/preferences', 'patchPreferences', 'preferences', 'private', null, false, 200, 'preferences'],
    ['post', '/api/admin/users', 'adminCreate', 'adminUser', 'admin', 'register', false, 201],
    ['get', '/api/admin/users/{id}', 'adminGet', null, 'admin'],
    ['patch', '/api/admin/users/{id}/access', 'adminAccess', 'accessChange', 'admin', 'twoFactor'],
    ['get', '/api/admin/privacy-requests/{id}', 'privacyStatus', null, 'admin'],
    ['get', '/api/users/me/children/{id}/controls', 'getParental', null, 'private', null, false, 200, 'parental'],
    ['patch', '/api/users/me/children/{id}/controls', 'patchParental', 'parental', 'private', 'twoFactor', false, 200, 'parental'],
    ['post', '/api/users/me/children/{id}/authorizations', 'authorizeMinor', 'authorizeMinor', 'private', 'twoFactor', false, 201],
    ['get', '/api/users/me/children/{id}/authorizations/{authorizationId}', 'authorization', null, 'private'],
    ...['addresses', 'contacts'].flatMap(kind => [
        ['get', `/api/users/me/${kind}`, `list_${kind}`, null, 'private', null, false, 200, ['list', kind]],
        ['post', `/api/users/me/${kind}`, `add_${kind}`, kind === 'addresses' ? 'address' : 'contact', 'private', null, false, 201, ['add', kind]],
        ['get', `/api/users/me/${kind}/{id}`, `get_${kind}`, null, 'private', null, false, 200, ['resource', kind]],
        ['patch', `/api/users/me/${kind}/{id}`, `patch_${kind}`, kind === 'addresses' ? 'addressPatch' : 'contactPatch', 'private', null, false, 200, ['update', kind]],
        ['delete', `/api/users/me/${kind}/{id}`, `delete_${kind}`, null, 'private', null, false, 204, ['remove', kind]]
    ])
].map(([method, path, operationId, schema, access, flow, captcha, status = 200, action = operationId]) => ({ method, path, operationId, schema, access, flow, captcha, status, action }));

export function identityRoutes(controller, { auth, limits, captcha }) {
    const router = Router();
    router.use((req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
    for (const r of identityOperations) {
        const middleware = [];
        if (r.access === 'private' || r.access === 'admin') middleware.push(auth);
        if (r.access === 'admin') middleware.push(allowRoles('ADMIN'));
        if (r.flow) middleware.push(...limits[r.flow]);
        if (r.path.includes('{id}')) middleware.push(validateId);
        if (r.schema) middleware.push(validateBody(schemas[r.schema]));
        if (r.access === 'enrollment') middleware.push((req, res, next) => req.input.password ? auth(req, res, next) : next());
        if (r.captcha) middleware.push(requireCaptcha(captcha));
        const handler = Array.isArray(r.action) ? controller[r.action[0]](r.action[1]) : controller[r.action];
        router[r.method](r.path.replace(/\{(\w+)\}/g, ':$1'), ...middleware, handler);
    }
    return router;
}
