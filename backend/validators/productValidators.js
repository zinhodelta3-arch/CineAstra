import { z } from 'zod';
import { catalogId } from './catalogValidators.js';
import { ApiError } from '../utils/ApiError.js';

const name = z.string().trim().min(1).max(150);
const description = z.string().trim().max(10000).nullable();
const category = z.string().trim().min(1).max(100).nullable();
const price = z.string().regex(/^(0|[1-9]\d{0,7})\.\d{2}$/);
const count = z.number().int().min(0).max(2147483647);
const heritage = z.string().trim().min(1).max(100).transform(v => v.toUpperCase()).nullable();
const supplyStatus = z.enum(['DISPONIVEL','INDISPONIVEL']);
const equipmentStatus = z.enum(['DISPONIVEL','MANUTENCAO','INDISPONIVEL']);
const common = { nome: name, descricao: description.optional(), categoria: category.optional() };
const page = status => z.object({ limit: z.string().regex(/^\d{1,3}$/).transform(Number).pipe(z.number().int().min(1).max(100)).default(20), cursor: catalogId.optional(), supplierId: catalogId.optional(), localId: catalogId.optional(), status: status.optional() }).strict();
export const productSchemas = {
    inputs: {
        create: z.object({ ...common, supplierId: catalogId.optional(), localId: catalogId, quantidade_minima: count.optional(), preco: price }).strict(),
        patch: z.object({ nome: name.optional(), descricao: description.optional(), categoria: category.optional(), quantidade_minima: count.optional(), preco: price.optional(), status: supplyStatus.optional() }).strict().refine(v => Object.keys(v).length > 0),
        query: page(supplyStatus)
    },
    equipment: {
        create: z.object({ ...common, supplierId: catalogId.optional(), localId: catalogId, numero_patrimonio: heritage.optional() }).strict(),
        patch: z.object({ nome: name.optional(), descricao: description.optional(), categoria: category.optional(), numero_patrimonio: heritage.optional(), status: equipmentStatus.optional() }).strict().refine(v => Object.keys(v).length > 0),
        query: page(equipmentStatus)
    },
    grant: z.object({ localId: catalogId }).strict(),
    grantQuery: z.object({ limit: z.string().regex(/^\d{1,3}$/).transform(Number).pipe(z.number().int().min(1).max(100)).default(20), cursor: catalogId.optional(), status: z.enum(['ATIVO','INATIVO']).optional() }).strict()
};
export function productParams(req, res, next) {
    if (Object.values(req.params).some(value => !catalogId.safeParse(value).success)) throw ApiError.validacao('Identificador inválido');
    next();
}
export function productQuery(schema) { return (req, res, next) => {
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) throw ApiError.validacao('Paginação ou filtro inválido');
    req.productQuery = parsed.data; next();
}; }
