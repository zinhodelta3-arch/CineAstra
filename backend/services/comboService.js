import { ApiError } from '../utils/ApiError.js';
import { idString, moneyString } from '../utils/dto.js';

const found = row => { if (!row) throw ApiError.naoEncontrado(); return row; };
const conflict = message => new ApiError(message, 409, null, 'COMBO_CONFLICT');
const dto = (row, items) => ({ id_combo: idString(row.id_combo), id_local: row.id_local === null ? null : idString(row.id_local), nome: row.nome, descricao: row.descricao ?? null, preco: moneyString(row.preco), ativo: Boolean(row.ativo), data_cadastro: row.data_cadastro, items: items.map(i => ({ id_insumo: idString(i.id_insumo), nome: i.nome, quantidade: i.quantidade })) });
export function createComboService({ model, identity }) {
    async function admin(c, context) { if ((await identity.activeActor(c, context)).tipo_usuario !== 'ADMIN') throw ApiError.acessoNegado(); }
    async function transact(context, work) { return identity.transaction(async c => { await admin(c, context); return work(c); }, context); }
    async function validItems(c, localId, items) {
        const local = found(await model.local(localId, c, true));
        if (local.status !== 'ATIVO') throw conflict('Local indisponível');
        const ids = items.map(i => i.inputId);
        const rows = await model.inputs(ids, c, true);
        if (rows.length !== ids.length || rows.some(i => idString(i.id_local) !== idString(localId) || i.status !== 'DISPONIVEL' || i.fornecedor_status !== 'ATIVO' || i.usuario_status !== 'ATIVO' || i.tipo_usuario !== 'FORNECEDOR' || i.vinculo_status !== 'ATIVO')) throw conflict('Composição exige insumos disponíveis do mesmo local e fornecedor autorizado');
    }
    async function detail(id, c) { const combo = found(await model.combo(id, c)); return dto(combo, await model.items(id, c)); }
    return {
        async list(q) {
            const rows = await model.list(q), items = rows.slice(0, q.limit);
            return { items: await Promise.all(items.map(r => detail(r.id_combo))), pagination: { limit: q.limit, nextCursor: rows.length > q.limit ? idString(items.at(-1).id_combo) : null } };
        },
        async get(id) {
            const row = found(await model.combo(id));
            if (!row.ativo || row.id_local === null) throw ApiError.naoEncontrado();
            const visible = await model.list({ localId: idString(row.id_local), cursor: String(BigInt(id) - 1n), limit: 1 });
            if (!visible[0] || idString(visible[0].id_combo) !== idString(id)) throw ApiError.naoEncontrado();
            return detail(id);
        },
        async adminGet(id, context) { if (context.actor.tipo !== 'ADMIN') throw ApiError.acessoNegado(); return detail(id); },
        async create(input, context) {
            return transact(context, async c => {
                await validItems(c, input.localId, input.items);
                const id = await model.create(c, input);
                await model.replaceItems(c, id, input.items);
                await identity.audit(c, 'COMBO.CREATED', id, context);
                return detail(id, c);
            });
        },
        async patch(id, input, context) {
            return transact(context, async c => {
                const initial = found(await model.combo(id, c));
                if (initial.id_local === null) throw conflict('Combo legado sem local requer saneamento');
                await model.local(initial.id_local, c, true);
                const row = found(await model.combo(id, c, true));
                if (row.id_local !== initial.id_local) throw conflict('Local alterado');
                if (!row.ativo || await model.referenced(id, c)) throw conflict('Combo arquivado ou referenciado não pode ser alterado');
                await model.update(c, id, input);
                await identity.audit(c, 'COMBO.CHANGED', id, context);
                return detail(id, c);
            });
        },
        async replace(id, input, context) {
            return transact(context, async c => {
                const initial = found(await model.combo(id, c));
                if (initial.id_local === null) throw conflict('Combo legado sem local requer saneamento');
                await validItems(c, initial.id_local, input.items);
                const row = found(await model.combo(id, c, true));
                if (row.id_local !== initial.id_local) throw conflict('Local alterado');
                if (!row.ativo || await model.referenced(id, c)) throw conflict('Combo arquivado ou referenciado não pode ter composição alterada');
                await model.replaceItems(c, id, input.items);
                await identity.audit(c, 'COMBO.COMPOSITION_CHANGED', id, context);
                return detail(id, c);
            });
        },
        async archive(id, context) {
            return transact(context, async c => {
                const row = found(await model.combo(id, c, true));
                if (!row.ativo) return;
                await model.update(c, id, { ativo: 0 });
                await identity.audit(c, 'COMBO.ARCHIVED', id, context);
            });
        }
    };
}
