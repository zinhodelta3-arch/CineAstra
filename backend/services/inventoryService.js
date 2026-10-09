import { ApiError } from '../utils/ApiError.js';
import { idString } from '../utils/dto.js';

const found = row => { if (!row) throw ApiError.naoEncontrado(); return row; };
const conflict = message => new ApiError(message, 409, null, 'INVENTORY_CONFLICT');
const sortIds = (a,b) => BigInt(a) < BigInt(b) ? -1 : BigInt(a) > BigInt(b) ? 1 : 0;
const kindOf = input => input.inputId ? 'inputs' : 'equipment';
const itemId = input => input.inputId ?? input.equipmentId;
const balanceDto = (kind, row) => ({ [kind === 'inputs' ? 'id_insumo' : 'id_equipamento']: idString(row[kind === 'inputs' ? 'id_insumo' : 'id_equipamento']), id_fornecedor: idString(row.id_fornecedor), id_local: idString(row.id_local), quantidade: row.quantidade, quantidade_reservada: kind === 'inputs' ? row.quantidade_reservada : 0, disponivel: row.quantidade - (kind === 'inputs' ? row.quantidade_reservada : 0), ...(kind === 'inputs' ? { quantidade_minima: row.quantidade_minima, alerta_reposicao: row.quantidade - row.quantidade_reservada <= row.quantidade_minima } : {}), status: row.status });
const movementDto = row => ({ id_movimentacao: idString(row.id_movimentacao), id_insumo: row.id_insumo === null ? null : idString(row.id_insumo), id_equipamento: row.id_equipamento === null ? null : idString(row.id_equipamento), id_reserva: row.id_reserva === null ? null : idString(row.id_reserva), id_usuario: idString(row.id_usuario), tipo: row.tipo, quantidade: row.quantidade, motivo: row.motivo ?? null, data_movimentacao: row.data_movimentacao });
const positive = value => Number.isInteger(value) && value > 0 && value <= 2147483647;
export function createInventoryService({ model, identity }) {
    async function active(c, context) { const row = await identity.activeActor(c, context); if (!['ADMIN','FORNECEDOR'].includes(row.tipo_usuario)) throw ApiError.acessoNegado(); return { id: idString(row.id_usuario), role: row.tipo_usuario }; }
    async function ownSupplier(c, actor) { const row = found(await model.supplierByUser(actor.id, c)); if (row.status !== 'ATIVO') throw ApiError.acessoNegado(); return idString(row.id_fornecedor); }
    async function scope(c, row, actor) {
        if (actor.role === 'ADMIN') return;
        const operation = found(await model.operational(row.id_fornecedor, row.id_local, c));
        if (idString(operation.id_usuario) !== actor.id || operation.fornecedor_status !== 'ATIVO' || operation.usuario_status !== 'ATIVO' || operation.tipo_usuario !== 'FORNECEDOR' || operation.local_status !== 'ATIVO' || operation.vinculo_status !== 'ATIVO') throw ApiError.acessoNegado();
    }
    async function lockedInputs(c, ids) {
        const rows = await model.inputs(ids, c);
        if (rows.length !== ids.length) throw ApiError.naoEncontrado();
        return rows;
    }
    async function change(c, kind, id, onHand, reserved = 0) {
        const ok = kind === 'inputs' ? await model.changeInput(c,id,onHand,reserved) : await model.changeEquipment(c,id,onHand);
        if (!ok) throw conflict('Saldo insuficiente ou fora do limite');
    }
    async function expand(c, localId, lines) {
        if (!Array.isArray(lines) || !lines.length || lines.length > 100) throw ApiError.validacao('Itens inválidos');
        const totals = new Map();
        const comboIds = [...new Set(lines.filter(x => x.comboId).map(x => idString(x.comboId)))].sort(sortIds);
        const combos = new Map();
        for (const id of comboIds) {
            const combo = found(await model.combo(id,c,true));
            if (!combo.ativo || idString(combo.id_local) !== idString(localId)) throw conflict('Combo indisponível no local');
            const parts = await model.comboItems(id,c);
            if (!parts.length) throw conflict('Combo sem composição');
            combos.set(id, parts);
        }
        for (const line of lines) {
            if (!positive(line.quantidade) || Boolean(line.inputId) === Boolean(line.comboId)) throw ApiError.validacao('Item ou quantidade inválida');
            const parts = line.inputId ? [{ id_insumo: line.inputId, quantidade: 1 }] : combos.get(idString(line.comboId));
            for (const part of parts) {
                const id = idString(part.id_insumo), count = BigInt(part.quantidade) * BigInt(line.quantidade);
                const sum = (totals.get(id) ?? 0n) + count;
                if (sum > 2147483647n || sum <= 0n) throw ApiError.validacao('Quantidade excede limite');
                totals.set(id, sum);
            }
        }
        return [...totals].sort((a,b) => sortIds(a[0],b[0])).map(([id,count]) => ({ id, count: Number(count) }));
    }
    return {
        async balance(kind, id, context) {
            if (!['inputs','equipment'].includes(kind)) throw ApiError.validacao('Tipo inválido');
            const actor = { id: idString(context.actor.id), role: context.actor.tipo };
            if (!['ADMIN','FORNECEDOR'].includes(actor.role)) throw ApiError.acessoNegado();
            const row = found(await model.item(kind,id)); await scope(undefined,row,actor);
            return balanceDto(kind,row);
        },
        async listMovements(q, context) {
            const actor = { id: idString(context.actor.id), role: context.actor.tipo };
            if (!['ADMIN','FORNECEDOR'].includes(actor.role)) throw ApiError.acessoNegado();
            const supplierId = actor.role === 'FORNECEDOR' ? await ownSupplier(undefined,actor) : null;
            const rows = await model.listMovements(q,supplierId), items = rows.slice(0,q.limit);
            return { items: items.map(movementDto), pagination: { limit: q.limit, nextCursor: rows.length > q.limit ? idString(items.at(-1).id_movimentacao) : null } };
        },
        async alerts(q, context) {
            const actor = { id: idString(context.actor.id), role: context.actor.tipo };
            if (!['ADMIN','FORNECEDOR'].includes(actor.role)) throw ApiError.acessoNegado();
            const supplierId = actor.role === 'FORNECEDOR' ? await ownSupplier(undefined,actor) : null;
            const rows = await model.alerts(q,supplierId), items = rows.slice(0,q.limit);
            return { items: items.map(row => balanceDto('inputs',{ ...row,status: 'DISPONIVEL' })), pagination: { limit: q.limit, nextCursor: rows.length > q.limit ? idString(items.at(-1).id_insumo) : null } };
        },
        async move(input, context) {
            if (Boolean(input.inputId) === Boolean(input.equipmentId)) throw ApiError.validacao('Exatamente um item é obrigatório');
            const kind = kindOf(input), id = idString(itemId(input));
            return identity.transaction(async c => {
                const actor = await active(c,context), row = found(await model.item(kind,id,c,true));
                await scope(c,row,actor);
                const qty = input.quantidade;
                if ((['ENTRADA','DEVOLUCAO'].includes(input.tipo) && qty <= 0) || (['SAIDA','PERDA'].includes(input.tipo) && qty >= 0) || !Number.isInteger(qty) || qty === 0 || Math.abs(qty) > 2147483647) throw ApiError.validacao('Sinal da quantidade incompatível com o tipo');
                if (kind === 'inputs' && qty < 0 && row.quantidade - row.quantidade_reservada < -qty) throw conflict('Saldo disponível insuficiente');
                if (row.status === 'INDISPONIVEL' && actor.role !== 'ADMIN') throw conflict('Item indisponível');
                await change(c,kind,id,qty);
                const movementId = await model.insertMovement(c,{ inputId: input.inputId, equipmentId: input.equipmentId, actorId: actor.id, tipo: input.tipo, quantidade: qty, motivo: input.motivo });
                await identity.audit(c,'INVENTORY.MOVED',movementId,context);
                return { movement: movementDto(found(await model.movement(movementId,c))), balance: balanceDto(kind,found(await model.item(kind,id,c))) };
            },context);
        },
        // API interna do checkout: o chamador cria pedido e linhas na MESMA transação/conexão.
        async reserve(c,{ orderId, localId, lines }) {
            if (!c?.execute) throw new TypeError('Conexão transacional obrigatória');
            orderId = idString(orderId); localId = idString(localId);
            const order = found(await model.order(orderId,c,true));
            if (!['EM_ANDAMENTO','AGUARDANDO_PAGAMENTO'].includes(order.status)) throw conflict('Pedido não aceita reserva');
            const desired = await expand(c,localId,lines);
            const ids = desired.map(x => x.id), inputs = await lockedInputs(c,ids);
            const existing = await model.reservations(orderId,c,true);
            if (existing.length) {
                if (existing.length === desired.length && existing.every((r,i) => idString(r.id_insumo) === desired[i].id && r.quantidade === desired[i].count && r.status === 'ATIVA')) return existing.map(r => idString(r.id_reserva));
                throw conflict('Reserva do pedido já existe com outro conteúdo ou estado');
            }
            for (const [index,row] of inputs.entries()) {
                if (idString(row.id_insumo) !== desired[index].id || idString(row.id_local) !== idString(localId) || row.status !== 'DISPONIVEL') throw conflict('Insumo indisponível no local');
                const operational = found(await model.operational(row.id_fornecedor,row.id_local,c));
                if (operational.fornecedor_status !== 'ATIVO' || operational.usuario_status !== 'ATIVO' || operational.tipo_usuario !== 'FORNECEDOR' || operational.local_status !== 'ATIVO' || operational.vinculo_status !== 'ATIVO') throw conflict('Fornecedor/local indisponível');
                if (row.quantidade - row.quantidade_reservada < desired[index].count) throw conflict('Saldo disponível insuficiente');
            }
            const result = [];
            for (const part of desired) { const id = await model.insertReservation(c,orderId,part.id,part.count); await change(c,'inputs',part.id,0,part.count); result.push(id); }
            return result;
        },
        async transition(c,{ orderId, actorId, action }) {
            if (!c?.execute || !['CONSUMIR','LIBERAR','COMPENSAR'].includes(action)) throw new TypeError('Transição inválida');
            orderId = idString(orderId);
            if (action !== 'LIBERAR') actorId = idString(actorId);
            found(await model.order(orderId,c,true));
            const before = await model.reservations(orderId,c);
            if (!before.length) throw ApiError.naoEncontrado();
            const ids = before.map(r => idString(r.id_insumo)).sort(sortIds);
            await lockedInputs(c,ids);
            const rows = await model.reservations(orderId,c,true);
            const from = action === 'COMPENSAR' ? 'CONSUMIDA' : 'ATIVA';
            const to = { CONSUMIR:'CONSUMIDA', LIBERAR:'LIBERADA', COMPENSAR:'COMPENSADA' }[action];
            if (rows.every(r => r.status === to)) return;
            if (rows.length !== before.length || rows.some(r => r.status !== from)) throw conflict('Estado de reserva incompatível');
            for (const row of rows) {
                const id = idString(row.id_insumo), count = row.quantidade;
                if (action === 'CONSUMIR') { await change(c,'inputs',id,-count,-count); await model.insertMovement(c,{ inputId:id,reservationId:idString(row.id_reserva),actorId:idString(actorId),tipo:'SAIDA',quantidade:-count,motivo:`PEDIDO:${orderId}` }); }
                else if (action === 'LIBERAR') await change(c,'inputs',id,0,-count);
                else { await change(c,'inputs',id,count,0); await model.insertMovement(c,{ inputId:id,reservationId:idString(row.id_reserva),actorId:idString(actorId),tipo:'DEVOLUCAO',quantidade:count,motivo:`COMPENSACAO_PEDIDO:${orderId}` }); }
                await model.setReservation(c,idString(row.id_reserva),to);
            }
        }
    };
}
