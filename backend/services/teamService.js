import { ApiError } from '../utils/ApiError.js';
import { idString } from '../utils/dto.js';

const found = row => { if (!row) throw ApiError.naoEncontrado(); return row; };
const conflict = message => new ApiError(message, 409, null, 'TEAM_CONFLICT');
const activeSession = row => ['AGENDADA','EM_CARTAZ'].includes(row?.status ?? row?.sessao_status);
export const teamDto = row => ({ id_equipe: idString(row.id_equipe), id_supervisor: idString(row.id_supervisor), id_sessao: idString(row.id_sessao), nome: row.nome, status: row.status });
export const memberDto = row => ({ id_equipe_membro: idString(row.id_equipe_membro), id_equipe: idString(row.id_equipe), id_usuario: idString(row.id_usuario), funcao: row.funcao ?? null, data_entrada: row.data_entrada, status: row.status });
export const entryDto = row => ({ id_entrada: idString(row.id_entrada), id_equipe: idString(row.id_equipe), id_usuario: idString(row.id_usuario), id_emissor: idString(row.id_emissor), tipo: row.tipo, funcao_proposta: row.funcao_proposta ?? null, status: row.status, criado_em: row.criado_em, decidido_em: row.decidido_em ?? null });
export function createTeamService({ model, identity, notifications }) {
    if (!notifications?.emit) throw new TypeError('Serviço interno de notificações obrigatório');
    async function actor(c, context) {
        const u = await identity.activeActor(c, context);
        if (!['ADMIN','SUPERVISOR','COLABORADOR'].includes(u.tipo_usuario)) throw ApiError.acessoNegado();
        return { id: idString(u.id_usuario), tipo: u.tipo_usuario };
    }
    const manager = (u, team) => u.tipo === 'ADMIN' || u.tipo === 'SUPERVISOR' && u.id === idString(team.id_supervisor);
    async function lockedTeam(c, id) { return found(await model.lockTeam(id, c)); }
    async function eligibleUser(c, id, role, lock = false) {
        const u = found(await model.user(id, c, lock));
        if (u.status !== 'ATIVO' || u.tipo_usuario !== role) throw conflict(`Usuário deve ser ${role} ativo`);
        return u;
    }
    async function writableTeam(c, team) {
        if (team.status !== 'ATIVA' || !activeSession(await model.session(team.id_sessao, c))) throw conflict('Equipe ou sessão não aceita novas alterações operacionais');
    }
    async function noActiveMember(c, teamId, userId) {
        const member = await model.memberByUser(teamId, userId, c);
        if (member?.status === 'ATIVO') throw conflict('Usuário já participa da equipe');
        return member;
    }
    function page(rows, q, dto, key) { const items = rows.slice(0, q.limit); return { items: items.map(dto), pagination: { limit: q.limit, nextCursor: rows.length > q.limit ? idString(items.at(-1)[key]) : null } }; }
    async function transaction(operation, context) {
        try { return await identity.transaction(async c => operation(c, await actor(c, context)), context); }
        catch (error) { if (error.code === 'ER_DUP_ENTRY') throw conflict('Solicitação, convite ou vínculo já existe'); throw error; }
    }
    return {
        async listTeams(q, context) {
            const u = { id: context.actor.id, tipo: context.actor.tipo };
            if (!['ADMIN','SUPERVISOR','COLABORADOR'].includes(u.tipo)) throw ApiError.acessoNegado();
            return page(await model.listTeams(u, q), q, teamDto, 'id_equipe');
        },
        async team(id, context) {
            const u = { id: context.actor.id, tipo: context.actor.tipo }, team = found(await model.team(id));
            if (!manager(u, team)) {
                const member = await model.memberByUser(id, u.id);
                if (!(u.tipo === 'COLABORADOR' && (team.status === 'ATIVA' && activeSession(team) || member?.status === 'ATIVO'))) throw ApiError.acessoNegado();
            }
            return teamDto(team);
        },
        async create(input, context) {
            return transaction(async (c, u) => {
                if (!['ADMIN','SUPERVISOR'].includes(u.tipo)) throw ApiError.acessoNegado();
                const supervisorId = u.tipo === 'SUPERVISOR' ? u.id : input.supervisorId;
                if (!supervisorId || u.tipo === 'SUPERVISOR' && input.supervisorId && input.supervisorId !== u.id) throw ApiError.acessoNegado();
                // Sessão antes da equipe: cria e serializa uma equipe ativa por sessão.
                const session = found(await model.session(input.sessionId, c, true));
                if (!activeSession(session)) throw conflict('Sessão não admite equipe ativa');
                await eligibleUser(c, supervisorId, 'SUPERVISOR', true);
                if (await model.activeTeamForSession(input.sessionId, c)) throw conflict('Sessão já tem equipe ativa');
                const id = await model.create(c, { sessionId: input.sessionId, supervisorId, nome: input.nome });
                await identity.audit(c, 'TEAM.CREATED', id, context);
                return teamDto(found(await model.team(id, c)));
            }, context);
        },
        async patch(id, input, context) {
            return transaction(async (c, u) => {
                const team = await lockedTeam(c, id);
                if (!manager(u, team)) throw ApiError.acessoNegado();
                if (team.status !== 'ATIVA') throw conflict('Equipe encerrada');
                if (input.supervisorId && u.tipo !== 'ADMIN') throw ApiError.acessoNegado();
                if (input.supervisorId) await eligibleUser(c, input.supervisorId, 'SUPERVISOR', true);
                if (!input.status || input.nome || input.supervisorId) await writableTeam(c, team);
                const data = { ...input };
                if (input.supervisorId) { data.id_supervisor = input.supervisorId; delete data.supervisorId; await model.cancelPending(c, id); }
                if (input.status) await model.cancelPending(c, id);
                await model.update(c, id, data);
                await identity.audit(c, 'TEAM.CHANGED', id, context);
                return teamDto(found(await model.team(id, c)));
            }, context);
        },
        async archive(id, context) {
            return transaction(async (c, u) => {
                const team = await lockedTeam(c, id);
                if (!manager(u, team)) throw ApiError.acessoNegado();
                if (team.status === 'CANCELADA') return;
                if (team.status !== 'ATIVA') throw conflict('Equipe finalizada');
                await model.cancelPending(c, id);
                await model.update(c, id, { status: 'CANCELADA' });
                await identity.audit(c, 'TEAM.CANCELLED', id, context);
            }, context);
        },
        async members(id, q, context) {
            const u = { id: context.actor.id, tipo: context.actor.tipo }, team = found(await model.team(id));
            if (!manager(u, team) && (await model.memberByUser(id, u.id))?.status !== 'ATIVO') throw ApiError.acessoNegado();
            return page(await model.listMembers(id, q), q, memberDto, 'id_equipe_membro');
        },
        async changeMember(id, memberId, input, context) {
            return transaction(async (c, u) => {
                const team = await lockedTeam(c, id);
                if (!manager(u, team)) throw ApiError.acessoNegado();
                await writableTeam(c, team);
                const member = found(await model.member(id, memberId, c));
                if (member.status !== 'ATIVO') throw conflict('Membro inativo exige novo convite ou solicitação');
                await model.updateMember(c, id, memberId, input);
                await identity.audit(c, 'TEAM.MEMBER_CHANGED', memberId, context);
                return memberDto(found(await model.member(id, memberId, c)));
            }, context);
        },
        async removeMember(id, memberId, context) {
            return transaction(async (c, u) => {
                const team = await lockedTeam(c, id);
                if (!manager(u, team)) throw ApiError.acessoNegado();
                await writableTeam(c, team);
                const member = found(await model.member(id, memberId, c));
                if (member.status === 'INATIVO') return;
                await model.updateMember(c, id, memberId, { status: 'INATIVO' });
                await identity.audit(c, 'TEAM.MEMBER_REMOVED', memberId, context);
            }, context);
        },
        async entries(id, q, context) {
            const u = { id: context.actor.id, tipo: context.actor.tipo }, team = found(await model.team(id));
            if (!manager(u, team) && u.tipo !== 'COLABORADOR') throw ApiError.acessoNegado();
            return page(await model.listEntries(id, q, manager(u, team) ? null : u.id), q, entryDto, 'id_entrada');
        },
        async propose(id, input, type, context) {
            return transaction(async (c, u) => {
                const team = await lockedTeam(c, id);
                await writableTeam(c, team);
                const request = type === 'SOLICITACAO';
                if (request && u.tipo !== 'COLABORADOR' || !request && !manager(u, team)) throw ApiError.acessoNegado();
                const userId = request ? u.id : input.userId;
                await eligibleUser(c, userId, 'COLABORADOR', true);
                await noActiveMember(c, id, userId);
                if (await model.pendingEntry(id, userId, c)) throw conflict('Já existe entrada pendente');
                const entryId = await model.createEntry(c, { teamId: id, userId, actorId: u.id, type, functionName: request ? null : input.funcao });
                if (!request) await notifications.emit(c, { recipientId: idString(userId), title: 'Convite para equipe', message: `Você recebeu um convite para a equipe ${id}.`, type: 'TEAM_INVITATION', dedupeKey: `team-invitation:${entryId}` });
                await identity.audit(c, 'TEAM.ENTRY_PROPOSED', entryId, context);
                return entryDto(found(await model.entry(id, entryId, c)));
            }, context);
        },
        async decide(id, entryId, input, context) {
            return transaction(async (c, u) => {
                const team = await lockedTeam(c, id);
                await writableTeam(c, team);
                const entry = found(await model.entry(id, entryId, c, true));
                if (entry.status !== 'PENDENTE') throw conflict('Entrada já decidida');
                const request = entry.tipo === 'SOLICITACAO';
                if (request ? !manager(u, team) : u.id !== idString(entry.id_usuario) || u.tipo !== 'COLABORADOR') throw ApiError.acessoNegado();
                if (request && input.decision === 'ACEITAR' && !input.funcao || input.funcao && !(request && input.decision === 'ACEITAR')) throw ApiError.validacao('Função inválida para esta decisão');
                if (input.decision === 'ACEITAR') {
                    await eligibleUser(c, entry.id_usuario, 'COLABORADOR', true);
                    const previous = await noActiveMember(c, id, entry.id_usuario);
                    await model.activateMember(c, id, entry.id_usuario, request ? input.funcao : entry.funcao_proposta, previous);
                }
                await model.decideEntry(c, id, entryId, input.decision === 'ACEITAR' ? 'ACEITA' : 'RECUSADA');
                await identity.audit(c, 'TEAM.ENTRY_DECIDED', entryId, context);
                return entryDto(found(await model.entry(id, entryId, c)));
            }, context);
        },
        async cancelEntry(id, entryId, context) {
            return transaction(async (c, u) => {
                const team = await lockedTeam(c, id), entry = found(await model.entry(id, entryId, c, true));
                if (!manager(u, team) && u.id !== idString(entry.id_emissor)) throw ApiError.acessoNegado();
                if (entry.status !== 'PENDENTE') throw conflict('Entrada já decidida');
                await model.decideEntry(c, id, entryId, 'CANCELADA');
                await identity.audit(c, 'TEAM.ENTRY_CANCELLED', entryId, context);
            }, context);
        }
    };
}
