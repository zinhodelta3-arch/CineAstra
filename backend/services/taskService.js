import { ApiError } from '../utils/ApiError.js';
import { idString } from '../utils/dto.js';

const found = row => { if (!row) throw ApiError.naoEncontrado(); return row; };
const conflict = message => new ApiError(message, 409, null, 'TASK_CONFLICT');
const active = team => team.status === 'ATIVA' && ['AGENDADA','EM_CARTAZ'].includes(team.sessao_status);
const manager = (actor, team) => actor.tipo === 'ADMIN' || actor.tipo === 'SUPERVISOR' && actor.id === idString(team.id_supervisor);
const taskDto = row => ({ id_chamado: idString(row.id_chamado), id_criador: idString(row.id_criador), id_responsavel: row.id_responsavel == null ? null : idString(row.id_responsavel), id_sessao: idString(row.id_sessao), id_equipe: idString(row.id_equipe), titulo: row.titulo, descricao: row.descricao ?? null, prioridade: row.prioridade, status: row.status, data_abertura: row.data_abertura, data_fechamento: row.data_fechamento ?? null });
const eventDto = row => ({ id_evento: idString(row.id_evento), id_chamado: idString(row.id_chamado), id_ator: idString(row.id_ator), acao: row.acao, status_anterior: row.status_anterior ?? null, status_novo: row.status_novo, id_responsavel: row.id_responsavel == null ? null : idString(row.id_responsavel), criado_em: row.criado_em });
const page = (rows, q, dto, key) => { const items = rows.slice(0, q.limit); return { items: items.map(dto), pagination: { limit: q.limit, nextCursor: rows.length > q.limit ? idString(items.at(-1)[key]) : null } }; };

