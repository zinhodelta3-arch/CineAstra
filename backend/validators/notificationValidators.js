import { z } from 'zod';
import { ApiError } from '../utils/ApiError.js';

const notificationId = z.string().regex(/^[1-9]\d{0,19}$/).refine(v => BigInt(v) <= 18446744073709551615n);
export const notificationQuerySchema = z.object({
    limit: z.string().regex(/^\d{1,3}$/).transform(Number).pipe(z.number().int().min(1).max(100)).default(20),
    cursor: notificationId.optional(),
    unread: z.enum(['true','false']).transform(v => v === 'true').optional(),
    type: z.string().trim().min(1).max(50).optional()
}).strict();
export function notificationParams(req, res, next) {
    if (!notificationId.safeParse(req.params.id).success) throw ApiError.validacao('Identificador inválido');
    next();
}
export function notificationQuery(req, res, next) {
    const result = notificationQuerySchema.safeParse(req.query);
    if (!result.success) throw ApiError.validacao('Paginação ou filtro inválido');
    req.notificationQuery = result.data; next();
}
