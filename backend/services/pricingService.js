import { ApiError } from '../utils/ApiError.js';
import { idString } from '../utils/dto.js';
import { cents,money,roundDiv,basePrice,ordinaryQuote,ticketQuote,addMoney } from './pricingMath.js';

const found=row=>{if(!row)throw ApiError.naoEncontrado();return row;};
const conflict=message=>new ApiError(message,409,null,'PRICING_CONFLICT');
const fields={inputs:['custo_receita','custo_parceria'],sessions:['custo_local_dia','custo_exibicao'],films:['custo_streaming_dia'],combos:['custo_operacional'],plans:['custo_beneficios_mensal','custo_beneficios_anual','combo_gratis_mes']};
const periodMoney=(value)=>{if(value==null)throw conflict('Custo não cadastrado');return cents(value);};
const paramDto=r=>({category:r.categoria,markupBps:r.markup_bps,minMarginBps:r.margem_alerta_bps,discountCapBps:r.teto_desconto_bps,referenceOccupancy:r.ocupacao_referencia,halfProjectionBps:r.meia_projecao_bps,comboStepBps:r.combo_passo_bps,updatedAt:r.atualizado_em});
const promoDto=r=>({id:idString(r.id_promocao),name:r.nome,category:r.categoria,discountBps:r.desconto_bps,publicGeneral:Boolean(r.publico_geral),startsAt:r.inicio,endsAt:r.fim,active:Boolean(r.ativo)});
const couponDto=r=>({id:idString(r.id_cupom),code:r.codigo,discountPercent:r.desconto,expiresOn:r.validade,usageLimit:r.limite_uso,active:Boolean(r.ativo)});
function minutes(start,end){const a=start.split(':').map(Number),b=end.split(':').map(Number),s=a[0]*60+a[1],e=b[0]*60+b[1];const value=(e-s+1440)%1440;if(!value)throw conflict('Duração de sessão inválida');return value;}
function costFor(kind,row,parts,p,period){
    if(kind==='INPUT')return addMoney(periodMoney(row.custo_receita),periodMoney(row.custo_parceria));
    if(kind==='SESSION'){
        const occupancy=Math.min(p.ocupacao_referencia,row.capacidade);
        if(!occupancy)throw conflict('Ocupação inválida');
        return roundDiv(roundDiv(periodMoney(row.custo_local_dia)*BigInt(minutes(row.horario_inicio,row.horario_fim)),1440n)+periodMoney(row.custo_exibicao),BigInt(occupancy));
    }
    if(kind==='RENTAL'){if(!Number.isInteger(row.dias_acesso_aluguel)||row.dias_acesso_aluguel<1)throw conflict('Prazo de aluguel inválido');return periodMoney(row.custo_streaming_dia)*BigInt(row.dias_acesso_aluguel);}
    if(kind==='COMBO'){
        if(!parts?.length)throw conflict('Combo sem composição');
        return parts.reduce((sum,part)=>sum+BigInt(part.quantidade)*addMoney(periodMoney(part.custo_receita),periodMoney(part.custo_parceria)),periodMoney(row.custo_operacional));
    }
    if(kind==='PLAN')return period==='ANNUAL'?periodMoney(row.custo_beneficios_anual):periodMoney(row.custo_beneficios_mensal);
    throw new TypeError('Categoria inválida');
}
function available(kind,row){if(kind==='INPUT')return row.status==='DISPONIVEL';if(kind==='SESSION')return ['AGENDADA','EM_CARTAZ'].includes(row.status);if(kind==='RENTAL')return row.status==='ATIVO'&&Boolean(row.disponivel_streaming);return Boolean(row.ativo);}
export function createPricingService({model,identity}){
    async function admin(c,context){const a=await identity.activeActor(c,context);if(a.tipo_usuario!=='ADMIN')throw ApiError.acessoNegado();return a;}
    const tx=(context,fn)=>identity.transaction(c=>fn(c),context);
    const publicQuote=({couponId,...quote})=>({...quote,lines:quote.lines.map(({cost,belowCost,belowMargin,projectedBelowMargin,parameters,planId,...line})=>line)});
    async function quoteWithConnection(c,input,context,{trustedHalf=false,lockCoupon=false}={}){
        const actor=await identity.activeActor(c,context);
        const plan=await model.activePlan(actor.id_usuario,c);
        let coupon=null,couponBps=0;
        if(input.couponCode){
            coupon=found(await model.coupon(input.couponCode,c,lockCoupon));
            if(!coupon.ativo||String(coupon.validade)<new Date().toISOString().slice(0,10))throw conflict('Cupom indisponível');
            const used=Number((await model.couponUses(coupon.id_cupom,c))?.total??0);
            if(coupon.limite_uso>0&&used>=coupon.limite_uso)throw conflict('Limite do cupom atingido');
            couponBps=Number(cents(coupon.desconto));
        }
        const lines=[];let total=0n;
        for(const line of input.lines){
            const p=found(await model.parameter(line.category,c));
            const row=found(await model.product(line.category,line.id,c,lockCoupon));
            if(!available(line.category,row))throw conflict('Item indisponível');
            const parts=line.category==='COMBO'?await model.comboParts(line.id,c):null;
            if(parts?.some(x=>x.status!=='DISPONIVEL'))throw conflict('Componente indisponível');
            const cost=costFor(line.category,row,parts,p,line.period);
            const base=basePrice(cost,p.markup_bps);
            const promotions=await model.activePromotions(line.category,c);
            const publicBps=promotions.filter(x=>x.publico_geral).reduce((n,x)=>n+x.desconto_bps,0);
            const privatePromoBps=promotions.filter(x=>!x.publico_geral).reduce((n,x)=>n+x.desconto_bps,0);
            const planBps=plan&&line.category!=='PLAN'?Number((await model.planBenefit(plan.id_plano,line.category,c))?.desconto_bps??cents(plan.desconto??'0.00')):0;
            const comboBps=line.category==='COMBO'?Math.min(Math.max(parts.reduce((n,x)=>n+x.quantidade,0)-1,0)*p.combo_passo_bps,p.teto_desconto_bps):0;
            const extraBps=privatePromoBps+planBps+couponBps+comboBps;
            const quoted=line.category==='SESSION'?ticketQuote({cost,base,publicDiscountBps:publicBps,privateDiscountBps:extraBps,halfEligible:Boolean(line.halfPreview),capBps:p.teto_desconto_bps,minMarginBps:p.margem_alerta_bps,halfProjectionBps:p.meia_projecao_bps}):ordinaryQuote({cost,base,discountBps:publicBps+extraBps,capBps:p.teto_desconto_bps,minMarginBps:p.margem_alerta_bps});
            const subtotal=quoted.price*BigInt(line.quantity);total+=subtotal;
            const published=line.category==='PLAN'?(line.period==='ANNUAL'?row.valor_anual:row.valor_mensal):row.published;
            if(published==null)throw conflict('Preço público não configurado');
            lines.push({category:line.category,id:idString(line.id),quantity:line.quantity,period:line.category==='PLAN'?line.period??'MONTHLY':null,cost:money(cost),base:money(base),publishedPrice:published??null,catalogOutOfSync:published!=null&&published!==money(base),publicPrice:line.category==='SESSION'?money(quoted.publicPrice):null,halfPrice:line.category==='SESSION'?money(quoted.halfPrice):null,benefit:line.category==='SESSION'?quoted.benefit:quoted.discountBps?'DESCONTO':'INTEIRA',unitPrice:money(quoted.price),subtotal:money(subtotal),discountBps:quoted.discountBps,discountCapped:quoted.discountCapped,belowCost:line.category==='SESSION'?quoted.belowCost:false,belowMargin:quoted.belowMargin,projectedBelowMargin:line.category==='SESSION'?quoted.projectedBelowMargin:false,referenceOccupancy:line.category==='SESSION'?Math.min(p.ocupacao_referencia,row.capacidade):null,halfEligibilityUnverified:line.category==='SESSION'&&Boolean(line.halfPreview)&&!trustedHalf,promotionIds:promotions.map(x=>idString(x.id_promocao)),planId:plan?idString(plan.id_plano):null,parameters:paramDto(p)});
        }
        return {lines,total:money(total),couponId:coupon?idString(coupon.id_cupom):null,couponCode:coupon?.codigo??null,couponDiscountBps:couponBps,finalizable:!lines.some(x=>x.halfEligibilityUnverified||x.catalogOutOfSync),quotedAt:new Date().toISOString()};
    }
    return {
        async quote(input,context){return tx(context,async c=>publicQuote(await quoteWithConnection(c,input,context)));},
        async adminQuote(input,context){return tx(context,async c=>{await admin(c,context);return quoteWithConnection(c,input,context);});},
        // Checkout consumer must create the order and call this on its SAME connection.
        async commit(c,{orderId,input,context,verifiedHalf=false}){
            if(!c?.execute)throw new TypeError('Conexão transacional obrigatória');
            const order=found(await model.order(orderId,c,true));
            if(idString(order.id_usuario)!==idString(context.actor.id)||!['EM_ANDAMENTO','AGUARDANDO_PAGAMENTO'].includes(order.status))throw ApiError.acessoNegado();
            const previous=await model.snapshot(orderId,c);
            if(previous)return typeof previous.snapshot==='string'?JSON.parse(previous.snapshot):previous.snapshot;
            if(input.lines.some(x=>x.halfPreview)&&!verifiedHalf)throw ApiError.acessoNegado();
            const quote=await quoteWithConnection(c,input,context,{trustedHalf:verifiedHalf,lockCoupon:true});
            if(!quote.finalizable)throw conflict('Catálogo ou elegibilidade requer confirmação');
            if(quote.couponId)await model.recordCoupon(c,orderId,quote.couponId,quote.couponDiscountBps);
            await model.insertSnapshot(c,orderId,quote);
            await identity.audit(c,'PRICING.SNAPSHOTTED',orderId,context);
            return quote;
        },
        async settleCoupon(c,{orderId,action}){
            if(!c?.execute||!['CONFIRMAR','LIBERAR'].includes(action))throw new TypeError('Transição inválida');
            const order=found(await model.order(orderId,c,true));
            const initial=await model.couponUsage(orderId,c);
            if(!initial)return null;
            found(await model.couponById(initial.id_cupom,c,true));
            const usage=found(await model.couponUsage(orderId,c,true));
            const target=action==='CONFIRMAR'?'CONFIRMADO':'LIBERADO';
            if(usage.status===target)return target;
            if(usage.status!=='RESERVADO')throw conflict('Cupom em estado incompatível');
            if(target==='CONFIRMADO'&&(!['PAGO','FINALIZADO'].includes(order.status)||!usage.expira_em||Date.parse(`${String(usage.expira_em).replace(' ','T')}Z`)<=Date.now()))throw conflict('Reserva de cupom expirada ou pedido não pago');
            if(target==='LIBERADO'&&['PAGO','FINALIZADO'].includes(order.status))throw conflict('Pedido pago não libera cupom reservado');
            await model.setCouponUsage(c,orderId,target);
            return target;
        },
        async parameters(context){return tx(context,async c=>{await admin(c,context);return (await model.parameters(c)).map(paramDto);});},
        async setParameter(category,input,context){return tx(context,async c=>{await admin(c,context);found(await model.parameter(category,c,true));await model.updateParameter(c,category,input);await identity.audit(c,'PRICING.PARAMETERS_CHANGED',category,context);return paramDto(found(await model.parameter(category,c)));});},
        async costs(kind,id,context){return tx(context,async c=>{await admin(c,context);return found(await model.resource(kind,id,c));});},
        async setCosts(kind,id,input,context){return tx(context,async c=>{await admin(c,context);found(await model.resource(kind,id,c,true));const data={};for(const key of fields[kind])if(Object.hasOwn(input,key))data[key]=input[key];await model.updateResource(c,kind,id,data);await identity.audit(c,'PRICING.COST_CHANGED',id,context);return found(await model.resource(kind,id,c));});},
        async publish(category,id,context){return tx(context,async c=>{
            await admin(c,context);
            const p=found(await model.parameter(category,c,true)),row=found(await model.product(category,id,c,true));
            if(!available(category,row))throw conflict('Item indisponível');
            if(await model.referenced(category,id,c))throw conflict('Preço de item já vendido não pode ser republicado');
            const parts=category==='COMBO'?await model.comboParts(id,c):null;
            const monthly=basePrice(costFor(category,row,parts,p,'MONTHLY'),p.markup_bps);
            const annual=category==='PLAN'?basePrice(costFor(category,row,parts,p,'ANNUAL'),p.markup_bps):null;
            await model.publishPrice(c,category,id,money(monthly),annual===null?null:money(annual));
            await identity.audit(c,'PRICING.PUBLISHED',id,context);
            return {category,id:idString(id),price:money(monthly),annualPrice:annual===null?null:money(annual)};
        });},
        async promotions(context){return tx(context,async c=>{await admin(c,context);return (await model.promotions(c)).map(promoDto);});},
        async createPromotion(input,context){return tx(context,async c=>{await admin(c,context);const id=await model.createPromotion(c,input);await identity.audit(c,'PRICING.PROMOTION_CREATED',id,context);return promoDto(found(await model.promotion(id,c)));});},
        async patchPromotion(id,input,context){return tx(context,async c=>{await admin(c,context);found(await model.promotion(id,c,true));await model.updatePromotion(c,id,input);await identity.audit(c,'PRICING.PROMOTION_CHANGED',id,context);return promoDto(found(await model.promotion(id,c)));});},
        async archivePromotion(id,context){return tx(context,async c=>{await admin(c,context);found(await model.promotion(id,c,true));await model.updatePromotion(c,id,{ativo:false});await identity.audit(c,'PRICING.PROMOTION_ARCHIVED',id,context);});},
        async planBenefits(planId,context){return tx(context,async c=>{await admin(c,context);found(await model.resource('plans',planId,c));return model.planBenefits(planId,c);});},
        async setPlanBenefit(planId,category,bps,context){return tx(context,async c=>{await admin(c,context);found(await model.resource('plans',planId,c,true));await model.setPlanBenefit(c,planId,category,bps);await identity.audit(c,'PRICING.PLAN_BENEFIT_CHANGED',planId,context);return found(await model.planBenefit(planId,category,c));});}
        ,async coupons(context){return tx(context,async c=>{await admin(c,context);return (await model.coupons(c)).map(couponDto);});}
        ,async createCoupon(input,context){return tx(context,async c=>{await admin(c,context);const id=await model.createCoupon(c,input);await identity.audit(c,'PRICING.COUPON_CREATED',id,context);return couponDto(found(await model.couponById(id,c)));});}
        ,async patchCoupon(id,input,context){return tx(context,async c=>{await admin(c,context);const row=found(await model.couponById(id,c,true));const used=Number((await model.couponUses(id,c))?.total??0);if(input.limite_uso!==undefined&&input.limite_uso>0&&input.limite_uso<used)throw conflict('Limite inferior ao uso confirmado');await model.updateCoupon(c,id,input);await identity.audit(c,'PRICING.COUPON_CHANGED',id,context);return couponDto(found(await model.couponById(id,c)));});}
        ,async archiveCoupon(id,context){return tx(context,async c=>{await admin(c,context);found(await model.couponById(id,c,true));await model.updateCoupon(c,id,{ativo:false});await identity.audit(c,'PRICING.COUPON_ARCHIVED',id,context);});}
    };
}
