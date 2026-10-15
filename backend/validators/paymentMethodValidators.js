import { z } from 'zod';
import { ApiError } from '../utils/ApiError.js';

const id=z.string().regex(/^[1-9]\d{0,9}$/).refine(v=>BigInt(v)<=4294967295n);
export const paymentMethodSchemas={
    create:z.object({type:z.enum(['CREDITO','DEBITO','PIX','BOLETO']),setupReference:z.string().min(8).max(255).regex(/^[A-Za-z][A-Za-z0-9._:-]+$/),principal:z.boolean().optional()}).strict(),
    patch:z.object({principal:z.literal(true)}).strict()
};
export function paymentMethodId(req,res,next){if(!id.safeParse(req.params.id).success)throw ApiError.validacao('ID inválido');next();}
