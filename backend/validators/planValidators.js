import {z} from 'zod';
import {ApiError} from '../utils/ApiError.js';

const id=z.string().regex(/^[1-9]\d{0,9}$/).refine(value=>BigInt(value)<=4294967295n);
const nullableId=id.nullable();
const plan=z.object({name:z.string().trim().min(1).max(100),description:z.string().trim().max(5000).nullable().optional(),maxMembers:z.number().int().min(1).max(100),catalogAccess:z.boolean().default(false),freeComboId:nullableId.optional(),freeCombosPerMonth:z.number().int().min(0).max(1).default(0)}).strict();
export const planCreate=plan;
export const planPatch=plan.partial().extend({active:z.boolean().optional()}).strict().refine(value=>Object.keys(value).length>0);
export const subscriptionCreate=z.object({planId:id,period:z.enum(['MENSAL','ANUAL']),autoRenew:z.boolean().default(true),divisionMode:z.enum(['TITULAR_PAGA','DIVISAO_IGUAL']).default('TITULAR_PAGA'),acceptance:z.object({offerHash:z.string().regex(/^[a-f0-9]{64}$/),accepted:z.literal(true)}).strict().optional()}).strict();
export function planIdParam(req,res,next){const value=req.params.planId??req.params.subscriptionId;if(!id.safeParse(value).success)throw ApiError.validacao('ID inválido');next();}
export function planPage(req,res,next){const parsed=z.object({limit:z.coerce.number().int().min(1).max(100).default(50),cursor:z.union([z.literal('0'),id]).default('0')}).strict().safeParse(req.query);if(!parsed.success)throw ApiError.validacao('Paginação inválida');req.planPage=parsed.data;next();}
