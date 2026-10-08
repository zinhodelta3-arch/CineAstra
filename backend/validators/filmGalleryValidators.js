import { z } from 'zod';
import { IMAGE_KEY } from '../models/imageStorage.js';
import { catalogId } from './catalogValidators.js';
import { ApiError } from '../utils/ApiError.js';
export const imageId = z.string().regex(/^[1-9]\d{0,19}$/).refine(v => BigInt(v) <= 18446744073709551615n);
const fields = { tipo: z.enum(['CAPA', 'BANNER', 'ALTERNATIVA']), texto_alternativo: z.string().trim().max(255).nullable(), ordem: z.number().int().min(0).max(4294967295), principal: z.boolean() };
export const gallerySchemas = {
    create: z.object({ stagingKey: z.string().regex(IMAGE_KEY), tipo: fields.tipo.default('ALTERNATIVA'), texto_alternativo: fields.texto_alternativo.optional(), ordem: fields.ordem.default(0), principal: fields.principal.default(false) }).strict(),
    patch: z.object(fields).partial().strict().refine(v => Object.keys(v).length > 0),
    query: z.object({ tipo: fields.tipo.optional(), limit: z.string().regex(/^\d{1,3}$/).transform(Number).pipe(z.number().int().min(1).max(100)).default(20), cursor: imageId.optional() }).strict()
};
export function galleryParams(req, res, next) {
    if (!catalogId.safeParse(req.params.id).success || (req.params.imageId && !imageId.safeParse(req.params.imageId).success)) throw ApiError.validacao('Identificador inválido');
    next();
}
