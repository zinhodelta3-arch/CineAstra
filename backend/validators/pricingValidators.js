import { z } from 'zod';
import { catalogId } from './catalogValidators.js';
import { ApiError } from '../utils/ApiError.js';

const price=z.string().regex(/^(0|[1-9]\d{0,7})\.\d{2}$/);
const category=z.enum(['SESSION','INPUT','COMBO','RENTAL','PLAN']);
const discount=z.number().int().min(0).max(10000);
const instant=z.string().datetime({offset:true}).transform(v=>new Date(v).toISOString().slice(0,19).replace('T',' '));
const nonempty=s=>s.refine(x=>Object.keys(x).length>0);
const costShapes={
    inputs:z.object({custo_receita:price,custo_parceria:price}).strict(),
    sessions:z.object({custo_local_dia:price,custo_exibicao:price}).strict(),
    films:z.object({custo_streaming_dia:price}).strict(),
    combos:z.object({custo_operacional:price}).strict(),
    plans:z.object({custo_beneficios_mensal:price,custo_beneficios_anual:price,combo_gratis_mes:z.number().int().min(0).max(2147483647)}).strict()
};
const promotion=z.object({nome:z.string().trim().min(1).max(120),categoria:category,desconto_bps:discount.min(1),publico_geral:z.boolean().default(false),inicio:instant,fim:instant,ativo:z.boolean().default(true)}).strict().refine(x=>x.fim>x.inicio);
const coupon=z.object({codigo:z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{1,50}$/),desconto:z.string().regex(/^(0|[1-9]\d?|100)\.\d{2}$/).refine(v=>Number(v)>0&&Number(v)<=100),validade:z.string().date(),limite_uso:z.number().int().min(0).max(2147483647),ativo:z.boolean().default(true)}).strict();
export const pricingSchemas={
    quote:z.object({lines:z.array(z.object({category,id:catalogId,quantity:z.number().int().min(1).max(100),period:z.enum(['MONTHLY','ANNUAL']).optional(),halfPreview:z.boolean().optional()}).strict().refine(x=>!x.halfPreview||x.category==='SESSION').refine(x=>!x.period||x.category==='PLAN').refine(x=>x.category!=='SESSION'||x.quantity===1)).min(1).max(50),couponCode:z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{1,50}$/).optional()}).strict(),
    parameter:nonempty(z.object({markup_bps:z.number().int().min(0).max(30000).optional(),margem_alerta_bps:discount.optional(),teto_desconto_bps:discount.optional(),ocupacao_referencia:z.number().int().min(1).max(65535).optional(),meia_projecao_bps:discount.optional(),combo_passo_bps:discount.optional()}).strict()),
    promotion,promotionPatch:nonempty(z.object({nome:z.string().trim().min(1).max(120).optional(),desconto_bps:discount.min(1).optional(),publico_geral:z.boolean().optional(),inicio:instant.optional(),fim:instant.optional(),ativo:z.boolean().optional()}).strict()),
    benefit:z.object({discountBps:discount}).strict(),coupon,couponPatch:nonempty(z.object({codigo:z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{1,50}$/).optional(),desconto:z.string().regex(/^(0|[1-9]\d?|100)\.\d{2}$/).refine(v=>Number(v)>0&&Number(v)<=100).optional(),validade:z.string().date().optional(),limite_uso:z.number().int().min(0).max(2147483647).optional(),ativo:z.boolean().optional()}).strict()),costShapes
};
export function pricingParams(req,res,next){
    if(req.params.id&&!catalogId.safeParse(req.params.id).success)throw ApiError.validacao('ID inválido');
    if(req.params.planId&&!catalogId.safeParse(req.params.planId).success)throw ApiError.validacao('Plano inválido');
    if(req.params.category&&!category.safeParse(req.params.category).success)throw ApiError.validacao('Categoria inválida');
    if(req.params.kind&&!costShapes[req.params.kind])throw ApiError.validacao('Tipo inválido');
    next();
}
export function pricingCostBody(req,res,next){const parsed=costShapes[req.params.kind]?.safeParse(req.body);if(!parsed?.success)throw ApiError.validacao('Custos inválidos');req.input=parsed.data;next();}
