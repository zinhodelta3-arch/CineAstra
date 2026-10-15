import { idString } from '../utils/dto.js';

const columns = {
    local: 'id_local,nome,cep,logradouro,numero,complemento,bairro,cidade,estado,telefone,status',
    room: 'id_sala,id_local,nome,capacidade,tipo,status',
    seat: 'id_assento,id_sala,fileira,numero,tipo,status'
};
const table = { local: 'locais', room: 'salas', seat: 'assentos' };
const pk = { local: 'id_local', room: 'id_sala', seat: 'id_assento' };
const parent = { room: 'id_local', seat: 'id_sala' };
const writable = { local: ['nome', 'cep', 'logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'estado', 'telefone', 'status'],
    room: ['nome', 'capacidade', 'tipo', 'status'], seat: ['fileira', 'numero', 'tipo', 'status'] };
export function createVenueModel(database) {
    const rows = async (c, sql, params = []) => (await c.execute(sql, params))[0];
    const one = async (c, sql, params = []) => (await rows(c, sql, params))[0] ?? null;
    return {
        local: (id, c = database, lock = false) => one(c, `SELECT ${columns.local} FROM locais WHERE id_local = ?${lock ? ' FOR UPDATE' : ''}`, [id]),
        room: (localId, id, c = database, lock = false) => one(c, `SELECT ${columns.room} FROM salas WHERE id_local = ? AND id_sala = ?${lock ? ' FOR UPDATE' : ''}`, [localId, id]),
        seat: (roomId, id, c = database, lock = false) => one(c, `SELECT ${columns.seat} FROM assentos WHERE id_sala = ? AND id_assento = ?${lock ? ' FOR UPDATE' : ''}`, [roomId, id]),
        list(kind, parentId, q, admin = false) {
            if (!Number.isInteger(q.limit) || q.limit < 1 || q.limit > 100) throw new TypeError('Limite inválido');
            const filters = [`${pk[kind]} > ?`], args = [q.cursor ?? '0'];
            if (parentId) { filters.push(`${parent[kind]} = ?`); args.push(parentId); }
            if (!admin || q.status) { filters.push('status = ?'); args.push(q.status ?? (kind === 'local' ? 'ATIVO' : 'ATIVA')); }
            if (kind === 'seat' && q.accessible !== undefined) { filters.push(`tipo ${q.accessible ? 'IN' : 'NOT IN'} ('PCD','OBESO','IDOSO')`); }
            return rows(database, `SELECT ${columns[kind]} FROM ${table[kind]} WHERE ${filters.join(' AND ')} ORDER BY ${pk[kind]} LIMIT ${q.limit + 1}`, args);
        },
        async insert(kind, c, parentId, input) {
            const keys = [...(parentId ? [parent[kind]] : []), ...Object.keys(input)];
            if (Object.keys(input).some(k => !writable[kind].includes(k))) throw new TypeError('Campo inválido');
            const [result] = await c.execute(`INSERT INTO ${table[kind]} (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`, [...(parentId ? [parentId] : []), ...Object.values(input)]);
            return idString(result.insertId);
        },
        async update(kind, c, id, input) {
            const keys = Object.keys(input);
            if (!keys.length || keys.some(k => !writable[kind].includes(k))) throw new TypeError('Campo inválido');
            await c.execute(`UPDATE ${table[kind]} SET ${keys.map(k => `${k} = ?`).join(',')} WHERE ${pk[kind]} = ?`, [...keys.map(k => input[k]), id]);
        },
        activeSeats: (c, roomId) => one(c, "SELECT COUNT(*) AS total FROM assentos WHERE id_sala = ? AND status = 'ATIVA'", [roomId]),
        activeRooms: (c, localId) => one(c, "SELECT COUNT(*) AS total FROM salas WHERE id_local = ? AND status = 'ATIVA'", [localId]),
        roomSessions: (c, roomId) => one(c, 'SELECT id_sessao FROM sessoes WHERE id_sala = ? LIMIT 1', [roomId]),
        localSessions: (c, localId) => one(c, 'SELECT s.id_sessao FROM sessoes s JOIN salas sa ON sa.id_sala = s.id_sala WHERE sa.id_local = ? LIMIT 1', [localId])
    };
}
