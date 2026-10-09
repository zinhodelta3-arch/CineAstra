import { readFile,writeFile } from 'node:fs/promises';
import { pricingOperations } from '../routes/pricingRoutes.js';

const file=new URL('../docs/openapi.json',import.meta.url),spec=JSON.parse(await readFile(file,'utf8'));
spec.info.version='1.16.0';
spec.tags=[...spec.tags.filter(x=>x.name!=='Precificação'),{name:'Precificação',description:'Custos, parâmetros, benefícios, promoções, cupons e cotação.'}];
const id={type:'string',pattern:'^[1-9][0-9]{0,9}$'},price={type:'string',pattern:'^(0|[1-9][0-9]{0,7})\\.[0-9]{2}$'};
const obj=(properties,required=Object.keys(properties))=>({type:'object',additionalProperties:false,properties,...(required.length?{required}:{})});
const ref=name=>({$ref:`#/components/schemas/${name}`});
const response=data=>({description:'Sucesso',content:{'application/json':{schema:obj({success:{type:'boolean',enum:[true]},data,requestId:{type:'string',format:'uuid'}})}}});
const bps={type:'integer',minimum:0,maximum:10000},category={type:'string',enum:['SESSION','INPUT','COMBO','RENTAL','PLAN']};
spec.components.schemas.PricingParameter=obj({category,markupBps:{type:'integer',minimum:0,maximum:30000},minMarginBps:bps,discountCapBps:bps,referenceOccupancy:{type:'integer',minimum:1},halfProjectionBps:bps,comboStepBps:bps,updatedAt:{type:'string'}});
spec.components.schemas.PricingLine=obj({category,id,quantity:{type:'integer',minimum:1},period:{type:'string',nullable:true},cost:price,base:price,publishedPrice:{...price,nullable:true},catalogOutOfSync:{type:'boolean'},publicPrice:{...price,nullable:true},halfPrice:{...price,nullable:true},benefit:{type:'string'},unitPrice:price,subtotal:price,discountBps:bps,discountCapped:{type:'boolean'},belowCost:{type:'boolean'},belowMargin:{type:'boolean'},projectedBelowMargin:{type:'boolean'},referenceOccupancy:{type:'integer',nullable:true},halfEligibilityUnverified:{type:'boolean'},promotionIds:{type:'array',items:id},planId:{...id,nullable:true},parameters:ref('PricingParameter')});
spec.components.schemas.PricingQuote=obj({lines:{type:'array',items:ref('PricingLine')},total:price,couponId:{...id,nullable:true},couponCode:{type:'string',nullable:true},couponDiscountBps:bps,finalizable:{type:'boolean'},quotedAt:{type:'string',format:'date-time'}});
spec.components.schemas.PricingAdminLine=structuredClone(spec.components.schemas.PricingLine);
spec.components.schemas.PricingAdminQuote=structuredClone(spec.components.schemas.PricingQuote);
spec.components.schemas.PricingAdminQuote.properties.lines.items=ref('PricingAdminLine');
for(const key of ['cost','belowCost','belowMargin','projectedBelowMargin','parameters','planId']){delete spec.components.schemas.PricingLine.properties[key];spec.components.schemas.PricingLine.required=spec.components.schemas.PricingLine.required.filter(x=>x!==key);}
delete spec.components.schemas.PricingQuote.properties.couponId;
spec.components.schemas.PricingQuote.required=spec.components.schemas.PricingQuote.required.filter(x=>x!=='couponId');
spec.components.schemas.PricingPromotion=obj({id,name:{type:'string'},category,discountBps:bps,publicGeneral:{type:'boolean'},startsAt:{type:'string'},endsAt:{type:'string'},active:{type:'boolean'}});
spec.components.schemas.PricingCoupon=obj({id,code:{type:'string'},discountPercent:price,expiresOn:{type:'string',format:'date'},usageLimit:{type:'integer'},active:{type:'boolean'}});
const quoteBody=obj({lines:{type:'array',minItems:1,maxItems:50,items:obj({category,id,quantity:{type:'integer',minimum:1,maximum:100},period:{type:'string',enum:['MONTHLY','ANNUAL']},halfPreview:{type:'boolean'}},['category','id','quantity'])},couponCode:{type:'string'}},['lines']);
const parameterBody=obj({markup_bps:{type:'integer',minimum:0,maximum:30000},margem_alerta_bps:bps,teto_desconto_bps:bps,ocupacao_referencia:{type:'integer',minimum:1},meia_projecao_bps:bps,combo_passo_bps:bps},[]);
const costBody={oneOf:[obj({custo_receita:price,custo_parceria:price}),obj({custo_local_dia:price,custo_exibicao:price}),obj({custo_streaming_dia:price}),obj({custo_operacional:price}),obj({custo_beneficios_mensal:price,custo_beneficios_anual:price,combo_gratis_mes:{type:'integer',minimum:0}})]};
const promotionBody=obj({nome:{type:'string'},categoria:category,desconto_bps:{...bps,minimum:1},publico_geral:{type:'boolean'},inicio:{type:'string',format:'date-time'},fim:{type:'string',format:'date-time'},ativo:{type:'boolean'}},['nome','categoria','desconto_bps','inicio','fim']);
const couponBody=obj({codigo:{type:'string'},desconto:{type:'string',pattern:'^(0|[1-9][0-9]?|100)\\.[0-9]{2}$'},validade:{type:'string',format:'date'},limite_uso:{type:'integer',minimum:0},ativo:{type:'boolean'}},['codigo','desconto','validade','limite_uso']);
const bodies={quote:quoteBody,adminQuote:quoteBody,setParameter:parameterBody,setCosts:costBody,createPromotion:promotionBody,patchPromotion:obj({...promotionBody.properties,categoria:undefined},[]),setPlanBenefit:obj({discountBps:bps}),createCoupon:couponBody,patchCoupon:obj(couponBody.properties,[])};
delete bodies.patchPromotion.properties.categoria;
const errors={400:'BadRequest',401:'Unauthorized',403:'Forbidden',404:'NotFound',409:'Conflict',413:'PayloadTooLarge',422:'ValidationError',429:'RateLimited',500:'InternalError',503:'Unavailable'};
for(const r of pricingOperations){
    const op={operationId:r.operationId,tags:['Precificação'],summary:r.operationId.replaceAll('_',' '),description:r.action==='quote'?'Cotação informativa com custos reais e centavos exatos. Meia é prévia sem comprovação; cupom é confirmado somente na transação do pedido. Catálogo divergente impede finalização.':'ADMIN autenticado com 2FA. Alterações de custos e benefícios não alteram pedidos já cotados.',security:[{bearerAuth:[]}],parameters:[],responses:{}};
    for(const name of ['id','kind','category','planId'])if(r.path.includes(`{${name}}`))op.parameters.push({name,in:'path',required:true,schema:name==='id'||name==='planId'?id:name==='kind'?{type:'string',enum:['inputs','sessions','films','combos','plans']}:r.action==='setPlanBenefit'?{type:'string',enum:['SESSION','INPUT','COMBO','RENTAL']}:category});
    if(bodies[r.action])op.requestBody={required:true,content:{'application/json':{schema:bodies[r.action],...(r.action==='quote'?{example:{lines:[{category:'INPUT',id:'1',quantity:1}],couponCode:'PROMO10'}}:{})}}};
    const shape={quote:ref('PricingQuote'),adminQuote:ref('PricingAdminQuote'),parameters:{type:'array',items:ref('PricingParameter')},setParameter:ref('PricingParameter'),costs:{type:'object'},setCosts:{type:'object'},publish:obj({category,id,price,annualPrice:{...price,nullable:true}}),promotions:{type:'array',items:ref('PricingPromotion')},createPromotion:ref('PricingPromotion'),patchPromotion:ref('PricingPromotion'),planBenefits:{type:'array',items:{type:'object'}},setPlanBenefit:{type:'object'},coupons:{type:'array',items:ref('PricingCoupon')},createCoupon:ref('PricingCoupon'),patchCoupon:ref('PricingCoupon')};
    if(r.method==='delete')op.responses['204']={description:'Arquivado'};
    else op.responses[r.method==='post'&&r.action!=='quote'?'201':'200']=response(shape[r.action]);
    for(const [code,name] of Object.entries(errors))op.responses[code]={$ref:`#/components/responses/${name}`};
    (spec.paths[r.path]??={})[r.method]=op;
}
await writeFile(file,`${JSON.stringify(spec,null,2)}\n`);
console.info(`Precificação: ${pricingOperations.length} operações documentadas.`);
