import { ApiError } from '../utils/ApiError.js';
import { idString } from '../utils/dto.js';

const fields = {
    local: ['nome', 'cep', 'logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'estado', 'telefone', 'status'],
    room: ['id_local', 'nome', 'capacidade', 'tipo', 'status'],
    seat: ['id_sala', 'fileira', 'numero', 'tipo', 'status']
};
const pk = { local: 'id_local', room: 'id_sala', seat: 'id_assento' };
const found = value => { if (!value) throw ApiError.naoEncontrado(); return value; };
const conflict = message => new ApiError(message, 409, null, 'VENUE_CONFLICT');
const total = row => Number(row?.total ?? 0);
export function venueDto(kind, row) {
    const dto = { [pk[kind]]: idString(row[pk[kind]]) };
    for (const key of fields[kind]) dto[key] = key.startsWith('id_') ? idString(row[key]) : row[key] ?? null;
    if (kind === 'seat') dto.acessivel = ['PCD', 'OBESO', 'IDOSO'].includes(dto.tipo);
    return dto;
}
export function createVenueService({ model, identity }) {
    async function admin(c, context) { if ((await identity.activeActor(c, context)).tipo_usuario !== 'ADMIN') throw ApiError.acessoNegado(); }
    async function local(id, c, lock) { return found(await model.local(id, c, lock)); }
    async function room(localId, id, c, lock) { return found(await model.room(localId, id, c, lock)); }
    async function seat(roomId, id, c, lock) { return found(await model.seat(roomId, id, c, lock)); }
    function visible(row, kind) { if (row.status !== (kind === 'local' ? 'ATIVO' : 'ATIVA')) throw ApiError.naoEncontrado(); return row; }
    async function context(kind, ids, adminRead = false, c, lock = false) {
        const place = ids.localId ? await local(ids.localId, c, lock) : null;
        if (place && !adminRead) visible(place, 'local');
        const hall = kind !== 'local' && ids.roomId ? await room(ids.localId, ids.roomId, c, lock) : null;
        if (hall && !adminRead) visible(hall, 'room');
        const chair = kind === 'seat' && ids.seatId ? await seat(ids.roomId, ids.seatId, c, lock) : null;
        if (chair && !adminRead) visible(chair, 'seat');
        return { place, hall, chair };
    }
    async function safeMutation(operation, contextValue) {
        try { return await identity.transaction(async c => { await admin(c, contextValue); return operation(c); }, contextValue); }
        catch (error) {
            if (error.code === 'ER_DUP_ENTRY') throw conflict('Nome ou assento já existe neste contexto');
            throw error;
        }
    }
    function page(kind, rows, q) { const items = rows.slice(0, q.limit); return { items: items.map(r => venueDto(kind, r)), pagination: { limit: q.limit, nextCursor: rows.length > q.limit ? idString(items.at(-1)[pk[kind]]) : null } }; }
    async function requireMutableRoom(c, roomId) { if (await model.roomSessions(c, roomId)) throw conflict('Sala com sessões vinculadas não admite alteração estrutural'); }
    return {
        async list(kind, ids, q, adminRead = false) {
            if (kind !== 'local') await context(kind, ids, adminRead);
            const parentId = kind === 'room' ? ids.localId : kind === 'seat' ? ids.roomId : null;
            return page(kind, await model.list(kind, parentId, q, adminRead), q);
        },
        async get(kind, ids, adminRead = false) {
            const { place, hall, chair } = await context(kind, ids, adminRead);
            return venueDto(kind, kind === 'local' ? place : kind === 'room' ? hall : chair);
        },
        async save(kind, ids, input, contextValue) {
            return safeMutation(async c => {
                const { place, hall, chair } = await context(kind, ids, true, c, true);
                const previous = kind === 'local' ? place : kind === 'room' ? hall : chair;
                const id = kind === 'local' ? ids.localId : kind === 'room' ? ids.roomId : ids.seatId;
                if (kind === 'local') {
                    if (id && await model.localSessions(c, id) && Object.keys(input).some(k => k !== 'telefone')) throw conflict('Local com sessões vinculadas não admite alteração estrutural');
                    if (id && input.status && input.status !== 'ATIVO' && total(await model.activeRooms(c, id)) > 0) throw conflict('Desative as salas antes do local');
                } else if (kind === 'room') {
                    if (id) await requireMutableRoom(c, id);
                    const next = { ...previous, ...input };
                    if (next.status === 'ATIVA') {
                        if (place.status !== 'ATIVO') throw conflict('Local inativo ou em manutenção');
                        if (!id) throw conflict('Cadastre os assentos antes de ativar a sala');
                        if (total(await model.activeSeats(c, id)) !== next.capacidade) throw conflict('Capacidade deve corresponder aos assentos ativos');
                    }
                } else {
                    await requireMutableRoom(c, ids.roomId);
                    const nextStatus = input.status ?? previous?.status ?? 'ATIVA';
                    if (hall.status === 'ATIVA' && id && nextStatus !== previous.status) throw conflict('Desative a sala antes de alterar assentos ativos');
                    if (nextStatus === 'ATIVA' && (!id || previous.status !== 'ATIVA') && total(await model.activeSeats(c, ids.roomId)) >= hall.capacidade) throw conflict('Capacidade da sala excedida');
                }
                const parentId = kind === 'room' ? ids.localId : kind === 'seat' ? ids.roomId : null;
                const key = id ? (await model.update(kind, c, id, input), id) : await model.insert(kind, c, parentId, input);
                await identity.audit(c, `VENUE.${kind.toUpperCase()}_${id ? 'CHANGED' : 'CREATED'}`, key, contextValue);
                const row = kind === 'local' ? await local(key, c) : kind === 'room' ? await room(ids.localId, key, c) : await seat(ids.roomId, key, c);
                return venueDto(kind, row);
            }, contextValue);
        },
        async archive(kind, ids, contextValue) {
            return safeMutation(async c => {
                const { place, hall } = await context(kind, ids, true, c, true);
                const key = kind === 'local' ? ids.localId : kind === 'room' ? ids.roomId : ids.seatId;
                if (kind === 'local') {
                    if (await model.localSessions(c, key)) throw conflict('Local com sessões vinculadas não pode ser arquivado');
                    if (total(await model.activeRooms(c, key)) > 0) throw conflict('Desative as salas antes do local');
                } else if (kind === 'room') await requireMutableRoom(c, key);
                else {
                    await requireMutableRoom(c, ids.roomId);
                    if (hall.status === 'ATIVA') throw conflict('Desative a sala antes de arquivar assentos');
                }
                await model.update(kind, c, key, { status: kind === 'local' ? 'INATIVO' : 'INATIVA' });
                await identity.audit(c, `VENUE.${kind.toUpperCase()}_ARCHIVED`, key, contextValue);
            }, contextValue);
        }
    };
}
