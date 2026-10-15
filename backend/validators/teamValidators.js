import { z } from 'zod';
import { catalogId } from './catalogValidators.js';
import { ApiError } from '../utils/ApiError.js';

const entryId = z.string().regex(/^[1-9]\d{0,19}$/).refine(v => BigInt(v) <= 18446744073709551615n);
const name = z.string().trim().min(1).max(100);
const functionName = z.string().trim().min(1).max(100);
const page = id => z.object({ limit: z.string().regex(/^\d{1,3}$/).transform(Number).pipe(z.number().int().min(1).max(100)).default(20), cursor: id.optional() }).strict();
export const teamSchemas = {
    create: z.object({ sessionId: catalogId, nome: name, supervisorId: catalogId.optional() }).strict(),
    patch: z.object({ nome: name.optional(), status: z.enum(['FINALIZADA','CANCELADA']).optional(), supervisorId: catalogId.optional() }).strict().refine(v => Object.keys(v).length > 0),
    memberPatch: z.object({ funcao: functionName }).strict(),
    request: z.object({}).strict(),
    invitation: z.object({ userId: catalogId, funcao: functionName }).strict(),
    decision: z.object({ decision: z.enum(['ACEITAR','RECUSAR']), funcao: functionName.optional() }).strict(),
    teamsQuery: page(catalogId), membersQuery: page(catalogId), entriesQuery: page(entryId)
};
export function teamParams(req, res, next) {
    if (req.params.id && !catalogId.safeParse(req.params.id).success || req.params.memberId && !catalogId.safeParse(req.params.memberId).success || req.params.entryId && !entryId.safeParse(req.params.entryId).success) throw ApiError.validacao('Identificador inválido');
    next();
}
export function teamQuery(schema) { return (req, res, next) => {
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) throw ApiError.validacao('Paginação inválida');
    req.teamQuery = parsed.data; next();
}; }
