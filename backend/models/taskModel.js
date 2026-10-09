import { idString } from '../utils/dto.js';

const fields = 'id_chamado,id_criador,id_responsavel,id_sessao,id_equipe,titulo,descricao,prioridade,status,data_abertura,data_fechamento';
const eventFields = 'id_evento,id_chamado,id_ator,acao,status_anterior,status_novo,id_responsavel,criado_em';
export function createTaskModel(database) {
    const rows = async (c, sql, params = []) => (await c.execute(sql, params))[0];
    const one = async (c, sql, params = []) => (await rows(c, sql, params))[0] ?? null;
    return {
        team: (id, c = database, lock = false) => one(c, `SELECT e.id_equipe,e.id_supervisor,e.id_sessao,e.status,s.status AS sessao_status FROM equipes e JOIN sessoes s ON s.id_sessao = e.id_sessao WHERE e.id_equipe = ?${lock ? ' FOR UPDATE' : ''}`, [id]),
        membership: (teamId, userId, c = database) => one(c, 'SELECT m.id_equipe_membro,m.status,u.tipo_usuario,u.status AS usuario_status,m.funcao FROM equipe_membros m JOIN usuarios u ON u.id_usuario = m.id_usuario WHERE m.id_equipe = ? AND m.id_usuario = ?', [teamId, userId]),
        task: (teamId, id, c = database, lock = false) => one(c, `SELECT ${fields} FROM chamados WHERE id_equipe = ? AND id_chamado = ?${lock ? ' FOR UPDATE' : ''}`, [teamId, id]),
        list(teamId, sessionId, q, actorId) {
            if (!Number.isInteger(q.limit) || q.limit < 1 || q.limit > 100) throw new TypeError('Limite inválido');
            const where = ['id_equipe = ?', 'id_sessao = ?', 'id_chamado > ?'], args = [teamId, sessionId, q.cursor ?? '0'];
            if (q.status) { where.push('status = ?'); args.push(q.status); }
            if (q.assigned === 'me') { where.push('id_responsavel = ?'); args.push(actorId); }
            return rows(database, `SELECT ${fields} FROM chamados WHERE ${where.join(' AND ')} ORDER BY id_chamado LIMIT ${q.limit + 1}`, args);
        },
        async create(c, input) {
            const [result] = await c.execute("INSERT INTO chamados (id_criador,id_responsavel,id_sessao,id_equipe,titulo,descricao,prioridade,status) VALUES (?,NULL,?,?,?,?,?,'ABERTO')", [input.actorId, input.sessionId, input.teamId, input.titulo, input.descricao ?? null, input.prioridade ?? 'MEDIA']);
            return idString(result.insertId);
        },
        update(c, teamId, id, data) {
            const keys = Object.keys(data);
            if (!keys.length || keys.some(k => !['titulo','descricao','prioridade','id_responsavel','status','data_fechamento'].includes(k))) throw new TypeError('Campos inválidos');
            return c.execute(`UPDATE chamados SET ${keys.map(k => `${k} = ?`).join(',')} WHERE id_equipe = ? AND id_chamado = ?`, [...keys.map(k => data[k]), teamId, id]);
        },
        async event(c, input) {
            const [result] = await c.execute('INSERT INTO chamado_eventos (id_chamado,id_ator,acao,status_anterior,status_novo,id_responsavel) VALUES (?,?,?,?,?,?)', [input.taskId, input.actorId, input.action, input.before ?? null, input.after, input.responsibleId ?? null]);
            return idString(result.insertId);
        },
        history(teamId, taskId, q) {
            if (!Number.isInteger(q.limit) || q.limit < 1 || q.limit > 100) throw new TypeError('Limite inválido');
            return rows(database, `SELECT ${eventFields} FROM chamado_eventos WHERE id_chamado = ? AND id_evento > ? ORDER BY id_evento LIMIT ${q.limit + 1}`, [taskId, q.cursor ?? '0']);
        }
    };
}
