import { idString } from '../utils/dto.js';

const config = { inputs: { table: 'insumos', id: 'id_insumo' }, equipment: { table: 'equipamentos', id: 'id_equipamento' } };
const spec = kind => { if (!config[kind]) throw new TypeError('Item inválido'); return config[kind]; };
export function createInventoryModel(database) {
    const rows = async (c, sql, args = []) => (await c.execute(sql, args))[0];
    const one = async (c, sql, args = []) => (await rows(c, sql, args))[0] ?? null;
    return {
        item(kind, id, c = database, lock = false) { const s = spec(kind); return one(c, `SELECT ${s.id},id_fornecedor,id_local,quantidade${kind === 'inputs' ? ',quantidade_reservada,quantidade_minima' : ''},status FROM ${s.table} WHERE ${s.id} = ?${lock ? ' FOR UPDATE' : ''}`, [id]); },
        operational: (supplierId, localId, c = database) => one(c, 'SELECT f.id_fornecedor,f.id_usuario,f.status AS fornecedor_status,u.status AS usuario_status,u.tipo_usuario,l.status AS local_status,fl.status AS vinculo_status FROM fornecedores f JOIN usuarios u ON u.id_usuario = f.id_usuario JOIN locais l ON l.id_local = ? LEFT JOIN fornecedor_locais fl ON fl.id_fornecedor = f.id_fornecedor AND fl.id_local = l.id_local WHERE f.id_fornecedor = ?', [localId,supplierId]),
        supplierByUser: (userId, c = database) => one(c, 'SELECT id_fornecedor,status FROM fornecedores WHERE id_usuario = ?', [userId]),
        combo: (id, c, lock = false) => one(c, `SELECT id_combo,id_local,ativo FROM combos WHERE id_combo = ?${lock ? ' FOR UPDATE' : ''}`, [id]),
        comboItems: (id, c) => rows(c, 'SELECT id_insumo,quantidade FROM combo_itens WHERE id_combo = ? ORDER BY id_insumo', [id]),
        order: (id, c, lock = false) => one(c, `SELECT id_pedido,status FROM pedidos WHERE id_pedido = ?${lock ? ' FOR UPDATE' : ''}`, [id]),
        async inputs(ids, c) {
            const result = [];
            for (const id of [...ids].sort((a,b) => BigInt(a) < BigInt(b) ? -1 : BigInt(a) > BigInt(b) ? 1 : 0)) {
                const row = await one(c, 'SELECT id_insumo,id_fornecedor,id_local,quantidade,quantidade_reservada,quantidade_minima,status FROM insumos WHERE id_insumo = ? FOR UPDATE', [id]);
                if (row) result.push(row);
            }
            return result;
        },
        reservations: (orderId, c, lock = false) => rows(c, `SELECT id_reserva,id_pedido,id_insumo,quantidade,status FROM estoque_reservas WHERE id_pedido = ? ORDER BY id_insumo${lock ? ' FOR UPDATE' : ''}`, [orderId]),
        async insertReservation(c, orderId, inputId, count) { const [result] = await c.execute("INSERT INTO estoque_reservas (id_pedido,id_insumo,quantidade,status) VALUES (?,?,?,'ATIVA')", [orderId,inputId,count]); return idString(result.insertId); },
        setReservation: (c, reservationId, status) => { if (!['CONSUMIDA','LIBERADA','COMPENSADA'].includes(status)) throw new TypeError('Estado inválido'); return c.execute('UPDATE estoque_reservas SET status = ? WHERE id_reserva = ?', [status,reservationId]); },
        async changeInput(c, id, onHand, reserved) {
            const [result] = await c.execute('UPDATE insumos SET quantidade = quantidade + ?, quantidade_reservada = quantidade_reservada + ? WHERE id_insumo = ? AND quantidade + ? BETWEEN 0 AND 2147483647 AND quantidade_reservada + ? BETWEEN 0 AND 2147483647 AND quantidade + ? >= quantidade_reservada + ?', [onHand,reserved,id,onHand,reserved,onHand,reserved]);
            return result.affectedRows === 1;
        },
        async changeEquipment(c, id, delta) { const [result] = await c.execute('UPDATE equipamentos SET quantidade = quantidade + ? WHERE id_equipamento = ? AND quantidade + ? BETWEEN 0 AND 2147483647', [delta,id,delta]); return result.affectedRows === 1; },
        async insertMovement(c, data) {
            const [result] = await c.execute('INSERT INTO movimentacoes_estoque (id_insumo,id_equipamento,id_reserva,id_usuario,tipo,quantidade,motivo) VALUES (?,?,?,?,?,?,?)', [data.inputId ?? null,data.equipmentId ?? null,data.reservationId ?? null,data.actorId,data.tipo,data.quantidade,data.motivo ?? null]);
            return idString(result.insertId);
        },
        movement: (id, c = database) => one(c, 'SELECT id_movimentacao,id_insumo,id_equipamento,id_reserva,id_usuario,tipo,quantidade,motivo,data_movimentacao FROM movimentacoes_estoque WHERE id_movimentacao = ?', [id]),
        listMovements(q, supplierId = null) {
            if (!Number.isInteger(q.limit) || q.limit < 1 || q.limit > 100) throw new TypeError('Limite inválido');
            const where = ['m.id_movimentacao > ?'], args = [q.cursor ?? '0'];
            if (q.inputId) { where.push('m.id_insumo = ?'); args.push(q.inputId); }
            if (q.equipmentId) { where.push('m.id_equipamento = ?'); args.push(q.equipmentId); }
            if (q.localId) { where.push('COALESCE(i.id_local,e.id_local) = ?'); args.push(q.localId); }
            if (supplierId) { where.push('COALESCE(i.id_fornecedor,e.id_fornecedor) = ?'); args.push(supplierId); }
            return rows(database, `SELECT m.id_movimentacao,m.id_insumo,m.id_equipamento,m.id_reserva,m.id_usuario,m.tipo,m.quantidade,m.motivo,m.data_movimentacao FROM movimentacoes_estoque m LEFT JOIN insumos i ON i.id_insumo = m.id_insumo LEFT JOIN equipamentos e ON e.id_equipamento = m.id_equipamento WHERE ${where.join(' AND ')} ORDER BY m.id_movimentacao LIMIT ${q.limit + 1}`, args);
        },
        alerts(q, supplierId = null) {
            if (!Number.isInteger(q.limit) || q.limit < 1 || q.limit > 100) throw new TypeError('Limite inválido');
            const args = [q.localId,q.cursor ?? '0'], supplier = supplierId ? ' AND i.id_fornecedor = ?' : '';
            if (supplierId) args.push(supplierId);
            return rows(database, `SELECT i.id_insumo,i.id_fornecedor,i.id_local,i.quantidade,i.quantidade_reservada,i.quantidade_minima FROM insumos i WHERE i.id_local = ? AND i.id_insumo > ? AND i.status = 'DISPONIVEL' AND i.quantidade - i.quantidade_reservada <= i.quantidade_minima${supplier} ORDER BY i.id_insumo LIMIT ${q.limit + 1}`, args);
        }
    };
}
