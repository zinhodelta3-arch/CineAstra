import { ApiError } from '../utils/ApiError.js';
import { idString, moneyString } from '../utils/dto.js';

const HOUR = 3_600_000, DAY = 24 * HOUR;
const found = value => { if (!value) throw ApiError.naoEncontrado(); return value; };
const conflict = message => new ApiError(message, 409, null, 'SESSION_CONFLICT');
const dateMs = date => Date.parse(`${date}T00:00:00Z`);
const timeMs = time => { const [h, m, s] = time.split(':').map(Number); return (h * 3600 + m * 60 + s) * 1000; };
const day = ms => new Date(ms).toISOString().slice(0, 10);
export function interval(row) {
    const start = dateMs(row.data) + timeMs(row.horario_inicio);
    let end = dateMs(row.data) + timeMs(row.horario_fim);
    if (row.horario_fim === row.horario_inicio) throw ApiError.validacao('Início e fim não podem ser iguais');
    if (end < start) end += DAY;
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || end - start >= DAY) throw ApiError.validacao('Intervalo de sessão inválido');
    return { start, end };
}
export function sessionDto(row) {
    const { end } = interval(row);
    return { id_sessao: idString(row.id_sessao), id_filme: idString(row.id_filme), id_sala: idString(row.id_sala), id_local: idString(row.id_local),
        data: row.data, data_fim: day(end), horario_inicio: row.horario_inicio, horario_fim: row.horario_fim,
        idioma: row.idioma, preco_inteira: moneyString(row.preco_inteira), status: row.status };
}
export function createSessionService({ model, identity }) {
    async function admin(c, context) { if ((await identity.activeActor(c, context)).tipo_usuario !== 'ADMIN') throw ApiError.acessoNegado(); }
    async function lockedRoom(c, roomId, expectedLocalId) {
        const local = found(await model.local(expectedLocalId, c, true));
        const room = found(await model.room(roomId, c, true));
        if (idString(room.id_local) !== idString(local.id_local)) throw conflict('Sala mudou de local');
        return { local, room };
    }
    async function playable(c, row, local, room) {
        if (local.status !== 'ATIVO' || room.sala_status !== 'ATIVA') throw conflict('Local ou sala indisponível');
        if (Number((await model.activeSeats(room.id_sala, c))?.total ?? 0) !== room.capacidade) throw conflict('Capacidade da sala inconsistente');
        const film = found(await model.film(row.id_filme, c, true));
        if (film.status !== 'ATIVO' || !film.disponivel_cinema || !Number.isInteger(film.duracao) || film.duracao <= 0) throw conflict('Filme indisponível para cinema');
        const span = interval(row);
        if (span.end - span.start < Number(film.duracao) * 60_000) throw ApiError.validacao('Sessão menor que a duração do filme');
        return span;
    }
    async function noOverlap(c, localId, row, excludeId) {
        const current = interval(row);
        const candidates = await model.overlapCandidates(localId, day(dateMs(row.data) - 2 * DAY), day(dateMs(row.data) + 2 * DAY), excludeId, c);
        for (const other of candidates) {
            const occupied = interval(other);
            if (current.start < occupied.end + HOUR && occupied.start < current.end + HOUR) throw conflict('Intervalo mínimo de uma hora entre sessões no mesmo local');
        }
    }
    async function mutate(operation, context) { return identity.transaction(async c => { await admin(c, context); return operation(c); }, context); }
    return {
        async list(q, isAdmin = false) {
            const rows = await model.list(q, isAdmin), items = rows.slice(0, q.limit);
            return { items: items.map(sessionDto), pagination: { limit: q.limit, nextCursor: rows.length > q.limit ? idString(items.at(-1).id_sessao) : null } };
        },
        async get(id, isAdmin = false) { return sessionDto(found(isAdmin ? await model.session(id) : await model.publicSession(id))); },
        async create(input, context) {
            const initial = found(await model.room(input.id_sala));
            return mutate(async c => {
                const { local, room } = await lockedRoom(c, input.id_sala, initial.id_local);
                const row = { ...input, status: 'AGENDADA' };
                await playable(c, row, local, room);
                await noOverlap(c, local.id_local, row);
                const id = await model.insert(c, row);
                await identity.audit(c, 'SESSION.CREATED', id, context);
                return sessionDto(found(await model.session(id, c)));
            }, context);
        },
        async patch(id, input, context) {
            const initial = found(await model.session(id));
            if (input.status && Object.keys(input).length > 1) throw ApiError.validacao('Status deve ser alterado separadamente');
            return mutate(async c => {
                const { local, room } = await lockedRoom(c, initial.id_sala, initial.id_local);
                const previous = found(await model.sessionForUpdate(id, c));
                if (idString(previous.id_sala) !== idString(room.id_sala)) throw conflict('Sala da sessão mudou');
                const items = Boolean(await model.hasItems(id, c));
                if (input.status) {
                    const next = input.status;
                    const allowed = { AGENDADA: ['EM_CARTAZ', 'CANCELADA'], EM_CARTAZ: ['ENCERRADA', 'CANCELADA'], ENCERRADA: [], CANCELADA: [] };
                    if (!allowed[previous.status]?.includes(next)) throw conflict('Transição de sessão inválida');
                    if (next === 'CANCELADA' && items) throw conflict('Sessão com itens de pedido não pode ser cancelada');
                } else {
                    if (previous.status !== 'AGENDADA') throw conflict('Somente sessão agendada pode ser editada');
                    if (items) throw conflict('Sessão com itens de pedido não pode alterar direitos');
                    const proposed = { ...previous, ...input };
                    await playable(c, proposed, local, room);
                    if (['data','horario_inicio','horario_fim'].some(k => Object.hasOwn(input, k))) await noOverlap(c, local.id_local, proposed, id);
                }
                await model.update(c, id, input);
                await identity.audit(c, 'SESSION.CHANGED', id, context);
                return sessionDto(found(await model.session(id, c)));
            }, context);
        },
        async cancel(id, context) {
            const initial = found(await model.session(id));
            return mutate(async c => {
                const { room } = await lockedRoom(c, initial.id_sala, initial.id_local);
                const previous = found(await model.sessionForUpdate(id, c));
                if (idString(previous.id_sala) !== idString(room.id_sala)) throw conflict('Sala da sessão mudou');
                if (previous.status === 'CANCELADA') return;
                if (!['AGENDADA', 'EM_CARTAZ'].includes(previous.status) || await model.hasItems(id, c)) throw conflict('Sessão não pode ser cancelada');
                await model.update(c, id, { status: 'CANCELADA' });
                await identity.audit(c, 'SESSION.CANCELLED', id, context);
            }, context);
        }
    };
}
