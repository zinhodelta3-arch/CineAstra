import { ApiError } from '../utils/ApiError.js';
import { idString } from '../utils/dto.js';

const found = row => { if (!row) throw ApiError.naoEncontrado(); return row; };
const conflict = message => new ApiError(message, 409, null, 'SUPPLIER_CONFLICT');
const adminDto = row => ({ id_fornecedor: idString(row.id_fornecedor), id_usuario: idString(row.id_usuario), razao_social: row.razao_social, nome_cine: row.nome_cine ?? null, cnpj: row.cnpj, status: row.status, data_cadastro: row.data_cadastro });
const selfDto = row => ({ id_fornecedor: idString(row.id_fornecedor), razao_social: row.razao_social, nome_cine: row.nome_cine ?? null, cnpj_ultimos4: row.cnpj.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(-4), status: row.status });
export function createSupplierService({ model, identity }) {
    async function admin(c, context) {
        if ((await identity.activeActor(c, context)).tipo_usuario !== 'ADMIN') throw ApiError.acessoNegado();
    }
    async function transact(context, action) {
        try { return await identity.transaction(async c => { await admin(c, context); return action(c); }, context); }
        catch (error) { if (error.code === 'ER_DUP_ENTRY') throw conflict('Conta ou CNPJ já vinculado a fornecedor'); throw error; }
    }
    async function eligibleUser(c, id) {
        const row = found(await model.user(id, c, true));
        if (row.tipo_usuario !== 'FORNECEDOR' || row.status !== 'ATIVO') throw conflict('Conta FORNECEDOR ativa obrigatória');
    }
    return {
        async list(q, context) {
            if (context.actor.tipo !== 'ADMIN') throw ApiError.acessoNegado();
            const rows = await model.list(q), items = rows.slice(0, q.limit);
            return { items: items.map(adminDto), pagination: { limit: q.limit, nextCursor: rows.length > q.limit ? idString(items.at(-1).id_fornecedor) : null } };
        },
        async get(id, context) {
            if (context.actor.tipo !== 'ADMIN') throw ApiError.acessoNegado();
            return adminDto(found(await model.supplier(id)));
        },
        async me(context) {
            if (context.actor.tipo !== 'FORNECEDOR') throw ApiError.acessoNegado();
            return selfDto(found(await model.byUser(context.actor.id)));
        },
        async create(input, context) {
            return transact(context, async c => {
                await eligibleUser(c, input.userId);
                if (await model.byUser(input.userId, c)) throw conflict('Conta já vinculada a fornecedor');
                const id = await model.create(c, input);
                await identity.audit(c, 'SUPPLIER.CREATED', id, context);
                return adminDto(found(await model.supplier(id, c)));
            });
        },
        async patch(id, input, context) {
            return transact(context, async c => {
                const supplier = found(await model.supplier(id, c, true));
                if (input.status === 'ATIVO') await eligibleUser(c, supplier.id_usuario);
                await model.update(c, id, input);
                await identity.audit(c, 'SUPPLIER.CHANGED', id, context);
                return adminDto(found(await model.supplier(id, c)));
            });
        },
        async archive(id, context) {
            return transact(context, async c => {
                const supplier = found(await model.supplier(id, c, true));
                if (supplier.status === 'INATIVO') return;
                await model.update(c, id, { status: 'INATIVO' });
                await identity.audit(c, 'SUPPLIER.ARCHIVED', id, context);
            });
        }
    };
}
