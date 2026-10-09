import { idString } from '../utils/dto.js';
const columns = 'i.id_imagem,i.id_filme,i.tipo,i.url,i.texto_alternativo,i.ordem,i.principal';
export function createFilmGalleryModel(database) {
    const one = async (c, sql, args) => (await c.execute(sql, args))[0][0] ?? null;
    return {
        lockFilm: (c, id) => one(c, 'SELECT id_filme,status FROM filmes WHERE id_filme = ? FOR UPDATE', [id]),
        film: (id, admin) => one(database, `SELECT id_filme FROM filmes WHERE id_filme = ?${admin ? '' : " AND status = 'ATIVO'"}`, [id]),
        image: (c, filmId, id) => one(c, `SELECT ${columns} FROM filmes_imagens i WHERE i.id_filme = ? AND i.id_imagem = ?`, [filmId, id]),
        async list(id, q, admin) {
            if (!Number.isInteger(q.limit) || q.limit < 1 || q.limit > 100) throw new TypeError('Limite inválido');
            const [order, imageId] = q.cursor && q.cursor !== '0' ? q.cursor.split(':') : ['0', '0'];
            const args = [id, order, order, imageId];
            if (q.tipo) args.push(q.tipo);
            return (await database.execute(`SELECT ${columns} FROM filmes_imagens i JOIN filmes f ON f.id_filme = i.id_filme WHERE i.id_filme = ? AND (i.ordem > ? OR (i.ordem = ? AND i.id_imagem > ?))${q.tipo ? ' AND i.tipo = ?' : ''}${admin ? '' : " AND f.status = 'ATIVO'"} ORDER BY i.ordem,i.id_imagem LIMIT ${q.limit + 1}`, args))[0];
        },
        clearPrincipal: (c, id, tipo) => c.execute('UPDATE filmes_imagens SET principal = FALSE WHERE id_filme = ? AND tipo = ? AND principal = TRUE', [id, tipo]),
        async insert(c, id, data) {
            const [r] = await c.execute('INSERT INTO filmes_imagens (id_filme,tipo,url,texto_alternativo,ordem,principal) VALUES (?,?,?,?,?,?)', [id, data.tipo, data.url, data.texto_alternativo ?? null, data.ordem, data.principal]); return idString(r.insertId);
        },
        async patch(c, filmId, id, data) {
            const keys = Object.keys(data);
            if (!keys.length || keys.some(k => !['tipo', 'texto_alternativo', 'ordem', 'principal'].includes(k))) throw new TypeError('Campos inválidos');
            await c.execute(`UPDATE filmes_imagens SET ${keys.map(k => `${k} = ?`).join(',')} WHERE id_filme = ? AND id_imagem = ?`, [...keys.map(k => data[k]), filmId, id]);
        },
        remove: (c, filmId, id) => c.execute('DELETE FROM filmes_imagens WHERE id_filme = ? AND id_imagem = ?', [filmId, id]),
        // Coluna legada tem 255 bytes: URLs internas curtas; legado longo fica sem projeção legada.
        syncCover: (c, id) => c.execute("UPDATE filmes SET imagem = (SELECT CASE WHEN CHAR_LENGTH(url) <= 255 THEN url ELSE NULL END FROM filmes_imagens WHERE id_filme = ? AND tipo = 'CAPA' AND principal = TRUE LIMIT 1) WHERE id_filme = ?", [id, id]),
        reference: (c, url) => one(c, 'SELECT id_imagem FROM filmes_imagens WHERE url = ? LIMIT 1', [url]),
        publicReference: url => one(database, "SELECT i.id_imagem FROM filmes_imagens i JOIN filmes f ON f.id_filme = i.id_filme WHERE i.url = ? AND f.status = 'ATIVO' LIMIT 1", [url])
    };
}
