import { z } from 'zod';
import { ApiError } from '../utils/ApiError.js';

export const catalogId = z.string().regex(/^[1-9]\d{0,9}$/).refine(v => BigInt(v) <= 4294967295n);
const date = z.string().regex(/^[1-9]\d{3}-\d{2}-\d{2}$/).refine(v => Number.isFinite(Date.parse(`${v}T00:00:00Z`)) && new Date(`${v}T00:00:00Z`).toISOString().slice(0, 10) === v);
const url = max => z.string().max(max).url().refine(v => { try { const u = new URL(v); return u.protocol === 'https:' && !u.username && !u.password && !u.hash && (!u.port || u.port === '443'); } catch { return false; } }).nullable();
const price = z.string().regex(/^(0|[1-9]\d{0,7})\.\d{2}$/).nullable();
const film = z.object({
    titulo: z.string().trim().min(1).max(200), descricao: z.string().max(10000).nullable().optional(),
    duracao: z.number().int().min(1).max(2147483647), classificacao: z.enum(['L', '10', '12', '14', '16', '18']).default('L'),
    data_lancamento: date.nullable().optional(), diretor: z.string().trim().min(1).max(150).nullable().optional(),
    trailer: url(255).optional(), url_reproducao: url(2048).optional(),
    disponivel_cinema: z.boolean().default(true), disponivel_streaming: z.boolean().default(false),
    preco_aluguel: price.optional(), preco_compra: price.optional(), dias_acesso_aluguel: z.number().int().min(1).max(36500).default(3),
    status: z.enum(['ATIVO', 'INATIVO']).default('ATIVO')
}).strict();
const paging = { limit: z.string().regex(/^\d{1,3}$/).transform(Number).pipe(z.number().int().min(1).max(100)).default(20), cursor: catalogId.optional() };
const query = z.object({ ...paging, titulo: z.string().trim().min(1).max(200).optional(), genreId: catalogId.optional(),
    classificacao: z.enum(['L', '10', '12', '14', '16', '18']).optional(),
    cinema: z.enum(['true', 'false']).transform(v => v === 'true').optional(), streaming: z.enum(['true', 'false']).transform(v => v === 'true').optional()
}).strict();
export const catalogSchemas = {
    film, filmPatch: film.omit({ classificacao: true, disponivel_cinema: true, disponivel_streaming: true, dias_acesso_aluguel: true, status: true }).partial().extend({
        classificacao: z.enum(['L', '10', '12', '14', '16', '18']).optional(), disponivel_cinema: z.boolean().optional(), disponivel_streaming: z.boolean().optional(),
        dias_acesso_aluguel: z.number().int().min(1).max(36500).optional(), status: z.enum(['ATIVO', 'INATIVO']).optional()
    }).refine(v => Object.keys(v).length > 0),
    genre: z.object({ nome: z.string().trim().min(1).max(100), status: z.enum(['ATIVO', 'INATIVO']).default('ATIVO') }).strict(),
    genrePatch: z.object({ nome: z.string().trim().min(1).max(100).optional(), status: z.enum(['ATIVO', 'INATIVO']).optional() }).strict().refine(v => Object.keys(v).length > 0),
    link: z.object({ genreId: catalogId }).strict(), query, adminQuery: query.extend({ status: z.enum(['ATIVO', 'INATIVO']).optional() }),
    genreQuery: z.object(paging).strict(), adminGenreQuery: z.object({ ...paging, status: z.enum(['ATIVO', 'INATIVO']).optional() }).strict()
};
export function catalogQuery(schema) {
    return (req, res, next) => { const parsed = schema.safeParse(req.query); if (!parsed.success) throw ApiError.validacao('Filtros ou paginação inválidos'); req.catalogQuery = parsed.data; next(); };
}
export function catalogParams(req, res, next) {
    if (Object.values(req.params).some(value => !catalogId.safeParse(value).success)) throw ApiError.validacao('Identificador inválido'); next();
}
