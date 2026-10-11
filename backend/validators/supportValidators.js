import {z} from 'zod';
import {ApiError} from '../utils/ApiError.js';
const id=z.string().regex(/^[1-9]\d{0,9}$/).refine(x=>BigInt(x)<=4294967295n);
const cursor=z.union([z.literal('0'),z.string().regex(/^[1-9]\d{0,19}$/).refine(x=>BigInt(x)<=18446744073709551615n)]);
const text=max=>z.string().trim().min(1).max(max);
const body=schema=>(req,res,next)=>{const result=schema.safeParse(req.body);if(!result.success)throw ApiError.validacao('Dados de suporte inválidos');req.supportInput=result.data;next();};
export const supportCreate=body(z.object({subject:text(150),message:text(10000)}).strict());
export const supportMessage=body(z.object({message:text(10000),mode:z.enum(['ASYNC','LIVE']).default('ASYNC')}).strict());
export const supportAssign=body(z.object({attendantId:id}).strict());
export function supportId(req,res,next){if(!id.safeParse(req.params.id).success)throw ApiError.validacao('ID inválido');next();}
export function supportPage(req,res,next){const result=z.object({limit:z.coerce.number().int().min(1).max(100).default(20),cursor:cursor.default('0')}).strict().safeParse(req.query);if(!result.success)throw ApiError.validacao('Paginação inválida');req.supportPage=result.data;next();}
