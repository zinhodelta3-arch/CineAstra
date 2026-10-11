import { ApiError } from '../utils/ApiError.js';
import { idString } from '../utils/dto.js';
import { createSeatOccupancyModel } from '../models/seatOccupancyModel.js';

const conflict = message => new ApiError(message, 409, null, 'SEAT_CONFLICT');
const found = row => { if (!row) throw ApiError.naoEncontrado(); return row; };
const same = (a,b) => idString(a) === idString(b);

// API interna: o checkout fornece a mesma conexao transacional do pedido/itens.
export function createSeatOccupancyService(model = createSeatOccupancyModel()) {
    return {
        async reserve(c, { orderId, sessionId, seatId }) {
            if (!c?.execute) throw new TypeError('Conexao transacional obrigatoria');
            orderId=idString(orderId); sessionId=idString(sessionId); seatId=idString(seatId);
            const order=found(await model.order(c,orderId));
            if (!['EM_ANDAMENTO','AGUARDANDO_PAGAMENTO'].includes(order.status)) throw conflict('Pedido nao aceita reserva');
            // Mesma ordem de locks do agendamento: local, sala, sessao, assento.
            const initial=found(await model.session(c,sessionId,false));
            const initialRoom=found(await model.room(c,initial.id_sala,false));
            const location=found(await model.location(c,initialRoom.id_local));
            const room=found(await model.room(c,initial.id_sala));
            const session=found(await model.session(c,sessionId));
            const seat=found(await model.seat(c,seatId));
            if (!same(session.id_sala,room.id_sala) || !same(seat.id_sala,room.id_sala) ||
                location.status!=='ATIVO' || room.status!=='ATIVA' || seat.status!=='ATIVA' ||
                !['AGENDADA','EM_CARTAZ'].includes(session.status)) throw conflict('Assento ou sessao indisponivel');
            await model.expire(c,sessionId,seatId);
            const existing=await model.occupancy(c,sessionId,seatId);
            if (existing) {
                if (same(existing.id_pedido,orderId) && existing.estado==='RESERVADA') return idString(existing.id_ocupacao);
                throw conflict('Assento ocupado');
            }
            try { return await model.reserve(c,orderId,sessionId,seatId,15); }
            catch (error) { if (error.code==='ER_DUP_ENTRY') throw conflict('Assento ocupado'); throw error; }
        },
        async confirm(c,{ orderId, sessionId, seatId, itemId }) {
            if (!c?.execute) throw new TypeError('Conexao transacional obrigatoria');
            orderId=idString(orderId); sessionId=idString(sessionId); seatId=idString(seatId); itemId=idString(itemId);
            const order=found(await model.order(c,orderId));
            if (!['PAGO','FINALIZADO'].includes(order.status)) throw conflict('Pedido ainda nao foi pago');
            const occupancy=found(await model.occupancy(c,sessionId,seatId));
            const item=found(await model.item(c,itemId));
            if (!same(occupancy.id_pedido,orderId) || !same(item.id_pedido,orderId) ||
                !same(item.id_sessao,sessionId) || !same(item.id_assento,seatId)) throw conflict('Item nao corresponde a reserva');
            if (occupancy.estado==='CONFIRMADA' && same(occupancy.id_item,itemId)) return idString(occupancy.id_ocupacao);
            if (occupancy.estado!=='RESERVADA' || !(await model.confirm(c,occupancy.id_ocupacao,itemId))) throw conflict('Reserva expirada');
            return idString(occupancy.id_ocupacao);
        },
        async releaseCancelled(c,{ orderId }) {
            if (!c?.execute) throw new TypeError('Conexao transacional obrigatoria');
            orderId=idString(orderId);
            const order=found(await model.order(c,orderId));
            if (order.status!=='CANCELADO') throw conflict('Pedido ainda nao foi cancelado');
            const occupied=await model.occupiedByOrder(c,orderId);
            for (const row of occupied) if (row.id_item && await model.liveTicket(c,row.id_item)) throw conflict('Ticket deve ser cancelado antes da liberacao');
            await model.release(c,orderId);
            return occupied.length;
        }
    };
}
