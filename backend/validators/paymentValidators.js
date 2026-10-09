import { z } from 'zod';
import { ApiError } from '../utils/ApiError.js';
const big=z.string().regex(/^[1-9]\d{0,19}$/).refine(v=>BigInt(v)<=18446744073709551615n);
const small=z.string().regex(/^[1-9]\d{0,9}$/).refine(v=>BigInt(v)<=4294967295n);
export const paymentBody=z.object({orderId:big.optional(),chargeId:big.optional(),methodId:small}).strict().refine(x=>Boolean(x.orderId)!==Boolean(x.chargeId));
export function paymentId(req,res,next){if(!big.safeParse(req.params.id).success)throw ApiError.validacao('ID inválido');next();}
export function paymentKey(req,res,next){const key=req.get('Idempotency-Key');if(!/^[A-Za-z0-9._:-]{8,120}$/.test(key??''))throw ApiError.validacao('Idempotency-Key inválida');req.paymentKey=key;next();}
export function webhookName(req,res,next){if(!/^[A-Za-z0-9_-]{2,40}$/.test(req.params.provider))throw ApiError.validacao('Provider inválido');next();}
