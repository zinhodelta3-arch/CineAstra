import {z} from 'zod';
import {ApiError} from '../utils/ApiError.js';
const id=z.string().regex(/^[1-9]\d{0,9}$/).refine(x=>BigInt(x)<=4294967295n);
const text=(max)=>z.string().trim().min(1).max(max);
const category=z.object({code:z.string().regex(/^[A-Z][A-Z0-9_]{0,49}$/),name:text(100),description:z.string().trim().max(255).nullable().optional()}).strict();
const categoryPatch=z.object({name:text(100),description:z.string().trim().max(255).nullable().optional()}).strict();
const campaign=z.object({categoryId:id,name:text(150),subject:text(200),html:z.string().min(1).max(100000),text:text(100000)}).strict();
const schedule=z.object({at:z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/).refine(x=>Number.isFinite(Date.parse(x)))}).strict();
const page=z.object({limit:z.coerce.number().int().min(1).max(100).default(50),cursor:z.union([z.literal('0'),id]).default('0')}).strict();
export function newsletterCampaignBody(schema){return (req,res,next)=>{const result=schema.safeParse(req.body);if(!result.success)throw ApiError.validacao('Dados de campanha inválidos');req.campaignInput=result.data;next();};}
export const categoryCreate=newsletterCampaignBody(category);
export const categoryUpdate=newsletterCampaignBody(categoryPatch);
export const campaignCreate=newsletterCampaignBody(campaign);
export const campaignUpdate=newsletterCampaignBody(campaign);
export const campaignSchedule=newsletterCampaignBody(schedule);
export function newsletterCampaignId(req,res,next){const value=req.params.categoryId??req.params.campaignId;if(!id.safeParse(value).success)throw ApiError.validacao('ID inválido');next();}
export function newsletterCampaignPage(req,res,next){const result=page.safeParse(req.query);if(!result.success)throw ApiError.validacao('Paginação inválida');req.campaignPage=result.data;next();}
