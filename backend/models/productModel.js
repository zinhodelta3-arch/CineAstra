import { idString } from '../utils/dto.js';

const config = {
    inputs: { table: 'insumos', id: 'id_insumo', fields: 'id_insumo,id_fornecedor,id_local,nome,descricao,categoria,quantidade,quantidade_minima,preco,status,data_cadastro', editable: ['nome','descricao','categoria','quantidade_minima','preco','status'] },
    equipment: { table: 'equipamentos', id: 'id_equipamento', fields: 'id_equipamento,id_fornecedor,id_local,nome,descricao,categoria,numero_patrimonio,quantidade,status,data_cadastro', editable: ['nome','descricao','categoria','numero_patrimonio','status'] }
};
const spec = type => { if (!config[type]) throw new TypeError('Produto inválido'); return config[type]; };
export function createProductModel(database) {
    const rows = async (c, sql, params = []) => (await c.execute(sql, params))[0];
    const one = async (c, sql, params = []) => (await rows(c, sql, params))[0] ?? null;
    return {
        supplier: (id, c = database, lock = false) => one(c, `SELECT f.id_fornecedor,f.id_usuario,f.status,u.tipo_usuario,u.status AS usuario_status FROM fornecedores f JOIN usuarios u ON u.id_usuario = f.id_usuario WHERE f.id_fornecedor = ?${lock ? ' FOR UPDATE' : ''}`, [id]),
        supplierByUser: (id, c = database) => one(c, 'SELECT f.id_fornecedor,f.id_usuario,f.status,u.tipo_usuario,u.status AS usuario_status FROM fornecedores f JOIN usuarios u ON u.id_usuario = f.id_usuario WHERE f.id_usuario = ?', [id]),
        local: (id, c = database, lock = false) => one(c, `SELECT id_local,status FROM locais WHERE id_local = ?${lock ? ' FOR UPDATE' : ''}`, [id]),
        grant: (supplierId, localId, c = database, lock = false) => one(c, `SELECT id_fornecedor,id_local,status,criado_em FROM fornecedor_locais WHERE id_fornecedor = ? AND id_local = ?${lock ? ' FOR UPDATE' : ''}`, [supplierId, localId]),
        listGrants(supplierId, q) {
            if (!Number.isInteger(q.limit) || q.limit < 1 || q.limit > 100) throw new TypeError('Limite inválido');
            const where = ['id_fornecedor = ?', 'id_local > ?'], args = [supplierId, q.cursor ?? '0'];
            if (q.status) { where.push('status = ?'); args.push(q.status); }
            return rows(database, `SELECT id_fornecedor,id_local,status,criado_em FROM fornecedor_locais WHERE ${where.join(' AND ')} ORDER BY id_local LIMIT ${q.limit + 1}`, args);
        },
        upsertGrant: (c, supplierId, localId) => c.execute("INSERT INTO fornecedor_locais (id_fornecedor,id_local,status) VALUES (?,?,'ATIVO') ON DUPLICATE KEY UPDATE status = 'ATIVO'", [supplierId, localId]),
        archiveGrant: (c, supplierId, localId) => c.execute("UPDATE fornecedor_locais SET status = 'INATIVO' WHERE id_fornecedor = ? AND id_local = ?", [supplierId, localId]),
        product: (type, id, c = database, lock = false) => { const s = spec(type); return one(c, `SELECT ${s.fields} FROM ${s.table} WHERE ${s.id} = ?${lock ? ' FOR UPDATE' : ''}`, [id]); },
        list(type, q, supplierId = null) {
            const s = spec(type);
            if (!Number.isInteger(q.limit) || q.limit < 1 || q.limit > 100) throw new TypeError('Limite inválido');
            const where = [`${s.id} > ?`], args = [q.cursor ?? '0'];
            if (supplierId || q.supplierId) { where.push('id_fornecedor = ?'); args.push(supplierId ?? q.supplierId); }
            if (q.localId) { where.push('id_local = ?'); args.push(q.localId); }
            if (q.status) { where.push('status = ?'); args.push(q.status); }
            return rows(database, `SELECT ${s.fields} FROM ${s.table} WHERE ${where.join(' AND ')} ORDER BY ${s.id} LIMIT ${q.limit + 1}`, args);
        },
        async create(type, c, input) {
            const s = spec(type);
            let sql, args;
            if (type === 'inputs') {
                sql = "INSERT INTO insumos (id_fornecedor,id_local,nome,descricao,categoria,quantidade,quantidade_minima,preco,status) VALUES (?,?,?,?,?,0,?,?,'DISPONIVEL')";
                args = [input.supplierId,input.localId,input.nome,input.descricao ?? null,input.categoria ?? null,input.quantidade_minima ?? 0,input.preco];
            } else {
                sql = "INSERT INTO equipamentos (id_fornecedor,id_local,nome,descricao,categoria,numero_patrimonio,quantidade,status) VALUES (?,?,?,?,?,?,0,'DISPONIVEL')";
                args = [input.supplierId,input.localId,input.nome,input.descricao ?? null,input.categoria ?? null,input.numero_patrimonio ?? null];
            }
            const [result] = await c.execute(sql, args); return idString(result.insertId);
        },
        update(type, c, id, input) {
            const s = spec(type), keys = Object.keys(input);
            if (!keys.length || keys.some(k => !s.editable.includes(k))) throw new TypeError('Campos inválidos');
            return c.execute(`UPDATE ${s.table} SET ${keys.map(k => `${k} = ?`).join(',')} WHERE ${s.id} = ?`, [...keys.map(k => input[k]), id]);
        }
    };
}
