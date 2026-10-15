import { idString } from '../utils/dto.js';

const one = async (c, sql, args) => (await c.execute(sql, args))[0][0] ?? null;

export function createSeatOccupancyModel() {
    return {
        order: (c, id) => one(c, 'SELECT id_pedido,status FROM pedidos WHERE id_pedido=? FOR UPDATE', [id]),
        session: (c, id, lock=true) => one(c, `SELECT id_sessao,id_sala,status FROM sessoes WHERE id_sessao=?${lock?' FOR UPDATE':''}`, [id]),
        room: (c, id, lock=true) => one(c, `SELECT id_sala,id_local,status FROM salas WHERE id_sala=?${lock?' FOR UPDATE':''}`, [id]),
        location: (c, id) => one(c, 'SELECT id_local,status FROM locais WHERE id_local=? FOR UPDATE', [id]),
        seat: (c, id) => one(c, 'SELECT id_assento,id_sala,status FROM assentos WHERE id_assento=? FOR UPDATE', [id]),
        async occupancy(c, sessionId, seatId) {
            return one(c, 'SELECT id_ocupacao,id_pedido,id_item,estado,expira_em FROM assento_ocupacoes WHERE id_sessao=? AND id_assento=? FOR UPDATE', [sessionId,seatId]);
        },
        async expire(c, sessionId, seatId) {
            await c.execute("DELETE FROM assento_ocupacoes WHERE id_sessao=? AND id_assento=? AND estado='RESERVADA' AND expira_em<=UTC_TIMESTAMP(3)", [sessionId,seatId]);
        },
        async reserve(c, orderId, sessionId, seatId, ttlMinutes) {
            const [r] = await c.execute("INSERT INTO assento_ocupacoes(id_pedido,id_sessao,id_assento,estado,expira_em) VALUES(?,?,?,'RESERVADA',DATE_ADD(UTC_TIMESTAMP(3),INTERVAL ? MINUTE))", [orderId,sessionId,seatId,ttlMinutes]);
            return idString(r.insertId);
        },
        item: (c, itemId) => one(c, 'SELECT id_item,id_pedido,id_sessao,id_assento FROM itens_pedido WHERE id_item=? FOR UPDATE', [itemId]),
        async confirm(c, occupationId, itemId) {
            const [r] = await c.execute("UPDATE assento_ocupacoes SET estado='CONFIRMADA',id_item=?,expira_em=NULL WHERE id_ocupacao=? AND estado='RESERVADA' AND expira_em>UTC_TIMESTAMP(3)", [itemId,occupationId]);
            return r.affectedRows === 1;
        },
        async occupiedByOrder(c, orderId) {
            return (await c.execute('SELECT id_ocupacao,id_item,estado FROM assento_ocupacoes WHERE id_pedido=? ORDER BY id_sessao,id_assento FOR UPDATE', [orderId]))[0];
        },
        liveTicket: (c, itemId) => one(c, "SELECT id_ticket FROM tickets WHERE id_item=? AND status IN ('GERADO','UTILIZADO') LIMIT 1", [itemId]),
        async release(c, orderId) { await c.execute('DELETE FROM assento_ocupacoes WHERE id_pedido=?', [orderId]); }
    };
}
