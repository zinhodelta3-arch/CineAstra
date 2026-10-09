import { idString } from '../utils/dto.js';

const projection = 's.id_sessao,s.id_filme,s.id_sala,sa.id_local,s.data,s.horario_inicio,s.horario_fim,s.idioma,s.preco_inteira,s.status';
const joins = ' FROM sessoes s JOIN salas sa ON sa.id_sala = s.id_sala JOIN locais l ON l.id_local = sa.id_local JOIN filmes f ON f.id_filme = s.id_filme';
export function createSessionModel(database) {
    const rows = async (c, sql, args = []) => (await c.execute(sql, args))[0];
    const one = async (c, sql, args = []) => (await rows(c, sql, args))[0] ?? null;
    return {
        session: (id, c = database) => one(c, `SELECT ${projection}${joins} WHERE s.id_sessao = ?`, [id]),
        sessionForUpdate: (id, c) => one(c, 'SELECT id_sessao,id_filme,id_sala,data,horario_inicio,horario_fim,idioma,preco_inteira,status FROM sessoes WHERE id_sessao = ? FOR UPDATE', [id]),
        room: (id, c = database, lock = false) => lock
            ? one(c, 'SELECT id_sala,id_local,status AS sala_status,capacidade FROM salas WHERE id_sala = ? FOR UPDATE', [id])
            : one(c, 'SELECT sa.id_sala,sa.id_local,sa.status AS sala_status,sa.capacidade,l.status AS local_status FROM salas sa JOIN locais l ON l.id_local = sa.id_local WHERE sa.id_sala = ?', [id]),
        local: (id, c, lock = true) => one(c, `SELECT id_local,status FROM locais WHERE id_local = ?${lock ? ' FOR UPDATE' : ''}`, [id]),
        film: (id, c, lock = true) => one(c, `SELECT id_filme,status,disponivel_cinema,duracao FROM filmes WHERE id_filme = ?${lock ? ' FOR UPDATE' : ''}`, [id]),
        activeSeats: (roomId, c) => one(c, "SELECT COUNT(*) AS total FROM assentos WHERE id_sala = ? AND status = 'ATIVA'", [roomId]),
        hasItems: (id, c) => one(c, 'SELECT id_item FROM itens_pedido WHERE id_sessao = ? LIMIT 1', [id]),
        overlapCandidates(localId, startDate, endDate, excludeId, c) {
            return rows(c, `SELECT s.id_sessao,s.data,s.horario_inicio,s.horario_fim FROM sessoes s JOIN salas sa ON sa.id_sala = s.id_sala WHERE sa.id_local = ? AND s.data BETWEEN ? AND ? AND s.status <> 'CANCELADA'${excludeId ? ' AND s.id_sessao <> ?' : ''} ORDER BY s.data,s.horario_inicio,s.id_sessao`, [localId, startDate, endDate, ...(excludeId ? [excludeId] : [])]);
        },
        list(q, admin = false) {
            if (!Number.isInteger(q.limit) || q.limit < 1 || q.limit > 100) throw new TypeError('Limite inválido');
            const where = ['s.id_sessao > ?'], args = [q.cursor ?? '0'];
            if (q.localId) { where.push('sa.id_local = ?'); args.push(q.localId); }
            if (q.date) { where.push('s.data = ?'); args.push(q.date); }
            if (q.startFrom) { where.push('s.horario_inicio >= ?'); args.push(q.startFrom); }
            if (q.startUntil) { where.push('s.horario_inicio <= ?'); args.push(q.startUntil); }
            if (admin) { if (q.status) { where.push('s.status = ?'); args.push(q.status); } }
            else where.push("s.status IN ('AGENDADA','EM_CARTAZ')", "sa.status = 'ATIVA'", "l.status = 'ATIVO'", "f.status = 'ATIVO'", 'f.disponivel_cinema = TRUE');
            return rows(database, `SELECT ${projection}${joins} WHERE ${where.join(' AND ')} ORDER BY s.id_sessao LIMIT ${q.limit + 1}`, args);
        },
        publicSession: id => one(database, `SELECT ${projection}${joins} WHERE s.id_sessao = ? AND s.status IN ('AGENDADA','EM_CARTAZ') AND sa.status = 'ATIVA' AND l.status = 'ATIVO' AND f.status = 'ATIVO' AND f.disponivel_cinema = TRUE`, [id]),
        async insert(c, data) {
            const keys = ['id_filme','id_sala','data','horario_inicio','horario_fim','idioma','preco_inteira','status'];
            const [result] = await c.execute(`INSERT INTO sessoes (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`, keys.map(k => data[k]));
            return idString(result.insertId);
        },
        update(c, id, data) {
            const allowed = ['id_filme','data','horario_inicio','horario_fim','idioma','preco_inteira','status'];
            const keys = Object.keys(data);
            if (!keys.length || keys.some(k => !allowed.includes(k))) throw new TypeError('Campos inválidos');
            return c.execute(`UPDATE sessoes SET ${keys.map(k => `${k} = ?`).join(',')} WHERE id_sessao = ?`, [...keys.map(k => data[k]), id]);
        }
    };
}
