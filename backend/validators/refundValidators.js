import {z} from 'zod';
import {ApiError} from '../utils/ApiError.js';
const big=z.string().regex(/^[1-9]\d{0,19}$/).refine(v=>BigInt(v)<=18446744073709551615n);
const small=z.string().regex(/^[1-9]\d{0,9}$/).refine(v=>BigInt(v)<=4294967295n);
const price=z.string().regex(/^(0|[1-9]\d{0,7})\.\d{2}$/).refine(v=>v!=='0.00');
export const refundSchemas={
    request:z.object({reason:z.enum(['ARREPENDIMENTO','DEFEITO','OUTRO','CANCELAMENTO_PLANO']),details:z.string().trim().min(1).max(1000).optional()}).strict(),
    decision:z.object({decision:z.enum(['APPROVE','DENY']),amount:price.optional(),termsVersion:z.string().min(1).max(50),basis:z.string().trim().min(10).max(1000)}).strict().refine(x=>x.decision==='APPROVE'===Boolean(x.amount))
};
export function refundId(req,res,next){if(!big.safeParse(req.params.id).success)throw ApiError.validacao('ID inválido');next();}
export function subscriptionId(req,res,next){if(!small.safeParse(req.params.id).success)throw ApiError.validacao('ID inválido');next();}
