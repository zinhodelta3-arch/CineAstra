import {z} from 'zod';
import {ApiError} from '../utils/ApiError.js';

const code=z.string().regex(/^[A-Z][A-Z0-9_]{0,49}$/);
const subscription=z.object({email:z.email().max(254),name:z.string().trim().min(1).max(100).optional(),termsVersion:z.string().min(1).max(50),accepted:z.literal(true),categories:z.array(code).min(1).max(20).refine(v=>new Set(v).size===v.length)}).strict();
const confirmation=z.object({token:z.string().regex(/^[a-f0-9]{64}$/)}).strict();
const authorization=z.object({email:z.email().max(254),purpose:z.enum(['GESTAO','DESCADASTRO'])}).strict();
const preferenceChange=z.object({token:confirmation.shape.token,categories:z.array(code).max(20).refine(v=>new Set(v).size===v.length)}).strict();
const resubscription=z.object({token:confirmation.shape.token,accepted:z.literal(true),termsVersion:z.string().min(1).max(50),categories:z.array(code).min(1).max(20).refine(v=>new Set(v).size===v.length)}).strict();
export function validateNewsletter(schema){return (req,res,next)=>{const parsed=schema.safeParse(req.body);if(!parsed.success)throw ApiError.validacao('Dados de newsletter inválidos');req.newsletterInput=parsed.data;next();};}
export const newsletterSubscribe=validateNewsletter(subscription);
export const newsletterConfirm=validateNewsletter(confirmation);
export const newsletterAuthorization=validateNewsletter(authorization);
export const newsletterToken=validateNewsletter(confirmation);
export const newsletterPreferenceChange=validateNewsletter(preferenceChange);
export const newsletterResubscribe=validateNewsletter(resubscription);
