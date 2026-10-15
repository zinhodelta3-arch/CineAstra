import { z } from 'zod';
import { catalogId } from './catalogValidators.js';
import { ApiError } from '../utils/ApiError.js';

const title = z.string().trim().min(1).max(200);
const description = z.string().trim().max(10000).nullable();
const priority = z.enum(['BAIXA','MEDIA','ALTA','URGENTE']);
const status = z.enum(['ABERTO','EM_ANDAMENTO','RESOLVIDO','FECHADO','CANCELADO']);
const eventId = z.string().regex(/^[1-9]\d{0,19}$/).refine(v => BigInt(v) <= 18446744073709551615n);
const paging = z.object({ limit: z.string().regex(/^\d{1,3}$/).transform(Number).pipe(z.number().int().min(1).max(100)).default(20), cursor: catalogId.optional() }).strict();
export const taskSchemas = {
    create: z.object({ titulo: title, descricao: description.optional(), prioridade: priority.optional() }).strict(),
    edit: z.object({ titulo: title.optional(), descricao: description.optional(), prioridade: priority.optional() }).strict().refine(v => Object.keys(v).length > 0),
    assign: z.object({ userId: catalogId }).strict(),
    list: paging.extend({ status: status.optional(), assigned: z.literal('me').optional() }),
    history: paging.extend({ cursor: eventId.optional() })
};
export function taskParams(req, res, next) {
    if (Object.values(req.params).some(value => !catalogId.safeParse(value).success)) throw ApiError.validacao('Identificador inválido');
    next();
}
export function taskQuery(schema) { return (req, res, next) => {
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) throw ApiError.validacao('Paginação ou filtro inválido');
    req.taskQuery = parsed.data; next();
}; }
