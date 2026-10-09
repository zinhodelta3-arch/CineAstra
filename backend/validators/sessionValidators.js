import { z } from 'zod';
import { catalogId } from './catalogValidators.js';
import { ApiError } from '../utils/ApiError.js';

const date = z.string().regex(/^[1-9]\d{3}-\d{2}-\d{2}$/).refine(v => {
    const ms = Date.parse(`${v}T00:00:00Z`);
    return Number.isFinite(ms) && new Date(ms).toISOString().slice(0, 10) === v && v >= '1000-01-03' && v <= '9998-12-29';
});
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/).transform(v => v.length === 5 ? `${v}:00` : v);
const price = z.string().regex(/^(0|[1-9]\d{0,7})\.\d{2}$/);
const language = z.enum(['DUBLADO', 'LEGENDADO', 'ORIGINAL']);
const state = z.enum(['AGENDADA', 'EM_CARTAZ', 'ENCERRADA', 'CANCELADA']);
const fields = { id_filme: catalogId, id_sala: catalogId, data: date, horario_inicio: time, horario_fim: time,
    idioma: language, preco_inteira: price };
export const sessionSchemas = {
    create: z.object({ ...fields, idioma: language.default('DUBLADO') }).strict(),
    patch: z.object({ id_filme: catalogId, data: date, horario_inicio: time, horario_fim: time,
        idioma: language, preco_inteira: price, status: state }).partial().strict().refine(v => Object.keys(v).length > 0),
    query: z.object({ limit: z.string().regex(/^\d{1,3}$/).transform(Number).pipe(z.number().int().min(1).max(100)).default(20),
        cursor: catalogId.optional(), localId: catalogId.optional(), date: date.optional(), startFrom: time.optional(), startUntil: time.optional() }).strict(),
    adminQuery: z.object({ limit: z.string().regex(/^\d{1,3}$/).transform(Number).pipe(z.number().int().min(1).max(100)).default(20),
        cursor: catalogId.optional(), localId: catalogId.optional(), date: date.optional(), startFrom: time.optional(), startUntil: time.optional(), status: state.optional() }).strict()
};
export function sessionQuery(schema) { return (req, res, next) => {
    const parsed = schema.safeParse(req.query);
    if (!parsed.success || parsed.data.startFrom && parsed.data.startUntil && parsed.data.startFrom > parsed.data.startUntil) throw ApiError.validacao('Filtros ou paginação inválidos');
    req.sessionQuery = parsed.data; next();
}; }
export function sessionParams(req, res, next) {
    if (req.params.id && !catalogId.safeParse(req.params.id).success) throw ApiError.validacao('Identificador inválido');
    next();
}
