import { z } from 'zod';
import { catalogId } from './catalogValidators.js';
import { ApiError } from '../utils/ApiError.js';

const bigId = z.string().regex(/^[1-9]\d{0,19}$/).refine(v => BigInt(v) <= 18446744073709551615n);
const oneItem = value => Boolean(value.inputId) !== Boolean(value.equipmentId);
const quantity = z.number().int().min(-2147483647).max(2147483647).refine(v => v !== 0);
export const inventorySchemas = {
    movement: z.object({ inputId: catalogId.optional(), equipmentId: catalogId.optional(), tipo: z.enum(['ENTRADA','SAIDA','AJUSTE','PERDA','DEVOLUCAO']), quantidade: quantity, motivo: z.string().trim().min(1).max(255).optional() }).strict().refine(oneItem).refine(v => !['AJUSTE','PERDA','DEVOLUCAO'].includes(v.tipo) || Boolean(v.motivo)).refine(v => ['ENTRADA','DEVOLUCAO'].includes(v.tipo) ? v.quantidade > 0 : ['SAIDA','PERDA'].includes(v.tipo) ? v.quantidade < 0 : true),
    movementsQuery: z.object({ inputId: catalogId.optional(), equipmentId: catalogId.optional(), localId: catalogId.optional(), limit: z.string().regex(/^\d{1,3}$/).transform(Number).pipe(z.number().int().min(1).max(100)).default(20), cursor: bigId.optional() }).strict().refine(v => !(v.inputId && v.equipmentId)),
    alertsQuery: z.object({ localId: catalogId, limit: z.string().regex(/^\d{1,3}$/).transform(Number).pipe(z.number().int().min(1).max(100)).default(20), cursor: catalogId.optional() }).strict()
};
export function inventoryParams(req,res,next) { if (!catalogId.safeParse(req.params.id).success) throw ApiError.validacao('ID inválido'); next(); }
export function inventoryQuery(schema) { return (req,res,next) => { const parsed = schema.safeParse(req.query); if (!parsed.success) throw ApiError.validacao('Filtro inválido'); req.inventoryQuery = parsed.data; next(); }; }
