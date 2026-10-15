import { ApiError } from '../utils/ApiError.js';
import { idString, moneyString } from '../utils/dto.js';

const found = row => { if (!row) throw ApiError.naoEncontrado(); return row; };
const conflict = message => new ApiError(message, 409, null, 'PRODUCT_CONFLICT');
const key = type => type === 'inputs' ? 'id_insumo' : 'id_equipamento';
const productDto = (type, row) => ({ [key(type)]: idString(row[key(type)]), id_fornecedor: idString(row.id_fornecedor), id_local: idString(row.id_local), nome: row.nome, descricao: row.descricao ?? null, categoria: row.categoria ?? null, ...(type === 'inputs' ? { quantidade_minima: row.quantidade_minima, preco: moneyString(row.preco) } : { numero_patrimonio: row.numero_patrimonio ?? null }), quantidade: row.quantidade, status: row.status, data_cadastro: row.data_cadastro });
const grantDto = row => ({ id_fornecedor: idString(row.id_fornecedor), id_local: idString(row.id_local), status: row.status, criado_em: row.criado_em });
const page = (rows, q, dto, id) => { const items = rows.slice(0, q.limit); return { items: items.map(dto), pagination: { limit: q.limit, nextCursor: rows.length > q.limit ? idString(items.at(-1)[id]) : null } }; };
export function createProductService({ model, identity }) {
    function role(context) { if (!['ADMIN','FORNECEDOR'].includes(context.actor.tipo)) throw ApiError.acessoNegado(); return context.actor; }
    async function actor(c, context) { const row = await identity.activeActor(c, context); if (!['ADMIN','FORNECEDOR'].includes(row.tipo_usuario)) throw ApiError.acessoNegado(); return { id: idString(row.id_usuario), tipo: row.tipo_usuario }; }
    async function ownSupplier(c, userId) { const row = found(await model.supplierByUser(userId, c)); if (row.status !== 'ATIVO' || row.tipo_usuario !== 'FORNECEDOR' || row.usuario_status !== 'ATIVO') throw ApiError.acessoNegado(); return row; }
    async function allowedContext(c, supplierId, localId) {
        const supplier = found(await model.supplier(supplierId, c, true));
        if (supplier.status !== 'ATIVO' || supplier.tipo_usuario !== 'FORNECEDOR' || supplier.usuario_status !== 'ATIVO') throw conflict('Fornecedor indisponível');
        const local = found(await model.local(localId, c, true));
        if (local.status !== 'ATIVO') throw conflict('Local indisponível');
        const grant = await model.grant(supplierId, localId, c, true);
        if (grant?.status !== 'ATIVO') throw ApiError.acessoNegado();
        return supplier;
    }
    async function transaction(context, work) {
        try { return await identity.transaction(async c => work(c, await actor(c, context)), context); }
        catch (error) { if (error.code === 'ER_DUP_ENTRY') throw conflict('Patrimônio ou cadastro duplicado'); throw error; }
    }
    return {
        async list(type, q, context) {
            const u = role(context);
            let supplierId = null;
            if (u.tipo === 'FORNECEDOR') { if (q.supplierId) throw ApiError.acessoNegado(); supplierId = idString((await ownSupplier(undefined, u.id)).id_fornecedor); }
            return page(await model.list(type, q, supplierId), q, row => productDto(type, row), key(type));
        },
        async get(type, id, context) {
            const u = role(context), row = found(await model.product(type, id));
            if (u.tipo === 'FORNECEDOR' && idString((await ownSupplier(undefined, u.id)).id_fornecedor) !== idString(row.id_fornecedor)) throw ApiError.acessoNegado();
            return productDto(type, row);
        },
        async create(type, input, context) {
            return transaction(context, async (c, u) => {
                let supplierId;
                if (u.tipo === 'ADMIN') { if (!input.supplierId) throw ApiError.validacao('supplierId obrigatório para ADMIN'); supplierId = input.supplierId; }
                else { if (input.supplierId) throw ApiError.acessoNegado(); supplierId = idString((await ownSupplier(c, u.id)).id_fornecedor); }
                await allowedContext(c, supplierId, input.localId);
                const id = await model.create(type, c, { ...input, supplierId });
                await identity.audit(c, `PRODUCT.${type.toUpperCase()}.CREATED`, id, context);
                return productDto(type, found(await model.product(type, id, c)));
            });
        },
        async patch(type, id, input, context) {
            return transaction(context, async (c, u) => {
                const initial = found(await model.product(type, id, c));
                if (u.tipo === 'FORNECEDOR' && idString((await ownSupplier(c, u.id)).id_fornecedor) !== idString(initial.id_fornecedor)) throw ApiError.acessoNegado();
                if (u.tipo === 'FORNECEDOR' || input.status === 'DISPONIVEL') await allowedContext(c, initial.id_fornecedor, initial.id_local);
                const row = found(await model.product(type, id, c, true));
                if (idString(row.id_fornecedor) !== idString(initial.id_fornecedor) || idString(row.id_local) !== idString(initial.id_local)) throw conflict('Vínculo do item alterado');
                await model.update(type, c, id, input);
                await identity.audit(c, `PRODUCT.${type.toUpperCase()}.CHANGED`, id, context);
                return productDto(type, found(await model.product(type, id, c)));
            });
        },
        async archive(type, id, context) {
            return transaction(context, async (c, u) => {
                const initial = found(await model.product(type, id, c));
                if (u.tipo === 'FORNECEDOR') {
                    if (idString((await ownSupplier(c, u.id)).id_fornecedor) !== idString(initial.id_fornecedor)) throw ApiError.acessoNegado();
                    await allowedContext(c, initial.id_fornecedor, initial.id_local);
                }
                const row = found(await model.product(type, id, c, true));
                if (idString(row.id_fornecedor) !== idString(initial.id_fornecedor) || idString(row.id_local) !== idString(initial.id_local)) throw conflict('Vínculo do item alterado');
                if (row.status === 'INDISPONIVEL') return;
                await model.update(type, c, id, { status: 'INDISPONIVEL' });
                await identity.audit(c, `PRODUCT.${type.toUpperCase()}.ARCHIVED`, id, context);
            });
        },
        async grants(supplierId, q, context) {
            const u = role(context);
            if (u.tipo === 'FORNECEDOR' && idString((await ownSupplier(undefined, u.id)).id_fornecedor) !== supplierId) throw ApiError.acessoNegado();
            if (u.tipo === 'ADMIN') found(await model.supplier(supplierId));
            return page(await model.listGrants(supplierId, q), q, grantDto, 'id_local');
        },
        async myGrants(q, context) {
            if (context.actor.tipo !== 'FORNECEDOR') throw ApiError.acessoNegado();
            const supplierId = idString((await ownSupplier(undefined, context.actor.id)).id_fornecedor);
            return page(await model.listGrants(supplierId, q), q, grantDto, 'id_local');
        },
        async grant(supplierId, localId, context) {
            return transaction(context, async (c, u) => {
                if (u.tipo !== 'ADMIN') throw ApiError.acessoNegado();
                const supplier = found(await model.supplier(supplierId, c, true));
                if (supplier.status !== 'ATIVO' || supplier.tipo_usuario !== 'FORNECEDOR' || supplier.usuario_status !== 'ATIVO') throw conflict('Fornecedor indisponível');
                const local = found(await model.local(localId, c, true));
                if (local.status !== 'ATIVO') throw conflict('Local indisponível');
                await model.upsertGrant(c, supplierId, localId);
                await identity.audit(c, 'SUPPLIER.LOCAL_GRANTED', supplierId, context);
                return grantDto(found(await model.grant(supplierId, localId, c)));
            });
        },
        async revokeGrant(supplierId, localId, context) {
            return transaction(context, async (c, u) => {
                if (u.tipo !== 'ADMIN') throw ApiError.acessoNegado();
                const grant = found(await model.grant(supplierId, localId, c, true));
                if (grant.status === 'INATIVO') return;
                await model.archiveGrant(c, supplierId, localId);
                await identity.audit(c, 'SUPPLIER.LOCAL_REVOKED', supplierId, context);
            });
        }
    };
}
