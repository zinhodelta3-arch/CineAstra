import { ApiError } from '../utils/ApiError.js';
import { idString, moneyString } from '../utils/dto.js';
import { filmFields } from '../models/catalogModel.js';

export function filmDto(row, admin = false) {
    const out = { id_filme: idString(row.id_filme) };
    for (const key of [...filmFields, 'imagem', ...(admin ? ['url_reproducao'] : [])]) out[key] = row[key] ?? null;
    for (const key of ['disponivel_cinema', 'disponivel_streaming']) out[key] = Boolean(row[key]);
    for (const key of ['preco_aluguel', 'preco_compra']) if (out[key] !== null) out[key] = moneyString(out[key]);
    return out;
}
const genreDto = row => ({ id_genero: idString(row.id_genero), nome: row.nome, status: row.status });
export function createCatalogService({ model, identity, mediaHosts = [] }) {
    const { transaction, activeActor, audit } = identity;
    const found = row => { if (!row) throw ApiError.naoEncontrado(); return row; };
    async function admin(c, context) { if ((await activeActor(c, context)).tipo_usuario !== 'ADMIN') throw ApiError.acessoNegado(); }
    function validateFilm(row, input) {
        if (row.status === 'ATIVO' && (!Number.isInteger(row.duracao) || row.duracao <= 0)) throw ApiError.validacao('Filme ativo exige duração positiva');
        if (row.disponivel_streaming && row.preco_aluguel == null && row.preco_compra == null) throw ApiError.validacao('Streaming exige preço de aluguel ou compra');
        if (row.preco_aluguel != null && (!Number.isInteger(row.dias_acesso_aluguel) || row.dias_acesso_aluguel <= 0)) throw ApiError.validacao('Aluguel exige prazo positivo');
        for (const key of ['trailer', 'url_reproducao']) if (input[key] != null && !mediaHosts.includes(new URL(input[key]).hostname.toLowerCase())) throw ApiError.validacao('Host de mídia não permitido', [{ field: key, code: 'MEDIA_HOST_DENIED' }]);
    }
    function page(rows, q, dto, pk) { const limit = q.limit ?? 20; return { items: rows.slice(0, limit).map(dto), pagination: { limit, nextCursor: rows.length > limit ? idString(rows[limit - 1][pk]) : null } }; }
    return {
        async listFilms(q, isAdmin) { return page(await model.listFilms(q, isAdmin), q, r => filmDto(r, isAdmin), 'id_filme'); },
        async film(id, isAdmin) { return filmDto(found(await model.film(id, isAdmin)), isAdmin); },
        async listGenres(q, isAdmin, filmId) {
            if (filmId) found(await model.film(filmId, isAdmin));
            return page(await model.listGenres(q, isAdmin, filmId), q, genreDto, 'id_genero');
        },
        async genre(id, isAdmin) { return genreDto(found(await model.genre(id, isAdmin))); },
        async saveFilm(id, input, context) {
            return transaction(async c => {
                await admin(c, context);
                const previous = id ? found(await model.film(id, true, c, true)) : {};
                validateFilm({ ...previous, ...input }, input);
                if (id) await model.patchFilm(c, id, input); else id = await model.createFilm(c, input);
                await audit(c, 'CATALOG.FILM_CHANGED', id, context);
                return filmDto(await model.film(id, true, c), true);
            }, context);
        },
        async saveGenre(id, input, context) {
            return transaction(async c => {
                await admin(c, context);
                if (id) { found(await model.genre(id, true, c, true)); await model.patchGenre(c, id, input); }
                else id = await model.createGenre(c, input);
                await audit(c, 'CATALOG.GENRE_CHANGED', id, context);
                return genreDto(await model.genre(id, true, c));
            }, context);
        },
        async archive(kind, id, context) {
            return transaction(async c => {
                await admin(c, context);
                if (kind === 'film') { found(await model.film(id, true, c, true)); await model.patchFilm(c, id, { status: 'INATIVO' }); }
                else { found(await model.genre(id, true, c, true)); await model.patchGenre(c, id, { status: 'INATIVO' }); }
                await audit(c, kind === 'film' ? 'CATALOG.FILM_ARCHIVED' : 'CATALOG.GENRE_ARCHIVED', id, context);
            }, context);
        },
        async associate(filmId, genreId, remove, context) {
            return transaction(async c => {
                await admin(c, context);
                const film = found(await model.film(filmId, true, c, true));
                const genre = found(await model.genre(genreId, true, c, true));
                if (!remove && (film.status !== 'ATIVO' || genre.status !== 'ATIVO')) throw new ApiError('Associação exige filme e gênero ativos', 409, null, 'CATALOG_INACTIVE');
                if (remove) await model.unlink(c, filmId, genreId); else await model.link(c, filmId, genreId);
                await audit(c, remove ? 'CATALOG.GENRE_UNLINKED' : 'CATALOG.GENRE_LINKED', filmId, context);
                return { id_filme: filmId, id_genero: genreId };
            }, context);
        }
    };
}