export function createTaskService({ model, identity }) {
    const asActor = row => {
        if (!['ADMIN','SUPERVISOR','COLABORADOR'].includes(row.tipo_usuario)) throw ApiError.acessoNegado();
        return { id: idString(row.id_usuario), tipo: row.tipo_usuario };
    };
    async function access(c, teamId, actor, lock = false) {
        const team = found(await model.team(teamId, c, lock));
        const member = manager(actor, team) ? null : await model.membership(teamId, actor.id, c);
        if (!manager(actor, team) && !(actor.tipo === 'COLABORADOR' && member?.status === 'ATIVO' && member?.usuario_status === 'ATIVO' && member?.tipo_usuario === 'COLABORADOR' && member?.funcao?.trim())) throw ApiError.acessoNegado();
        return team;
    }
    async function eligibleMember(c, teamId, userId) {
        const member = await model.membership(teamId, userId, c);
        if (!member || member.status !== 'ATIVO' || member.usuario_status !== 'ATIVO' || member.tipo_usuario !== 'COLABORADOR' || !member.funcao?.trim()) throw conflict('Responsável precisa ser colaborador ativo com função na equipe');
    }
    async function taskInTeam(c, team, id, lock = false) {
        const task = found(await model.task(team.id_equipe, id, c, lock));
        if (idString(task.id_sessao) !== idString(team.id_sessao)) throw conflict('Chamado não pertence à sessão da equipe');
        return task;
    }
    async function record(c, taskId, actor, action, before, after, responsibleId, context) {
        await model.event(c, { taskId, actorId: actor.id, action, before, after, responsibleId });
        await identity.audit(c, `TASK.${action}`, taskId, context);
    }
    async function mutate(teamId, context, operation) {
        return identity.transaction(async c => {
            const actor = asActor(await identity.activeActor(c, context));
            const team = await access(c, teamId, actor, true);
            if (!active(team)) throw conflict('Equipe ou sessão não admite alteração de chamados');
            return operation(c, actor, team);
        }, context);
    }
    const readActor = context => ({ id: context.actor.id, tipo: context.actor.tipo });
    return {
        async list(teamId, q, context) {
            const team = await access(undefined, teamId, readActor(context));
            return page(await model.list(teamId, team.id_sessao, q, context.actor.id), q, taskDto, 'id_chamado');
        },
        async get(teamId, id, context) {
            const team = await access(undefined, teamId, readActor(context));
            return taskDto(await taskInTeam(undefined, team, id));
        },
        async create(teamId, input, context) {
            return mutate(teamId, context, async (c, actor, team) => {
                const id = await model.create(c, { ...input, actorId: actor.id, sessionId: team.id_sessao, teamId });
                await record(c, id, actor, 'CRIADO', null, 'ABERTO', null, context);
                return taskDto(await taskInTeam(c, team, id));
            });
        },
        async edit(teamId, id, input, context) {
            return mutate(teamId, context, async (c, actor, team) => {
                const task = await taskInTeam(c, team, id, true);
                if (!manager(actor, team) && actor.id !== idString(task.id_criador)) throw ApiError.acessoNegado();
                if (task.status !== 'ABERTO') throw conflict('Só chamado aberto pode ser editado');
                await model.update(c, teamId, id, input);
                await record(c, id, actor, 'EDITADO', task.status, task.status, task.id_responsavel, context);
                return taskDto(await taskInTeam(c, team, id));
            });
        },
        async assign(teamId, id, input, context) {
            return mutate(teamId, context, async (c, actor, team) => {
                if (!manager(actor, team)) throw ApiError.acessoNegado();
                const task = await taskInTeam(c, team, id, true);
                if (task.status !== 'ABERTO') throw conflict('Atribuição exige chamado aberto');
                await eligibleMember(c, teamId, input.userId);
                if (task.id_responsavel != null && idString(task.id_responsavel) === input.userId) return taskDto(task);
                await model.update(c, teamId, id, { id_responsavel: input.userId });
                await record(c, id, actor, 'ATRIBUIDO', task.status, task.status, input.userId, context);
                return taskDto(await taskInTeam(c, team, id));
            });
        },
        async accept(teamId, id, context) {
            return mutate(teamId, context, async (c, actor, team) => {
                if (actor.tipo !== 'COLABORADOR') throw ApiError.acessoNegado();
                await eligibleMember(c, teamId, actor.id);
                const task = await taskInTeam(c, team, id, true);
                if (task.status !== 'ABERTO' || task.id_responsavel != null && idString(task.id_responsavel) !== actor.id) throw conflict('Chamado não está disponível para aceite');
                await model.update(c, teamId, id, { id_responsavel: actor.id, status: 'EM_ANDAMENTO' });
                await record(c, id, actor, 'ACEITO', 'ABERTO', 'EM_ANDAMENTO', actor.id, context);
                return taskDto(await taskInTeam(c, team, id));
            });
        },
        async resolve(teamId, id, context) {
            return mutate(teamId, context, async (c, actor, team) => {
                const task = await taskInTeam(c, team, id, true);
                if (actor.tipo !== 'COLABORADOR' || task.id_responsavel == null || actor.id !== idString(task.id_responsavel)) throw ApiError.acessoNegado();
                if (task.status !== 'EM_ANDAMENTO') throw conflict('Transição inválida');
                await model.update(c, teamId, id, { status: 'RESOLVIDO' });
                await record(c, id, actor, 'RESOLVIDO', 'EM_ANDAMENTO', 'RESOLVIDO', actor.id, context);
                return taskDto(await taskInTeam(c, team, id));
            });
        },
        async close(teamId, id, context) {
            return mutate(teamId, context, async (c, actor, team) => {
                const task = await taskInTeam(c, team, id, true);
                if (!manager(actor, team) && (task.id_responsavel == null || actor.id !== idString(task.id_responsavel))) throw ApiError.acessoNegado();
                if (task.status !== 'RESOLVIDO') throw conflict('Transição inválida');
                await model.update(c, teamId, id, { status: 'FECHADO', data_fechamento: new Date() });
                await record(c, id, actor, 'FECHADO', 'RESOLVIDO', 'FECHADO', task.id_responsavel, context);
                return taskDto(await taskInTeam(c, team, id));
            });
        },
        async cancel(teamId, id, context) {
            return mutate(teamId, context, async (c, actor, team) => {
                const task = await taskInTeam(c, team, id, true);
                if (!manager(actor, team) && actor.id !== idString(task.id_criador)) throw ApiError.acessoNegado();
                if (task.status !== 'ABERTO' || task.id_responsavel != null) throw conflict('Só chamado aberto e não atribuído pode ser cancelado');
                await model.update(c, teamId, id, { status: 'CANCELADO', data_fechamento: new Date() });
                await record(c, id, actor, 'CANCELADO', 'ABERTO', 'CANCELADO', null, context);
            });
        },
        async history(teamId, id, q, context) {
            const team = await access(undefined, teamId, readActor(context));
            await taskInTeam(undefined, team, id);
            return page(await model.history(teamId, id, q), q, eventDto, 'id_evento');
        }
    };
}
