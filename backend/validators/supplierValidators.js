import { z } from 'zod';
import { ApiError } from '../utils/ApiError.js';
import { catalogId } from './catalogValidators.js';
import { normalizeCnpj } from '../utils/cnpj.js';

const name = z.string().trim().min(1).max(150);
const cnpj = z.string().transform(normalizeCnpj).pipe(z.string().length(14));
const query = z.object({ limit: z.string().regex(/^\d{1,3}$/).transform(Number).pipe(z.number().int().min(1).max(100)).default(20), cursor: catalogId.optional(), status: z.enum(['ATIVO','INATIVO']).optional() }).strict();
export const supplierSchemas = {
    create: z.object({ userId: catalogId, razao_social: name, nome_cine: name.nullable().optional(), cnpj }).strict(),
    patch: z.object({ razao_social: name.optional(), nome_cine: name.nullable().optional(), cnpj: cnpj.optional(), status: z.enum(['ATIVO','INATIVO']).optional() }).strict().refine(v => Object.keys(v).length > 0),
    query
};
export function supplierParams(req, res, next) {
    if (!catalogId.safeParse(req.params.id).success) throw ApiError.validacao('Identificador inválido');
    next();
}
export function supplierQuery(req, res, next) {
    const parsed = query.safeParse(req.query);
    if (!parsed.success) throw ApiError.validacao('Paginação ou filtro inválido');
    req.supplierQuery = parsed.data; next();
}
