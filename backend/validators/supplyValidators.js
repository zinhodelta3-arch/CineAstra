import { z } from 'zod';
import { catalogId } from './catalogValidators.js';
import { ApiError } from '../utils/ApiError.js';

const note=z.string().trim().min(1).max(2000).optional();
const paging={limit:z.string().regex(/^\d{1,3}$/).transform(Number).pipe(z.number().int().min(1).max(100)).default(20),cursor:catalogId.optional(),localId:catalogId.optional()};
export const supplySchemas={
    request:z.object({localId:catalogId,sessionId:catalogId.optional(),inputId:catalogId.optional(),equipmentId:catalogId.optional(),quantity:z.number().int().min(1).max(2147483647),note}).strict().refine(v=>Boolean(v.inputId)!==Boolean(v.equipmentId)).refine(v=>!v.equipmentId||Boolean(v.sessionId)),
    requestsQuery:z.object({...paging,sessionId:catalogId.optional()}).strict(),shipmentsQuery:z.object({...paging,sessionId:catalogId.optional()}).strict(),stockQuery:z.object({localId:catalogId,sessionId:catalogId.optional()}).strict()
};
export function supplyParams(req,res,next){if(Object.values(req.params).some(v=>!catalogId.safeParse(v).success))throw ApiError.validacao('ID inválido');next();}
export function supplyQuery(schema){return(req,res,next)=>{const p=schema.safeParse(req.query);if(!p.success)throw ApiError.validacao('Filtro inválido');req.supplyQuery=p.data;next();};}
