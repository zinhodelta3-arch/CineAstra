import { idString } from '../utils/dto.js';

const fields = 'id_notificacao,id_usuario,titulo,mensagem,tipo,lida,data_envio';
export function createNotificationModel(database) {
    const rows = async (c, sql, params = []) => (await c.execute(sql, params))[0];
    const one = async (c, sql, params = []) => (await rows(c, sql, params))[0] ?? null;
    return {
        list(userId, q) {
            if (!Number.isInteger(q.limit) || q.limit < 1 || q.limit > 100) throw new TypeError('Limite inválido');
            const where = ['id_usuario = ?', 'id_notificacao > ?'], args = [userId, q.cursor ?? '0'];
            if (q.unread !== undefined) { where.push('lida = ?'); args.push(q.unread ? 0 : 1); }
            if (q.type) { where.push('tipo = ?'); args.push(q.type); }
            return rows(database, `SELECT ${fields} FROM notificacoes WHERE ${where.join(' AND ')} ORDER BY id_notificacao LIMIT ${q.limit + 1}`, args);
        },
        own: (c, userId, id) => one(c, `SELECT ${fields} FROM notificacoes WHERE id_usuario = ? AND id_notificacao = ?`, [userId, id]),
        async emit(c, input) {
            await c.execute('INSERT INTO notificacoes (id_usuario,titulo,mensagem,tipo,dedupe_key,lida) VALUES (?,?,?,?,?,FALSE) ON DUPLICATE KEY UPDATE id_notificacao = id_notificacao', [input.recipientId, input.title, input.message, input.type, input.dedupeKey]);
            const row = await one(c, `SELECT ${fields} FROM notificacoes WHERE id_usuario = ? AND dedupe_key = ?`, [input.recipientId, input.dedupeKey]);
            if (!row) throw new Error('Notificação não persistida');
            return row;
        },
        async markRead(c, userId, id) {
            await c.execute('UPDATE notificacoes SET lida = TRUE WHERE id_usuario = ? AND id_notificacao = ? AND lida = FALSE', [userId, id]);
            return this.own(c, userId, id);
        }
    };
}
