import {z} from 'zod';
import {ApiError} from '../utils/ApiError.js';

const id=z.string().regex(/^[1-9]\d{0,19}$/).refine(v=>BigInt(v)<=18446744073709551615n);
const code=z.string().regex(/^[A-Za-z0-9_-]{43}$/);
export const ticketValidationBody=z.object({code}).strict();
export const ticketConsumeBody=z.object({code,halfEvidenceType:z.enum(['CIE','PCD','ID_JOVEM','IDOSO']).optional()}).strict();
export function ticketIdParam(req,res,next){const idValue=req.params.orderId??req.params.sessionId;if(!id.safeParse(idValue).success)throw ApiError.validacao('ID inválido');next();}
export function ticketPage(req,res,next){const q=z.object({limit:z.coerce.number().int().min(1).max(100).default(50),cursor:z.union([z.literal('0'),id]).default('0')}).strict().safeParse(req.query);
    if(!q.success)throw ApiError.validacao('Paginação inválida');req.ticketPage=q.data;next();}
