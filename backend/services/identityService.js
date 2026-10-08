import { randomUUID } from 'node:crypto';
import { ApiError } from '../utils/ApiError.js';
import { idString } from '../utils/dto.js';
import { recordAuditEvent } from '../models/auditModel.js';
import { report } from '../utils/telemetry.js';
import { opaqueToken, tokenHash, tokenHexHash, passwordPolicy, hashPassword, verifyPassword, newTotp, sealSecret, unsealSecret, totpStep } from '../utils/identityCrypto.js';

export const sqlDate = value => new Date(value).toISOString().replace('T', ' ').replace('Z', '');
export const instant = value => value instanceof Date ? value.getTime() : Date.parse(`${String(value).replace(' ', 'T')}${/[Z+-]\d*:?\d*$/.test(String(value).slice(10)) ? '' : 'Z'}`);
export function userDto(u) {
    return { id: idString(u.id_usuario), name: u.nome, email: u.email, phone: u.telefone ?? null, dateOfBirth: u.data_nascimento, role: u.tipo_usuario, status: u.status };
}
const conflict = () => new ApiError('Cadastro ou operação em conflito', 409, null, 'IDENTITY_CONFLICT');
export function createIdentityService({ database, model, config, tokens, providers }) {
    let dummyHash;
    const settings = config.identity;
    const audit = (c, type, id, context = {}) => recordAuditEvent(c, { eventId: randomUUID(), requestId: context.requestId ?? randomUUID(), aggregateId: id, actorId: context.actor?.id ?? null, type, version: 1, occurredAt: new Date().toISOString() });
    const transaction = async (fn, context = {}) => {
        try { return await database.transaction(fn, { signal: context.signal }); }
        catch (e) { if (e.code === 'ER_DUP_ENTRY') throw conflict(); throw e; }
    };
    async function activeUser(c, id) {
        const user = await model.user(id, c, true);
        if (!user || user.status !== 'ATIVO') throw ApiError.naoAutorizado();
        return user;
    }
    async function activeActor(c, context) {
        const u = await activeUser(c, context.actor.id);
        const s = await model.activeSession(c, context.actor.id, context.actor.sessionId);
        if (!s || s.revogada_em || !(instant(s.expiracao) > Date.now())) throw ApiError.naoAutorizado();
        if (['ADMIN', 'SUPERVISOR'].includes(u.tipo_usuario) && !s.two_factor_verified) throw ApiError.acessoNegado();
        return u;
    }
    async function credential(email, password) {
        const user = await model.byEmail(email);
        // Mesmo trabalho bcrypt para conta ausente/inativa; mensagem única.
        dummyHash ??= hashPassword(opaqueToken(), settings.bcryptCost);
        const valid = await verifyPassword(password, user?.senha ?? await dummyHash);
        if (!valid || user?.status !== 'ATIVO') throw ApiError.naoAutorizado();
        return user;
    }
    async function passwordSnapshot(id, password) {
        const u = await model.user(id);
        if (!u || u.status !== 'ATIVO' || !await verifyPassword(password, u.senha)) throw ApiError.naoAutorizado();
        return u;
    }
    function sameCredential(current, snapshot) { if (current.senha !== snapshot.senha) throw ApiError.naoAutorizado(); }
    async function session(c, user, verified) {
        const jti = randomUUID();
        const id = await model.createSession(c, user.id_usuario, tokenHash(jti), sqlDate(Date.now() + config.jwt.ttl * 1000), verified);
        return { accessToken: tokens.signAccess({ userId: user.id_usuario, sessionId: id, jti }), tokenType: 'Bearer', expiresIn: config.jwt.ttl, user: userDto(user) };
    }
    async function challenge(c, userId, purpose, method = null, secret = null) {
        await model.invalidateChallenges(c, userId);
        const token = opaqueToken();
        await model.createChallenge(c, userId, { hash: tokenHash(token), purpose, method, secret, expiry: sqlDate(Date.now() + 300000) });
        return { challengeToken: token, expiresIn: 300, next: purpose === 'LOGIN' ? 'VERIFY_2FA' : 'ENROLL_2FA', method };
    }
    const validChallenge = d => d && !d.consumido_em && d.tentativas < 5 && instant(d.expiracao) > Date.now();
    function factorStep(factor, code, userId) {
        if (factor.metodo !== 'APP') throw ApiError.indisponivel();
        const step = totpStep(unsealSecret(factor.chave, settings.encryptionKey, idString(userId)), code);
        return step !== null && (factor.ultimo_passo === null || BigInt(step) > BigInt(factor.ultimo_passo)) ? step : null;
    }
    async function proveFactor(c, user, code) {
        const factors = await model.factors(c, user.id_usuario);
        if (!factors.length) {
            if (['ADMIN', 'SUPERVISOR'].includes(user.tipo_usuario)) throw ApiError.acessoNegado();
            return true;
        }
        if (!code) return false;
        const factor = factors.find(f => f.metodo === 'APP') ?? factors[0];
        const step = factorStep(factor, code, user.id_usuario);
        if (step === null) return false;
        await model.step(c, factor.id_2fa, step);
        return true;
    }
    async function verifyProof(input, context) {
        if (!settings.termsVersion || !settings.privacyVersion || !settings.legalBasis) throw ApiError.indisponivel();
        if (input.termsVersion !== settings.termsVersion || input.privacyVersion !== settings.privacyVersion) throw ApiError.validacao('Versão de termos ou privacidade desatualizada');
        const proof = await providers.age.verify({ proof: input.ageProof, email: input.email, cpf: input.cpf, dateOfBirth: input.dateOfBirth, signal: context.signal });
        if (!proof || proof.verified !== true || proof.dateOfBirth !== input.dateOfBirth || !['ATE_16', 'MAIOR_16'].includes(proof.ageBand) || !/^[\w:.-]{1,150}$/.test(proof.reference ?? '') || !Number.isFinite(Date.parse(proof.verifiedAt)) || Date.parse(proof.verifiedAt) > Date.now() || Date.parse(proof.expiresAt) <= Date.now() || !Number.isFinite(Date.parse(proof.expiresAt))) throw ApiError.validacao('Verificação de idade inválida');
        const age = { ...proof, verifiedAt: sqlDate(proof.verifiedAt), expiresAt: sqlDate(proof.expiresAt) };
        let guardian;
        if (age.ageBand === 'ATE_16') {
            if (!input.guardianProof) throw ApiError.validacao('Comprovação de responsável necessária');
            guardian = await providers.guardian.verify({ proof: input.guardianProof, minorReference: proof.reference, signal: context.signal });
            if (!guardian || guardian.verified !== true || !/^[\w:.-]{1,150}$/.test(guardian.reference ?? '') || !/^[1-9]\d{0,9}$/.test(guardian.guardianId ?? '')) throw ApiError.validacao('Vínculo de responsável inválido');
        }
        return { age, guardian };
    }
    const service = {
        model, transaction, audit, activeUser, activeActor, passwordSnapshot, sameCredential, proveFactor,
        sessionProvider: {
            async verifyActive({ userId, sessionId, jti, signal }) {
                const row = await model.session(sessionId, userId, tokenHash(jti), { signal });
                if (!row) return null;
                return { userId: idString(row.id_usuario), expiresAt: new Date(instant(row.expiracao)).toISOString(), revoked: Boolean(row.revogada_em), twoFactorVerified: row.two_factor_verified === 1 || row.two_factor_verified === true };
            }
        },
        async register(input, context = {}) {
            passwordPolicy(input.password, input.passwordConfirmation);
            const { age, guardian } = await verifyProof(input, context);
            const hash = await hashPassword(input.password, settings.bcryptCost);
            return transaction(async c => {
                if (guardian) {
                    const parent = await activeUser(c, guardian.guardianId);
                    const parentAge = await model.latestAge(c, parent.id_usuario);
                    if (parentAge?.faixa_etaria !== 'MAIOR_16') throw ApiError.validacao('Responsável sem verificação vigente');
                }
                const id = await model.createUser(c, { ...input, hash, role: 'CLIENTE', status: 'ATIVO' });
                await model.consent(c, id, 'TERMOS', input.termsVersion, settings.legalBasis);
                await model.consent(c, id, 'PRIVACIDADE', input.privacyVersion, settings.legalBasis);
                await model.age(c, id, age);
                if (guardian) await model.guardian(c, id, guardian);
                await audit(c, 'IDENTITY.REGISTERED', id, context);
                return userDto(await model.user(id, c));
            }, context);
        },
        async login(input, context = {}) {
            const snapshot = await credential(input.email, input.password);
            return transaction(async c => {
                const user = await activeUser(c, snapshot.id_usuario); sameCredential(user, snapshot);
                const factors = await model.factors(c, user.id_usuario);
                if (factors.length) {
                    const factor = factors.find(f => f.metodo === 'APP') ?? factors[0];
                    if (factor.metodo !== 'APP') throw ApiError.indisponivel();
                    return challenge(c, user.id_usuario, 'LOGIN', factor.metodo);
                }
                if (['ADMIN', 'SUPERVISOR'].includes(user.tipo_usuario)) return challenge(c, user.id_usuario, 'ENROLLMENT');
                await audit(c, 'IDENTITY.LOGIN', user.id_usuario, context);
                return session(c, user, false);
            }, context);
        },
        async renewAge(input, context) {
            const snapshot = await model.user(context.actor.id);
            if (!snapshot || snapshot.status !== 'ATIVO') throw ApiError.naoAutorizado();
            const { age, guardian } = await verifyProof({ ...input, email: snapshot.email.trim().toLowerCase(), cpf: snapshot.cpf.replace(/[.-]/g, ''), dateOfBirth: snapshot.data_nascimento }, context);
            return transaction(async c => {
                for (const id of [...new Set([context.actor.id, ...(guardian ? [guardian.guardianId] : [])])].sort((a, b) => BigInt(a) < BigInt(b) ? -1 : 1)) await model.user(id, c, true);
                const u = await activeActor(c, context);
                if (u.email !== snapshot.email || u.cpf !== snapshot.cpf || u.data_nascimento !== snapshot.data_nascimento) throw conflict();
                if (guardian) {
                    await activeUser(c, guardian.guardianId);
                    if (!await model.guardianLink(c, guardian.guardianId, u.id_usuario)) throw new ApiError('Alteração de responsável exige revisão do vínculo', 409, null, 'GUARDIAN_REVIEW_REQUIRED');
                }
                await model.age(c, u.id_usuario, age);
                await model.consent(c, u.id_usuario, 'TERMOS', input.termsVersion, settings.legalBasis);
                await model.consent(c, u.id_usuario, 'PRIVACIDADE', input.privacyVersion, settings.legalBasis);
                await audit(c, 'IDENTITY.AGE_REVERIFIED', u.id_usuario, context);
                return { ageBand: age.ageBand, expiresAt: new Date(instant(age.expiresAt)).toISOString() };
            }, context);
        },
        async enroll(input, context = {}) {
            if (input.method !== 'APP') throw ApiError.indisponivel();
            // Falha de chave antes de alterar desafio; segredo entregue somente em enrollment autorizado.
            const totp = newTotp(context.actor?.id ?? 'pending');
            let snapshot, lookup;
            if (input.challengeToken) lookup = await model.challenge(tokenHash(input.challengeToken));
            else if (context.actor) snapshot = await passwordSnapshot(context.actor.id, input.password);
            else throw ApiError.naoAutorizado();
            if (!snapshot && (!validChallenge(lookup) || lookup.finalidade !== 'ENROLLMENT' || lookup.metodo !== null)) throw ApiError.naoAutorizado();
            return transaction(async c => {
                const u = snapshot ? await activeActor(c, context) : await activeUser(c, lookup.id_usuario);
                if (snapshot) sameCredential(u, snapshot);
                else {
                    const d = await model.challenge(tokenHash(input.challengeToken), c, true);
                    if (!validChallenge(d) || d.finalidade !== 'ENROLLMENT' || d.metodo !== null) throw ApiError.naoAutorizado();
                }
                if ((await model.factors(c, u.id_usuario)).length && (!snapshot || !await proveFactor(c, u, input.code))) throw ApiError.naoAutorizado();
                totp.label = `user-${idString(u.id_usuario)}`;
                const sealed = sealSecret(totp.secret.base32, settings.encryptionKey, idString(u.id_usuario));
                const result = await challenge(c, u.id_usuario, 'ENROLLMENT', 'APP', sealed);
                return { ...result, next: 'VERIFY_2FA', provisioningUri: totp.toString() };
            }, context);
        },
        async verify(input, context = {}) {
            const hash = tokenHash(input.challengeToken);
            const lookup = await model.challenge(hash);
            if (!lookup) throw ApiError.naoAutorizado();
            const result = await transaction(async c => {
                const user = await activeUser(c, lookup.id_usuario);
                const d = await model.challenge(hash, c, true);
                if (!validChallenge(d) || d.metodo !== 'APP') return null;
                // Tentativa inválida é COMMITADA; lançar dentro da transação desfaria o contador.
                await model.challengeAttempt(c, d.id_desafio);
                if (d.finalidade === 'ENROLLMENT') {
                    if (!d.chave_pendente) return null;
                    const step = totpStep(unsealSecret(d.chave_pendente, settings.encryptionKey, idString(user.id_usuario)), input.code);
                    if (step === null) return null;
                    await model.activateFactor(c, user.id_usuario, 'APP', d.chave_pendente, step);
                    await model.revoke(c, user.id_usuario);
                } else {
                    if (!(await model.factors(c, user.id_usuario)).length) return null;
                    if (!await proveFactor(c, user, input.code)) return null;
                }
                await model.invalidateChallenges(c, user.id_usuario);
                await audit(c, d.finalidade === 'ENROLLMENT' ? 'IDENTITY.FACTOR_ENABLED' : 'IDENTITY.LOGIN', user.id_usuario, context);
                return session(c, user, true);
            }, context);
            if (!result) throw ApiError.naoAutorizado();
            return result;
        },
        async logout(context) {
            return transaction(async c => { await model.user(context.actor.id, c, true); await model.revoke(c, context.actor.id, context.actor.sessionId); await audit(c, 'IDENTITY.LOGOUT', context.actor.id, context); }, context);
        },
        async forgot(input, context = {}) {
            // Disponibilidade checada antes da busca: indisponibilidade não revela existência.
            await providers.email.assertAvailable();
            const u = await model.byEmail(input.email);
            const token = opaqueToken();
            let recipient;
            if (u?.status === 'ATIVO') recipient = await transaction(async c => {
                const current = await model.user(u.id_usuario, c, true);
                if (current.status !== 'ATIVO' || current.email !== u.email) return null;
                await model.invalidateRecovery(c, u.id_usuario);
                await model.createRecovery(c, u.id_usuario, tokenHexHash(token), sqlDate(Date.now() + 1800000));
                return current.email;
            }, context);
            if (recipient) {
                try { await providers.email.sendRecovery({ email: recipient, token, expiresIn: 1800, signal: context.signal }); }
                catch {
                    report('identity_recovery_delivery_failed');
                    // Resposta genérica também em falha de entrega; não afirma envio bem-sucedido.
                    await transaction(async c => { await model.user(u.id_usuario, c, true); const row = await model.recovery(tokenHexHash(token), c, true); if (row && !row.utilizado) await model.invalidateRecovery(c, u.id_usuario); }, context);
                }
            }
            return { message: 'Se a conta for elegível, você receberá as instruções de recuperação.' };
        },
        async reset(input, context = {}) {
            passwordPolicy(input.password, input.passwordConfirmation);
            const lookup = await model.recovery(tokenHexHash(input.token));
            if (!lookup || lookup.utilizado || instant(lookup.expiracao) <= Date.now()) throw ApiError.naoAutorizado();
            const hash = await hashPassword(input.password, settings.bcryptCost);
            return transaction(async c => {
                const user = await activeUser(c, lookup.id_usuario);
                const recovery = await model.recovery(tokenHexHash(input.token), c, true);
                if (!recovery || recovery.utilizado || instant(recovery.expiracao) <= Date.now()) throw ApiError.naoAutorizado();
                await model.updateUser(c, user.id_usuario, { senha: hash });
                await model.invalidateRecovery(c, user.id_usuario);
                await model.invalidateChallenges(c, user.id_usuario);
                await model.revoke(c, user.id_usuario);
                await audit(c, 'IDENTITY.PASSWORD_RESET', user.id_usuario, context);
            }, context);
        },
        async disableFactor(input, context) {
            const snapshot = await passwordSnapshot(context.actor.id, input.password);
            return transaction(async c => {
                const user = await activeActor(c, context); sameCredential(user, snapshot);
                if (['ADMIN', 'SUPERVISOR'].includes(user.tipo_usuario)) throw ApiError.acessoNegado();
                if (!await proveFactor(c, user, input.code)) throw ApiError.naoAutorizado();
                await model.disableFactor(c, user.id_usuario);
                await model.invalidateChallenges(c, user.id_usuario);
                await model.revoke(c, user.id_usuario);
                await audit(c, 'IDENTITY.FACTOR_DISABLED', user.id_usuario, context);
            }, context);
        },
        async requireAge(c, userId, purpose, operationReference) {
            await activeUser(c, userId);
            const proof = await model.latestAge(c, userId);
            if (!proof) throw ApiError.acessoNegado();
            if (proof.faixa_etaria === 'ATE_16' && (!['COMPRA', 'ASSINATURA'].includes(purpose) || !await model.authorization(c, userId, purpose, operationReference))) throw ApiError.acessoNegado();
            return { ageBand: proof.faixa_etaria };
        }
    };
    return service;
}
