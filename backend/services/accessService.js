import { ApiError } from '../utils/ApiError.js';
import { idString } from '../utils/dto.js';

export const ROLES = Object.freeze(['CLIENTE', 'FORNECEDOR', 'SUPERVISOR', 'COLABORADOR', 'ADMIN']);
export function createAccessService(userModel, sessionProvider = { async verifyActive() { throw ApiError.indisponivel(); } }) {
    return {
        async resolve(claims, { signal } = {}) {
            // O provider de identidade resolve persistência/revogação antes do perfil atual.
            const session = await sessionProvider.verifyActive({ userId: claims.sub, sessionId: claims.sid, jti: claims.jti, signal });
            const expiry = session ? new Date(session.expiresAt).getTime() : NaN;
            if (!session || session.userId !== claims.sub || session.revoked || !Number.isFinite(expiry) || expiry <= Date.now()) throw ApiError.naoAutorizado();
            const user = await userModel.findById(claims.sub, { signal });
            if (!user || user.status !== 'ATIVO' || !ROLES.includes(user.tipo_usuario)) throw ApiError.naoAutorizado();
            if (['ADMIN', 'SUPERVISOR'].includes(user.tipo_usuario) && session.twoFactorVerified !== true) throw ApiError.acessoNegado();
            return Object.freeze({ id: idString(user.id_usuario), tipo: user.tipo_usuario, sessionId: claims.sid });
        }
    };
}
