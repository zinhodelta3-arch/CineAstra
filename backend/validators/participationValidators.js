import {z} from 'zod';
import {ApiError} from '../utils/ApiError.js';

const intId=z.string().regex(/^[1-9]\d{0,9}$/).refine(x=>BigInt(x)<=4294967295n);
const bigintId=z.string().regex(/^[1-9]\d{0,19}$/).refine(x=>BigInt(x)<=18446744073709551615n);
export const invitationBody=z.object({userId:intId}).strict();
export const proposalBody=z.object({divisionMode:z.enum(['TITULAR_PAGA','DIVISAO_IGUAL'])}).strict();
export const consentBody=z.object({accept:z.boolean()}).strict();
export function participantParams(req,res,next){for(const [key,value] of Object.entries(req.params)){const schema=['invitationId','proposalId'].includes(key)?bigintId:intId;if(!schema.safeParse(value).success)throw ApiError.validacao('ID inválido');}next();}
export function participantPage(req,res,next){const parsed=z.object({limit:z.coerce.number().int().min(1).max(100).default(50),cursor:z.union([z.literal('0'),bigintId]).default('0')}).strict().safeParse(req.query);if(!parsed.success)throw ApiError.validacao('Paginação inválida');req.participantPage=parsed.data;next();}
export function competenceQuery(req,res,next){const parsed=z.object({competence:z.string().regex(/^\d{4}-(0[1-9]|1[0-2])-01$/)}).strict().safeParse(req.query);if(!parsed.success)throw ApiError.validacao('Competência inválida');req.competence=parsed.data.competence;next();}
