import { ApiError } from '../utils/ApiError.js';
import { ROLES } from '../services/accessService.js';
import { idString } from '../utils/dto.js';

export function createAuthMiddleware(tokens, accessService) {
    return async (req, res, next) => {
        const header = req.headers.authorization;
        if (typeof header !== 'string' || header.length > 4096 || !/^Bearer [A-Za-z0-9_.-]+$/.test(header)) throw ApiError.naoAutorizado();
        let claims;
        try { claims = tokens.verify(header.slice(7)); }
        catch { throw ApiError.naoAutorizado(); }
        try { req.usuario = await accessService.resolve(claims, { signal: req.signal }); }
        catch (error) { throw error instanceof ApiError ? error : ApiError.indisponivel(); }
        next();
    };
}
export function allowRoles(...roles) {
    if (!roles.length || roles.some(r => !ROLES.includes(r))) throw new TypeError('Perfil inválido');
    return (req, res, next) => {
        if (!req.usuario) throw ApiError.naoAutorizado();
        if (!roles.includes(req.usuario.tipo)) throw ApiError.acessoNegado();
        next();
    };
}
export const adminMiddleware = allowRoles('ADMIN');
export function requireOwner(ownerResolver) {
    return async (req, res, next) => {
        if (!req.usuario) throw ApiError.naoAutorizado();
        const owner = await ownerResolver(req);
        if (owner == null || idString(owner) !== req.usuario.id) throw ApiError.acessoNegado();
        next();
    };
}
export function requireOperationalScope(check) {
    return async (req, res, next) => {
        if (!req.usuario) throw ApiError.naoAutorizado();
        // Service consulta vínculo ativo e relações aninhadas; ausência de provider não autoriza.
        if (!check) throw ApiError.indisponivel();
        if (await check(req.usuario, req) !== true) throw ApiError.acessoNegado();
        next();
    };
}
