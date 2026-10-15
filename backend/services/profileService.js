import { ApiError } from '../utils/ApiError.js';
import { idString, pagination } from '../utils/dto.js';
import { passwordPolicy, hashPassword } from '../utils/identityCrypto.js';
import { resources } from '../models/identityModel.js';
import { schemas } from '../validators/identityValidators.js';
import { userDto, sqlDate, instant } from './identityService.js';

export function createProfileService({ identity, config, providers }) {
    const { model, transaction, audit, activeUser, activeActor, passwordSnapshot, sameCredential, proveFactor } = identity;
    function page(query) {
        try {
            const p = pagination(query);
            if (p.cursor !== null) idString(p.cursor);
            return p;
        } catch { throw ApiError.validacao('Paginação inválida'); }
    }
    const normalize = row => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, (key === 'id' || key.startsWith('id_')) && value !== null ? idString(value) : ['principal', 'alto_contraste', 'modo_acessibilidade', 'compras_permitidas', 'assinaturas_permitidas', 'two_factor_verified', 'ativo', 'utilizado'].includes(key) ? Boolean(value) : value !== null && (key.endsWith('_em') || key === 'expiracao') ? new Date(instant(value)).toISOString() : value]));
    function resultPage(rows, limit, pk) {
        return { items: rows.slice(0, limit).map(normalize), pagination: { limit, nextCursor: rows.length > limit ? idString(rows[limit - 1][pk]) : null } };
    }
    async function reauthenticate(c, context, input, snapshot) {
        const u = await activeActor(c, context); sameCredential(u, snapshot);
        if (!await proveFactor(c, u, input.code)) throw ApiError.naoAutorizado();
        return u;
    }
    return {
        async me(context) { return transaction(async c => userDto(await activeActor(c, context)), context); },
        async patch(input, context) {
            const sensitive = Boolean(input.email || input.password);
            const snapshot = sensitive ? await passwordSnapshot(context.actor.id, input.currentPassword) : null;
            let hash;
            if (input.password) { passwordPolicy(input.password, input.passwordConfirmation); hash = await hashPassword(input.password, config.identity.bcryptCost); }
            if (input.email && await providers.email.verifyAddress({ userId: context.actor.id, email: input.email, proof: input.emailProof, signal: context.signal }) !== true) throw ApiError.validacao('Confirmação de e-mail inválida');
            return transaction(async c => {
                const user = sensitive ? await reauthenticate(c, context, input, snapshot) : await activeActor(c, context);
                const patch = {};
                if (input.name !== undefined) patch.nome = input.name;
                if (input.phone !== undefined) patch.telefone = input.phone;
                if (input.email) patch.email = input.email;
                if (hash) patch.senha = hash;
                await model.updateUser(c, user.id_usuario, patch);
                if (sensitive) { await model.revoke(c, user.id_usuario); await model.invalidateChallenges(c, user.id_usuario); await model.invalidateRecovery(c, user.id_usuario); }
                await audit(c, 'IDENTITY.PROFILE_CHANGED', user.id_usuario, context);
                return userDto(await model.user(user.id_usuario, c));
            }, context);
        },
        async list(kind, query, context) {
            const p = page(query);
            return transaction(async c => { await activeActor(c, context); return resultPage(await model.list(kind, context.actor.id, p.limit, p.cursor, c), p.limit, resources[kind].pk); }, context);
        },
        async resource(kind, id, context) {
            return transaction(async c => { await activeActor(c, context); const row = await model.resource(kind, id, context.actor.id, c); if (!row) throw ApiError.naoEncontrado(); return normalize(row); }, context);
        },
        async mutate(kind, id, input, remove, context) {
            return transaction(async c => {
                // Todas as escritas bloqueiam o usuário pai antes dos filhos/principal.
                await activeActor(c, context);
                const old = id ? await model.resource(kind, id, context.actor.id, c) : null;
                if (id && !old) throw ApiError.naoEncontrado();
                if (remove) await model.deleteResource(c, kind, id, context.actor.id);
                else {
                    if (kind === 'contacts') {
                        const parsed = schemas.contact.safeParse({ tipo: old?.tipo ?? input.tipo, valor: input.valor ?? old?.valor, principal: input.principal ?? Boolean(old?.principal) });
                        if (!parsed.success) throw ApiError.validacao('Contato inválido');
                    }
                    if (input.principal) await model.clearPrincipal(c, kind, context.actor.id, old?.tipo ?? input.tipo);
                    if (id) await model.patchResource(c, kind, id, context.actor.id, input);
                    else id = await model.addResource(c, kind, context.actor.id, input);
                }
                await audit(c, remove ? 'IDENTITY.RESOURCE_REMOVED' : 'IDENTITY.RESOURCE_CHANGED', context.actor.id, context);
                return remove ? undefined : normalize(await model.resource(kind, id, context.actor.id, c));
            }, context);
        },
        async preferences(input, context) {
            return transaction(async c => {
                await activeActor(c, context);
                if (input) { await model.updatePreferences(c, context.actor.id, input); await audit(c, 'IDENTITY.PREFERENCES_CHANGED', context.actor.id, context); }
                return normalize(await model.preferences(context.actor.id, c) ?? { tema: 'SISTEMA', tamanho_fonte: 'MEDIO', alto_contraste: false, modo_acessibilidade: false, idioma: 'pt-BR', aparencia: 'cineastra' });
            }, context);
        },
        async export(input, query, context) {
            const section = query.section ?? 'profile';
            if (!['profile', 'addresses', 'contacts', 'preferences', 'consents', 'age', 'privacy', 'guardians', 'authorizations', 'sessions', 'factors', 'recoveries', 'controls'].includes(section)) throw ApiError.validacao('Seção inválida');
            const p = page(query);
            const snapshot = await passwordSnapshot(context.actor.id, input.password);
            return transaction(async c => {
                const u = await reauthenticate(c, context, input, snapshot);
                let data;
                if (section === 'profile') data = { ...userDto(u), cpf: u.cpf };
                else if (section === 'preferences') data = await model.preferences(u.id_usuario, c);
                else if (section === 'controls') data = await model.controls(c, u.id_usuario);
                else if (['addresses', 'contacts'].includes(section)) data = resultPage(await model.list(section, u.id_usuario, p.limit, p.cursor, c), p.limit, resources[section].pk);
                else data = resultPage(await model.exportSection(c, u.id_usuario, section, p.limit, p.cursor), p.limit, 'id');
                await audit(c, 'IDENTITY.DATA_EXPORTED', u.id_usuario, context);
                return { section, data, scope: 'IDENTITY_MODULE' };
            }, context);
        },
        async deleteAccount(input, context) {
            const snapshot = await passwordSnapshot(context.actor.id, input.password);
            return transaction(async c => {
                await model.adminGuard(c);
                const user = await reauthenticate(c, context, input, snapshot);
                if (user.tipo_usuario === 'ADMIN' && Number((await model.adminCount(c)).total) <= 1) throw new ApiError('Último administrador ativo', 409, null, 'LAST_ADMIN');
                const request = await model.privacyRequest(c, user.id_usuario);
                await model.updateUser(c, user.id_usuario, { status: 'INATIVO' });
                await model.revoke(c, user.id_usuario);
                await model.invalidateChallenges(c, user.id_usuario);
                await model.invalidateRecovery(c, user.id_usuario);
                await audit(c, 'IDENTITY.DELETION_REQUESTED', user.id_usuario, context);
                return { id: idString(request.id_solicitacao), status: request.status, accountStatus: 'INATIVO', message: 'Conta desativada. Exclusão e retenção aguardam análise de privacidade.' };
            }, context);
        },
        async adminCreate(input, context) {
            passwordPolicy(input.password, input.passwordConfirmation);
            const hash = await hashPassword(input.password, config.identity.bcryptCost);
            return transaction(async c => {
                await model.adminGuard(c);
                if ((await activeActor(c, context)).tipo_usuario !== 'ADMIN') throw ApiError.acessoNegado();
                const id = await model.createUser(c, { ...input, hash, status: 'ATIVO' });
                await audit(c, 'IDENTITY.STAFF_CREATED', id, context);
                return userDto(await model.user(id, c));
            }, context);
        },
        async adminGet(id, context) {
            return transaction(async c => { if ((await activeActor(c, context)).tipo_usuario !== 'ADMIN') throw ApiError.acessoNegado(); const u = await model.user(id, c); if (!u) throw ApiError.naoEncontrado(); return userDto(u); }, context);
        },
        async authorization(id, authorizationId, context) {
            return transaction(async c => {
                await activeActor(c, context);
                const link = await model.guardianLink(c, context.actor.id, id);
                const row = link && await model.getAuthorization(c, link.id_vinculo, authorizationId);
                if (!row) throw ApiError.naoEncontrado();
                return { id: idString(row.id), purpose: row.purpose, operationReference: row.operationReference, expiresAt: new Date(instant(row.expiracao)).toISOString() };
            }, context);
        },
        async adminAccess(id, input, context) {
            return transaction(async c => {
                await model.adminGuard(c);
                // Ordem total dos usuários, também usada no fluxo parental.
                for (const userId of [...new Set([id, context.actor.id])].sort((a, b) => BigInt(a) < BigInt(b) ? -1 : 1)) await model.user(userId, c, true);
                if ((await activeActor(c, context)).tipo_usuario !== 'ADMIN') throw ApiError.acessoNegado();
                const u = await model.user(id, c);
                if (!u) throw ApiError.naoEncontrado();
                if (u.tipo_usuario === 'ADMIN' && ((input.role && input.role !== 'ADMIN') || (input.status && input.status !== 'ATIVO')) && Number((await model.adminCount(c)).total) <= 1) throw new ApiError('Último administrador ativo', 409, null, 'LAST_ADMIN');
                // Nunca reativar uma solicitação de exclusão por PATCH de privilégios.
                if (input.status === 'ATIVO' && u.status !== 'ATIVO') throw new ApiError('Reativação exige revisão de identidade e privacidade', 409, null, 'REACTIVATION_REQUIRES_REVIEW');
                const patch = {};
                if (input.role) patch.tipo_usuario = input.role;
                if (input.status) patch.status = input.status;
                await model.updateUser(c, id, patch);
                await model.revoke(c, id); await model.invalidateChallenges(c, id); await model.invalidateRecovery(c, id);
                await audit(c, 'IDENTITY.ACCESS_CHANGED', id, context);
                return userDto(await model.user(id, c));
            }, context);
        },
        async privacyStatus(id, context) {
            return transaction(async c => { if ((await activeActor(c, context)).tipo_usuario !== 'ADMIN') throw ApiError.acessoNegado(); const r = await model.privacyStatus(c, id); if (!r) throw ApiError.naoEncontrado(); return normalize(r); }, context);
        },
        async parental(id, input, authorize, context) {
            return transaction(async c => {
                for (const userId of [...new Set([id, context.actor.id])].sort((a, b) => BigInt(a) < BigInt(b) ? -1 : 1)) await model.user(userId, c, true);
                await activeActor(c, context); await activeUser(c, id);
                const link = await model.guardianLink(c, context.actor.id, id);
                if (!link) throw ApiError.naoEncontrado();
                if ((await model.latestAge(c, id))?.faixa_etaria !== 'ATE_16') throw ApiError.acessoNegado();
                if (authorize) {
                    const expiry = Date.parse(input.expiresAt);
                    if (expiry <= Date.now() || expiry > Date.now() + 86400000) throw ApiError.validacao('Autorização deve expirar em até 24 horas');
                    if (!(await model.latestAge(c, id))) throw ApiError.acessoNegado();
                    const controls = await model.controls(c, id);
                    if (!(input.purpose === 'COMPRA' ? controls.compras_permitidas : controls.assinaturas_permitidas)) throw ApiError.acessoNegado();
                    const authorizationId = await model.authorize(c, link.id_vinculo, { ...input, expiresAt: sqlDate(expiry) });
                    await audit(c, 'IDENTITY.PARENTAL_AUTHORIZED', id, context);
                    return { id: authorizationId, ...input };
                }
                if (input) { await model.updateControls(c, id, input); await audit(c, 'IDENTITY.PARENTAL_CHANGED', id, context); }
                return normalize(await model.controls(c, id));
            }, context);
        }
    };
}
