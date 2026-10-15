import {z} from 'zod';
import {ApiError} from '../utils/ApiError.js';

export const slugs=['business','team','history','reputation','partners','social-campaigns','terms','privacy','faq'];
const text=z.string().trim().min(1).max(20000);
function validCnpj(value){if(!/^\d{14}$/.test(value)||/^(\d)\1{13}$/.test(value))return false;for(const length of [12,13]){let sum=0,weight=length===12?5:6;for(let i=0;i<length;i++){sum+=Number(value[i])*weight;weight=weight===2?9:weight-1;}const digit=sum%11<2?0:11-sum%11;if(digit!==Number(value[length]))return false;}return true;}
const business=z.object({legalName:z.string().trim().min(2).max(200),cnpj:z.string().refine(validCnpj),physicalAddress:z.string().trim().min(10).max(500),email:z.email().max(150),supportChannels:z.array(z.string().trim().min(3).max(200)).min(1).max(10)}).strict();
const faq=z.object({items:z.array(z.object({question:z.string().trim().min(3).max(500),answer:text}).strict()).min(1).max(100)}).strict();
export const publication=z.object({slug:z.enum(slugs),version:z.string().regex(/^[A-Za-z0-9._-]{1,50}$/),title:z.string().trim().min(2).max(200),body:z.union([business,faq,z.object({text}).strict()]),source:z.string().trim().url().max(500)}).strict().superRefine((v,ctx)=>{
    const valid=v.slug==='business'?business.safeParse(v.body).success:v.slug==='faq'?faq.safeParse(v.body).success:z.object({text}).strict().safeParse(v.body).success;
    if(!valid)ctx.addIssue({code:'custom',path:['body'],message:'Formato incompatível com o conteúdo'});
});
export const assistantMessage=z.object({message:z.string().trim().min(1).max(1000)}).strict();
export const assistantHandoff=z.object({message:z.string().trim().min(1).max(4000)}).strict();
export const body=(schema,key)=>(req,res,next)=>{const result=schema.safeParse(req.body);if(!result.success)throw ApiError.validacao('Conteúdo inválido');req[key]=result.data;next();};
export const contentSlug=(req,res,next)=>{if(!slugs.includes(req.params.slug))throw ApiError.naoEncontrado();next();};
