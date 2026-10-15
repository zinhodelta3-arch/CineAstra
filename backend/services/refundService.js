import {ApiError} from '../utils/ApiError.js';
import {idString} from '../utils/dto.js';
import {cents,money} from './pricingMath.js';

const conflict=()=>new ApiError('Reembolso em conflito',409,null,'REFUND_CONFLICT');
const dto=r=>({id:idString(r.id_reembolso),paymentId:idString(r.id_pagamento),reason:r.motivo,status:r.status,requestedAmount:r.valor_solicitado??null,confirmedAmount:r.valor_confirmado??null,withinSevenDays:Boolean(r.dentro_prazo),receivedAt:r.solicitado_em,responseDueAt:r.prazo_resposta_em,respondedAt:r.respondido_em??null,compensation:r.compensacao_status});
const sevenDays=7*24*60*60*1000;
function withinSeven(value,now=Date.now()){
    if(!value)return false;
    const raw=String(value),iso=raw.length===10?`${raw}T00:00:00Z`:raw.replace(' ','T');
    const parsed=Date.parse(/(?:Z|[+-]\d{2}:?\d{2})$/.test(iso)?iso:`${iso}Z`);
    if(!Number.isFinite(parsed)||parsed>now)return false;
    return now-parsed<=sevenDays+(raw.length===10?24*60*60*1000-1:0);
}
export function createRefundService({model,identity,provider,termsVersion}){
    const tx=(context,fn)=>identity.transaction(fn,context);
    const gatewayReady=()=>provider?.available!==false&&/^[A-Za-z0-9_-]{2,40}$/.test(provider?.name??'')&&typeof provider.refund==='function'&&typeof provider.consultRefund==='function';
    async function actor(c,context){const a=await identity.activeActor(c,context);if(a.tipo_usuario!=='CLIENTE')throw ApiError.acessoNegado();return a;}
    async function own(c,id,context,lock=false){const a=await actor(c,context),r=await model.refund(id,c,lock);if(!r||idString(r.id_usuario)!==idString(a.id_usuario))throw ApiError.naoEncontrado();return r;}
    const remaining=async(c,p)=>cents(String(p.valor??p.pagamento_valor))-cents(String((await model.confirmed(p.id_pagamento,c)).total));
    async function get(id,context){return tx(context,async c=>dto(await own(c,id,context)));}
    async function request(paymentId,input,key,context){
        const receipt=await tx(context,async c=>{
            const a=await actor(c,context);
            const prior=await model.byKey(a.id_usuario,key,c);
            if(prior){const r=await model.refund(prior.id_reembolso,c);if(idString(r.id_pagamento)!==idString(paymentId)||r.motivo!==input.reason)throw conflict();return dto(r);}
            const p=await model.payment(paymentId,c,true);
            if(!p||!p.id_usuario||idString(p.id_usuario)!==idString(a.id_usuario))throw ApiError.naoEncontrado();
            if(input.reason==='CANCELAMENTO_PLANO'&&(!p.id_cobranca||p.assinatura_status!=='CANCELADA'))throw conflict();
            if(!['APROVADO','PARCIALMENTE_ESTORNADO'].includes(p.status))throw conflict();
            const left=await remaining(c,p);if(left<=0n)throw conflict();
            const eligible=['ARREPENDIMENTO','CANCELAMENTO_PLANO'].includes(input.reason)&&withinSeven(p.id_pedido?p.data_pedido:p.assinatura_inicio);
            const inserted=await model.insert(c,{paymentId,owner:a.id_usuario,key,reason:input.reason,details:input.details??null,within:eligible,termsVersion:termsVersion??null,amount:eligible?money(left):null,status:eligible?'RECEBIDA':'EM_ANALISE'});
            const stored=await model.refund(inserted.id,c);
            if(idString(stored.id_pagamento)!==idString(paymentId)||stored.chave_idempotencia!==key||stored.motivo!==input.reason)throw conflict();
            if(inserted.created)await identity.audit(c,'REFUND.REQUESTED',inserted.id,context);
            return dto(stored);
        });
        return receipt;
    }
    async function dispatch(id,context){
        if(!gatewayReady())return;
        const claimed=await tx(context,async c=>{
            const r=await model.refund(id,c,true);
            if(!r||r.status!=='RECEBIDA'||!r.valor_solicitado||r.pagamento_provider!==provider.name)return null;
            const transactionId=r.pagamento_provider_ref??r.transacao_id;
            if(!transactionId)return null;
            await model.sent(c,id);
            await identity.audit(c,'REFUND.DISPATCH_CLAIMED',id,context);
            return {id,transactionId,amount:String(r.valor_solicitado)};
        });
        if(!claimed)return;
        try{
            const result=await provider.refund({idempotencyKey:`refund:${id}`,transactionId:claimed.transactionId,amount:claimed.amount,currency:'BRL',signal:context.signal});
            if(result)await applyResult(id,result,context);
        }catch{/* resultado incerto: consultar, nunca redisparar refund */}
    }
    async function applyResult(id,result,context){
        if(!result||!['PENDING','CONFIRMED','FAILED'].includes(result.status)||result.currency!=='BRL'||typeof result.amount!=='string'||
            !/^(0|[1-9]\d{0,7})\.\d{2}$/.test(result.amount)||typeof result.refundId!=='string'||!/^[A-Za-z0-9._:-]{1,150}$/.test(result.refundId))throw ApiError.validacao('Resposta de estorno inválida');
        return tx(context,async c=>{
            const r=await model.refund(id,c,true);
            if(!r||r.pagamento_provider!==provider.name||String(r.valor_solicitado)!==result.amount||
                (r.provider_ref&&r.provider_ref!==result.refundId))throw conflict();
            if(r.status==='CONFIRMADA')return dto(r);
            if(r.status!=='ENVIADA')throw conflict();
            if(!r.provider_ref)await model.reference(c,id,result.refundId);
            if(result.status==='CONFIRMED'){
                await model.payment(r.id_pagamento,c,true);
                const total=money(cents(String((await model.confirmed(r.id_pagamento,c)).total))+cents(result.amount));
                if(cents(total)>cents(String(r.pagamento_valor)))throw conflict();
                await model.confirmedRefund(c,r,result.amount,total);
                await identity.audit(c,'REFUND.CONFIRMED_COMPENSATION_PENDING',id,context);
            }else if(result.status==='FAILED'){
                await model.failed(c,id);await identity.audit(c,'REFUND.FAILED',id,context);
            }
            return dto(await model.refund(id,c));
        });
    }
    async function reconcile(id,context){
        let r=await tx(context,c=>own(c,id,context));
        if(r.status==='RECEBIDA'){
            if(!gatewayReady())throw ApiError.indisponivel();
            await dispatch(id,{actor:context.actor,requestId:context.requestId});
            r=await tx(context,c=>own(c,id,context));
        }
        if(r.status!=='ENVIADA')return dto(r);
        if(!gatewayReady()||r.pagamento_provider!==provider.name)throw ApiError.indisponivel();
        const result=await provider.consultRefund({idempotencyKey:`refund:${id}`,transactionId:r.pagamento_provider_ref??r.transacao_id,refundId:r.provider_ref,signal:context.signal});
        if(result)await applyResult(id,result,context);
        return get(id,context);
    }
    async function decide(id,input,context){
        const result=await tx(context,async c=>{
            const a=await identity.activeActor(c,context);if(a.tipo_usuario!=='ADMIN')throw ApiError.acessoNegado();
            const r=await model.refund(id,c,true);if(!r)throw ApiError.naoEncontrado();if(r.status!=='EM_ANALISE')throw conflict();
            if(!termsVersion)throw ApiError.indisponivel();
            if(input.termsVersion!==termsVersion)throw ApiError.validacao('Versão dos Termos inválida');
            let amount=null,status='NEGADA';
            if(input.decision==='APPROVE'){
                await model.payment(r.id_pagamento,c,true);
                const left=await remaining(c,{id_pagamento:r.id_pagamento,valor:r.pagamento_valor});
                if(cents(input.amount)>left)throw conflict();
                amount=input.amount;status='RECEBIDA';
            }
            await model.decision(c,id,status,amount,termsVersion,input.basis);
            await identity.audit(c,status==='RECEBIDA'?'REFUND.APPROVED_FOR_DISPATCH':'REFUND.DENIED',id,context);
            return dto(await model.refund(id,c));
        });
        return result;
    }
    async function cancelPlan(id,context){
        const result=await tx(context,async c=>{
            const a=await actor(c,context),plan=await model.plan(id,c,true);
            if(!plan||idString(plan.id_usuario)!==idString(a.id_usuario))throw ApiError.naoEncontrado();
            if(!['ATIVA','PENDENTE','CANCELADA'].includes(plan.status))throw conflict();
            if(plan.status!=='CANCELADA'){
                await model.cancelPlan(c,id);
                await identity.audit(c,'SUBSCRIPTION.CANCELLED',id,context);
            }
            const paid=await model.latestPlanPayment(id,a.id_usuario,c);
            return {id:idString(id),status:'CANCELADA',paymentId:paid?idString(paid.id_pagamento):null};
        });
        if(!result.paymentId)return {...result,refund:null,refundRequestRequired:false};
        try{
            const refund=await request(result.paymentId,{reason:'CANCELAMENTO_PLANO'},`cancel_plan_${id}`,context);
            return {...result,refund,refundRequestRequired:false};
        }catch{
            // Cancelamento já confirmado; sinalizar solicitação ainda necessária.
            return {...result,refund:null,refundRequestRequired:true};
        }
    }
    return {request,get,reconcile,decide,cancelPlan,dispatch,applyResult};
}
