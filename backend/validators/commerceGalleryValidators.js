import { z } from 'zod';
import { IMAGE_KEY } from '../models/imageStorage.js';
import { catalogId } from './catalogValidators.js';
import { imageId } from './filmGalleryValidators.js';
import { ApiError } from '../utils/ApiError.js';

const tipo = z.enum(['PRINCIPAL','ALTERNATIVA']);
const alt = z.string().trim().max(255).nullable();
const ordem = z.number().int().min(0).max(4294967295);
export const commerceGallerySchemas = {
    create: z.object({ stagingKey: z.string().regex(IMAGE_KEY), tipo: tipo.default('ALTERNATIVA'), texto_alternativo: alt.optional(), ordem: ordem.default(0) }).strict(),
    patch: z.object({ tipo: tipo.optional(), texto_alternativo: alt.optional(), ordem: ordem.optional() }).strict().refine(v => Object.keys(v).length > 0),
    query: z.object({ tipo: tipo.optional(), limit: z.string().regex(/^\d{1,3}$/).transform(Number).pipe(z.number().int().min(1).max(100)).default(20), cursor: z.string().regex(/^(0|[0-9]{1,10}:[1-9][0-9]{0,19})$/).refine(v => v === '0' || (Number(v.split(':')[0]) <= 4294967295 && imageId.safeParse(v.split(':')[1]).success)).optional() }).strict()
};
export function commerceGalleryParams(req, res, next) { if (!catalogId.safeParse(req.params.id).success || (req.params.imageId && !imageId.safeParse(req.params.imageId).success)) throw ApiError.validacao('Identificador inválido'); next(); }
