import { z } from 'zod';
import { catalogId } from './catalogValidators.js';
import { ApiError } from '../utils/ApiError.js';

const name = z.string().trim().min(1).max(150);
const price = z.string().regex(/^(0|[1-9]\d{0,7})\.\d{2}$/);
const item = z.object({ inputId: catalogId, quantidade: z.number().int().min(1).max(2147483647) }).strict();
const items = z.array(item).min(1).max(100).superRefine((value, ctx) => {
    const ids = new Set();
    for (const [index, row] of value.entries()) {
        if (ids.has(row.inputId)) ctx.addIssue({ code: 'custom', path: [index, 'inputId'], message: 'Insumo duplicado' });
        ids.add(row.inputId);
    }
});
export const comboSchemas = {
    create: z.object({ localId: catalogId, nome: name, descricao: z.string().trim().max(10000).nullable().optional(), preco: price, items }).strict(),
    patch: z.object({ nome: name.optional(), descricao: z.string().trim().max(10000).nullable().optional(), preco: price.optional() }).strict().refine(v => Object.keys(v).length > 0),
    composition: z.object({ items }).strict(),
    query: z.object({ localId: catalogId, limit: z.string().regex(/^\d{1,3}$/).transform(Number).pipe(z.number().min(1).max(100)).default(20), cursor: catalogId.optional() }).strict()
};
export function comboParams(req, res, next) { if (!catalogId.safeParse(req.params.id).success) throw ApiError.validacao('ID inválido'); next(); }
export function comboQuery(req, res, next) { const parsed = comboSchemas.query.safeParse(req.query); if (!parsed.success) throw ApiError.validacao('Filtro inválido'); req.comboQuery = parsed.data; next(); }
