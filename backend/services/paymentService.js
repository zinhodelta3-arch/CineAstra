import { ApiError } from '../utils/ApiError.js';
import { idString } from '../utils/dto.js';
import { cents } from './pricingMath.js';

const conflict=()=>new ApiError('Pagamento em conflito',409,null,'PAYMENT_CONFLICT');
const unavailable=()=>ApiError.indisponivel();
const statusDto=r=>({id:idString(r.id_pagamento),intentionId:idString(r.id_intencao),status:r.pagamento_status,amount:String(r.valor),currency:r.moeda,orderId:r.id_pedido?idString(r.id_pedido):null,chargeId:r.id_cobranca?idString(r.id_cobranca):null});
const contextActor=async(identity,c,context)=>{const a=await identity.activeActor(c,context);if(a.tipo_usuario!=='CLIENTE')throw ApiError.acessoNegado();return a;};
function normalized(event){
    if(!event||typeof event.eventId!=='string'||!/^[A-Za-z0-9._:-]{1,150}$/.test(event.eventId)||
        !['PENDENTE','APROVADO','RECUSADO'].includes(event.status)||event.currency!=='BRL'||
        typeof event.amount!=='string'||!/^(0|[1-9]\d{0,7})\.\d{2}$/.test(event.amount)||cents(event.amount)<=0n||
        typeof event.transactionId!=='string'||!/^[A-Za-z0-9._:-]{1,150}$/.test(event.transactionId))throw ApiError.validacao('Evento do gateway inválido');
    let intentionId;try{intentionId=idString(event.intentionId);}catch{throw ApiError.validacao('Evento do gateway inválido');}
    const time=new Date(event.occurredAt);
    if(!Number.isFinite(time.getTime())||time.getTime()>Date.now()+300000)throw ApiError.validacao('Evento do gateway inválido');
    return {...event,intentionId,occurredSql:time.toISOString().replace('T',' ').replace('Z','').slice(0,23)};
}
export function createPaymentService({model,methods,identity,provider}){
    const tx=(context,fn)=>identity.transaction(fn,context);
    function ready(){if(provider?.available===false||!/^[A-Za-z0-9_-]{2,40}$/.test(provider?.name??'')||typeof provider.create!=='function'||typeof provider.consult!=='function'||typeof provider.verifyWebhook!=='function')throw unavailable();}
    async function ownPayment(id,context){return tx(context,async c=>{const a=await contextActor(identity,c,context);const row=await model.byPayment(id,c);if(!row||idString(row.id_usuario)!==idString(a.id_usuario))throw ApiError.naoEncontrado();return statusDto(row);});}
    async function applyEvent(raw,type,context={}){
        const e=normalized(raw);
        return tx(context,async c=>{
            const row=await model.intent(e.intentionId,c,true);
            if(!row||row.provider!==provider.name||!row.id_pagamento||row.moeda!=='BRL'||String(row.valor)!==e.amount||
                (row.provider_ref&&row.provider_ref!==e.transactionId))throw conflict();
            const previous=await model.event(c,provider.name,e.eventId);
            if(previous){if(idString(previous.id_intencao)!==e.intentionId)throw conflict();return {duplicate:true};}
            const inserted=await model.insertEvent(c,{...e,provider:provider.name},type);
            if(!inserted.created)return {duplicate:true};
            const last=row.ultimo_evento_em?Date.parse(`${String(row.ultimo_evento_em).replace(' ','T')}Z`):0;
            const at=Date.parse(`${e.occurredSql.replace(' ','T')}Z`);
            if(at<last||row.pagamento_status==='APROVADO'&&e.status!=='APROVADO')return {duplicate:false,ignored:true};
            if(e.status==='PENDENTE'){await model.markObserved(c,row.id_intencao,e.occurredSql);return {duplicate:false,pending:true};}
            if(row.pagamento_status===e.status){await model.markObserved(c,row.id_intencao,e.occurredSql);return {duplicate:false,ignored:true};}
            await model.settle(c,row,e.status,e.occurredSql,e.transactionId);
            await identity.audit(c,e.status==='APROVADO'?'PAYMENT.APPROVED':'PAYMENT.DECLINED',row.id_pagamento,context);
            return {duplicate:false,status:e.status};
        });
    }
    async function create(input,key,context){
        ready();
        const prepared=await tx(context,c=>methods.prepare(c,{orderId:input.orderId??null,chargeId:input.chargeId??null,methodId:input.methodId,key,context}));
        const dispatch=await tx(context,async c=>{
            const a=await contextActor(identity,c,context);
            const row=await model.intent(prepared.id,c,true);
            if(!row||idString(row.id_usuario)!==idString(a.id_usuario)||row.metodo_provider!==provider.name)throw conflict();
            if(row.estado!=='PREPARADA')return {send:false,payment:statusDto(row)};
            if(!row.metodo_ativo||!row.provider_token)throw conflict();
            const id=await model.claim(c,row,provider.name);
            await identity.audit(c,'PAYMENT.DISPATCH_CLAIMED',id,context);
            return {send:true,id,token:row.provider_token,intentionId:idString(row.id_intencao),amount:String(row.valor),key:row.chave_idempotencia};
        });
        if(!dispatch.send)return dispatch.payment;
        try{
            const result=await provider.create({idempotencyKey:dispatch.key,intentionId:dispatch.intentionId,amount:dispatch.amount,currency:'BRL',methodToken:dispatch.token,signal:context.signal});
            if(result?.transactionId&&/^[A-Za-z0-9._:-]{1,150}$/.test(result.transactionId))await tx(context,async c=>{
                const row=await model.intent(dispatch.intentionId,c,true);
                if(row.provider_ref&&row.provider_ref!==result.transactionId)throw conflict();
                if(!row.provider_ref)await model.setReference(c,row.id_intencao,result.transactionId);
            });
        }catch(error){
            // Resultado incerto, inclusive timeout depois de captura: somente consulta futura.
            if(error instanceof ApiError&&error.statusCode===409)throw error;
        }
        return ownPayment(dispatch.id,context);
    }
    async function reconcile(id,context){
        ready();
        const row=await tx(context,async c=>{const a=await contextActor(identity,c,context);const r=await model.byPayment(id,c);if(!r||idString(r.id_usuario)!==idString(a.id_usuario))throw ApiError.naoEncontrado();return r;});
        if(row.pagamento_status==='APROVADO')return statusDto(row);
        const result=await provider.consult({idempotencyKey:row.chave_idempotencia,intentionId:idString(row.id_intencao),transactionId:row.provider_ref,signal:context.signal});
        if(result)await applyEvent(result,'CONSULTA',context);
        return ownPayment(id,context);
    }
    async function webhook(name,body,headers,context){
        ready();
        if(name!==provider.name||!Buffer.isBuffer(body)||body.length<1||body.length>65536)throw ApiError.validacao('Webhook inválido');
        const timestamp=headers['x-payment-timestamp'],signature=headers['x-payment-signature'];
        if(typeof timestamp!=='string'||!/^\d{10}$/.test(timestamp)||Math.abs(Date.now()-Number(timestamp)*1000)>300000||
            typeof signature!=='string'||signature.length<16||signature.length>512)throw ApiError.naoAutorizado();
        const verified=await provider.verifyWebhook({rawBody:body,signature,timestamp,headers,signal:context.signal});
        if(!verified)throw ApiError.naoAutorizado();
        return applyEvent(verified,'WEBHOOK',context);
    }
    return {create,get:ownPayment,reconcile,webhook};
}
