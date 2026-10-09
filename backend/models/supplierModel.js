import { idString } from '../utils/dto.js';

const fields = 'id_fornecedor,id_usuario,razao_social,nome_cine,cnpj,status,data_cadastro';
export function createSupplierModel(database) {
    const rows = async (c, sql, params = []) => (await c.execute(sql, params))[0];
    const one = async (c, sql, params = []) => (await rows(c, sql, params))[0] ?? null;
    return {
        supplier: (id, c = database, lock = false) => one(c, `SELECT ${fields} FROM fornecedores WHERE id_fornecedor = ?${lock ? ' FOR UPDATE' : ''}`, [id]),
        byUser: (userId, c = database) => one(c, `SELECT ${fields} FROM fornecedores WHERE id_usuario = ?`, [userId]),
        user: (id, c, lock = false) => one(c, `SELECT id_usuario,tipo_usuario,status FROM usuarios WHERE id_usuario = ?${lock ? ' FOR UPDATE' : ''}`, [id]),
        list(q) {
            if (!Number.isInteger(q.limit) || q.limit < 1 || q.limit > 100) throw new TypeError('Limite inválido');
            const where = ['id_fornecedor > ?'], args = [q.cursor ?? '0'];
            if (q.status) { where.push('status = ?'); args.push(q.status); }
            return rows(database, `SELECT ${fields} FROM fornecedores WHERE ${where.join(' AND ')} ORDER BY id_fornecedor LIMIT ${q.limit + 1}`, args);
        },
        async create(c, input) {
            const [result] = await c.execute("INSERT INTO fornecedores (id_usuario,razao_social,nome_cine,cnpj,status) VALUES (?,?,?,?,'ATIVO')", [input.userId, input.razao_social, input.nome_cine ?? null, input.cnpj]);
            return idString(result.insertId);
        },
        update(c, id, data) {
            const keys = Object.keys(data);
            if (!keys.length || keys.some(k => !['razao_social','nome_cine','cnpj','status'].includes(k))) throw new TypeError('Campos inválidos');
            return c.execute(`UPDATE fornecedores SET ${keys.map(k => `${k} = ?`).join(',')} WHERE id_fornecedor = ?`, [...keys.map(k => data[k]), id]);
        }
    };
}
