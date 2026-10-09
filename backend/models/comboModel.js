import { idString } from '../utils/dto.js';

export function createComboModel(database) {
    const rows = async (c, sql, params = []) => (await c.execute(sql, params))[0];
    const one = async (c, sql, params = []) => (await rows(c, sql, params))[0] ?? null;
    return {
        local: (id, c = database, lock = false) => one(c, `SELECT id_local,status FROM locais WHERE id_local = ?${lock ? ' FOR UPDATE' : ''}`, [id]),
        combo: (id, c = database, lock = false) => one(c, `SELECT id_combo,id_local,nome,descricao,preco,ativo,data_cadastro FROM combos WHERE id_combo = ?${lock ? ' FOR UPDATE' : ''}`, [id]),
        inputs: (ids, c = database, lock = false) => rows(c, `SELECT i.id_insumo,i.id_local,i.id_fornecedor,i.nome,i.status,f.status AS fornecedor_status,fl.status AS vinculo_status FROM insumos i JOIN fornecedores f ON f.id_fornecedor = i.id_fornecedor LEFT JOIN fornecedor_locais fl ON fl.id_fornecedor = i.id_fornecedor AND fl.id_local = i.id_local WHERE i.id_insumo IN (${ids.map(() => '?').join(',')}) ORDER BY i.id_insumo${lock ? ' FOR UPDATE' : ''}`, ids),
        items: (id, c = database) => rows(c, 'SELECT ci.id_insumo,ci.quantidade,i.nome FROM combo_itens ci JOIN insumos i ON i.id_insumo = ci.id_insumo WHERE ci.id_combo = ? ORDER BY ci.id_insumo', [id]),
        referenced: async (id, c) => Boolean((await one(c, 'SELECT 1 AS found FROM itens_pedido WHERE id_combo = ? LIMIT 1', [id]))),
        async list(q) {
            return rows(database, `SELECT c.id_combo,c.id_local,c.nome,c.descricao,c.preco,c.ativo,c.data_cadastro FROM combos c JOIN locais l ON l.id_local = c.id_local WHERE c.id_local = ? AND c.id_combo > ? AND c.ativo = 1 AND l.status = 'ATIVO' AND EXISTS (SELECT 1 FROM combo_itens ci WHERE ci.id_combo = c.id_combo) AND NOT EXISTS (SELECT 1 FROM combo_itens ci JOIN insumos i ON i.id_insumo = ci.id_insumo JOIN fornecedores f ON f.id_fornecedor = i.id_fornecedor LEFT JOIN fornecedor_locais fl ON fl.id_fornecedor = i.id_fornecedor AND fl.id_local = i.id_local WHERE ci.id_combo = c.id_combo AND (i.id_local <> c.id_local OR i.status <> 'DISPONIVEL' OR f.status <> 'ATIVO' OR fl.status IS NULL OR fl.status <> 'ATIVO')) ORDER BY c.id_combo LIMIT ${q.limit + 1}`, [q.localId, q.cursor ?? '0']);
        },
        async create(c, input) { const [result] = await c.execute('INSERT INTO combos (id_local,nome,descricao,preco,ativo) VALUES (?,?,?,?,1)', [input.localId,input.nome,input.descricao ?? null,input.preco]); return idString(result.insertId); },
        update(c, id, input) { const keys = Object.keys(input); if (!keys.length || keys.some(k => !['nome','descricao','preco','ativo'].includes(k))) throw new TypeError('Campos inválidos'); return c.execute(`UPDATE combos SET ${keys.map(k => `${k} = ?`).join(',')} WHERE id_combo = ?`, [...keys.map(k => input[k]), id]); },
        async replaceItems(c, id, items) { await c.execute('DELETE FROM combo_itens WHERE id_combo = ?', [id]); for (const row of items) await c.execute('INSERT INTO combo_itens (id_combo,id_insumo,quantidade) VALUES (?,?,?)', [id,row.inputId,row.quantidade]); }
    };
}
