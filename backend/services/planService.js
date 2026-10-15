import {createHash} from 'node:crypto';
import {ApiError} from '../utils/ApiError.js';
import {idString} from '../utils/dto.js';
import {cents} from './pricingMath.js';
import {cycleEnd} from './subscriptionBillingMath.js';

const conflict=message=>new ApiError(message,409,null,'PLAN_CONFLICT');
const found=row=>{if(!row)throw ApiError.naoEncontrado();return row;};
const snapshot=value=>typeof value==='string'?JSON.parse(value):value;
const planDto=(row,benefits,admin=false)=>({id:idString(row.id_plano),name:row.nome,description:row.descricao??null,monthlyPrice:row.valor_mensal??null,annualPrice:row.valor_anual??null,maxMembers:row.limite_membros,catalogAccess:Boolean(row.acesso_catalogo),freeComboId:row.id_combo_medio?idString(row.id_combo_medio):null,freeCombosPerMonth:row.combo_gratis_mes,discounts:Object.fromEntries(benefits.map(x=>[x.categoria,x.desconto_bps])),active:Boolean(row.ativo),...(admin?{monthlyBenefitCost:row.custo_beneficios_mensal,annualBenefitCost:row.custo_beneficios_anual}:{})});
const subscriptionDto=(row,charge=null)=>({id:idString(row.id_assinatura),planId:idString(row.id_plano),period:row.periodicidade,divisionMode:row.tipo_divisao??'TITULAR_PAGA',status:row.status,autoRenew:Boolean(row.renovacao_automatica),startsOn:row.inicio,endsOn:row.fim,contractPrice:row.preco_contratado,contract:snapshot(row.contrato_snapshot),...(charge?{chargeId:idString(charge.id_cobranca),chargeStatus:charge.status,paymentPath:'/api/payments'}:{})});
const page=(rows,limit,key,map)=>({items:rows.slice(0,limit).map(map),pagination:{limit,nextCursor:rows.length>limit?idString(rows[limit-1][key]):null}});
const positivePrice=(price,cost)=>price!=null&&cost!=null&&cents(price)>0n&&cents(price)*8000n>=cents(cost)*10000n;
export function createPlanService({model,identity,billing,contracts}){
    async function admin(c,context){const a=await identity.activeActor(c,context);if(a.tipo_usuario!=='ADMIN')throw ApiError.acessoNegado();return a;}
    async function client(c,context){const a=await identity.activeActor(c,context);if(a.tipo_usuario!=='CLIENTE')throw ApiError.acessoNegado();return a;}
    async function view(c,row,isAdmin=false){return planDto(row,await model.benefits(c,row.id_plano),isAdmin);}
    async function validatePlan(c,row){
        if(!positivePrice(row.valor_mensal,row.custo_beneficios_mensal)||!positivePrice(row.valor_anual,row.custo_beneficios_anual))throw conflict('Preço publicado ou custo de benefício inválido');
        if(!Number.isInteger(row.limite_membros)||row.limite_membros<1||row.limite_membros>100)throw conflict('Limite de membros inválido');
        if(row.combo_gratis_mes>1||Boolean(row.combo_gratis_mes)!==Boolean(row.id_combo_medio))throw conflict('Configure um combo mensal elegível');
        if(row.id_combo_medio&&!((await model.combo(c,row.id_combo_medio))?.ativo))throw conflict('Combo do plano indisponível');
    }
    async function plans({limit=50,cursor='0'},context,isAdmin=false){return identity.transaction(async c=>{
        if(isAdmin)await admin(c,context);
        const rows=await model.plans(c,isAdmin,limit,cursor);
        const items=[];for(const row of rows.slice(0,limit))items.push(await view(c,row,isAdmin));
        return {items,pagination:{limit,nextCursor:rows.length>limit?idString(rows[limit-1].id_plano):null}};
    },context);}
    async function get(id,context,isAdmin=false){return identity.transaction(async c=>{
        if(isAdmin)await admin(c,context);
        const row=found(await model.plan(c,id));if(!isAdmin&&(!row.ativo||row.valor_mensal==null||row.valor_anual==null))throw ApiError.naoEncontrado();
        return view(c,row,isAdmin);
    },context);}
    async function create(input,context){return identity.transaction(async c=>{
        await admin(c,context);
        const id=await model.create(c,input);
        await identity.audit(c,'PLAN.CREATED',id,context);
        return view(c,found(await model.plan(c,id)),true);
    },context);}
    async function patch(id,input,context){return identity.transaction(async c=>{
        await admin(c,context);
        found(await model.plan(c,id,true));
        await model.patch(c,id,input);
        const row=found(await model.plan(c,id,true));
        if(row.ativo)await validatePlan(c,row);
        await identity.audit(c,'PLAN.UPDATED',id,context);
        return view(c,row,true);
    },context);}
    async function archive(id,context){return identity.transaction(async c=>{
        await admin(c,context);found(await model.plan(c,id,true));
        await model.patch(c,id,{active:false});
        await identity.audit(c,'PLAN.ARCHIVED',id,context);
    },context);}
    async function summary(input,context){return identity.transaction(async c=>{
        await client(c,context);
        const plan=found(await model.plan(c,input.planId,true));
        if(!plan.ativo)throw conflict('Plano indisponível');
        await validatePlan(c,plan);
        const benefits=await model.benefits(c,plan.id_plano),details=planDto(plan,benefits);
        const price=input.period==='ANUAL'?plan.valor_anual:plan.valor_mensal;
        return contracts.planContract(c,input,details,price);
    },context);}
    async function subscribe(input,key,context){return identity.transaction(async c=>{
        const user=await client(c,context),hash=createHash('sha256').update(JSON.stringify(input)).digest('hex');
        await model.lockUser(c,user.id_usuario);
        const prior=await model.byKey(c,user.id_usuario,key);
        if(prior){if(prior.contratacao_hash!==hash)throw conflict('Chave de contratação reutilizada');const row=found(await model.subscription(c,prior.id_assinatura));return subscriptionDto(row,await model.firstCharge(c,row.id_assinatura));}
        const age=await model.age(c,user.id_usuario);
        if(!age||age.faixa_etaria==='ATE_16')throw ApiError.acessoNegado();
        if(await model.activeForUser(c,user.id_usuario))throw conflict('Titular já possui assinatura ativa ou pendente');
        const plan=found(await model.plan(c,input.planId,true));
        if(!plan.ativo)throw conflict('Plano indisponível');
        await validatePlan(c,plan);
        const benefits=await model.benefits(c,plan.id_plano),contract=planDto(plan,benefits);
        const price=input.period==='ANUAL'?plan.valor_anual:plan.valor_mensal;
        const legal=contracts?await contracts.planContract(c,input,contract,price):null;
        if(contracts&&(!input.acceptance?.accepted||input.acceptance.offerHash!==legal.offerHash))throw conflict('Aceite da oferta atual necessário');
        const id=await model.subscribe(c,{userId:user.id_usuario,planId:input.planId,period:input.period,divisionMode:input.divisionMode??'TITULAR_PAGA',autoRenew:input.autoRenew,key,hash,snapshot:legal?{...contract,legal}:contract,price,maxMembers:plan.limite_membros});
        await model.initialCharge(c,id,user.id_usuario,price);
        await identity.audit(c,'SUBSCRIPTION.CONTRACTED',id,context);
        return subscriptionDto(found(await model.subscription(c,id)),await model.firstCharge(c,id));
    },context);}
    async function mySubscriptions({limit=50,cursor='0'},context){return identity.transaction(async c=>{
        const user=await client(c,context),rows=await model.userSubscriptions(c,user.id_usuario,limit,cursor);
        return page(rows,limit,'id_assinatura',row=>subscriptionDto(row));
    },context);}
    async function ownSubscription(id,context){return identity.transaction(async c=>{
        const user=await client(c,context),row=found(await model.subscription(c,id));
        if(idString(row.id_usuario)!==idString(user.id_usuario))throw ApiError.naoEncontrado();
        return subscriptionDto(row,await model.firstCharge(c,id));
    },context);}
    async function canSettle(c,chargeId){const row=await model.settlement(c,chargeId);return Boolean(row&&(['PENDENTE','ATIVA'].includes(row.assinatura_status)||row.assinatura_status==='CANCELADA'&&row.renovacao_emitida&&row.cobranca_status==='ATRASADO')&&['PENDENTE','ATRASADO'].includes(row.cobranca_status));}
    async function activate(c,chargeId,confirmedAt){const row=found(await model.settlement(c,chargeId));
        if(row.cobranca_status!=='PAGO'||!['PENDENTE','ATIVA'].includes(row.assinatura_status)&&!(row.assinatura_status==='CANCELADA'&&row.renovacao_emitida))throw conflict('Cobrança sem direito');
        if(row.assinatura_status==='PENDENTE')await model.activate(c,row.id_assinatura,confirmedAt,row.periodicidade);
        else if(row.assinatura_status==='ATIVA'&&row.data_vencimento)await model.extend(c,row.id_assinatura,row.data_vencimento,cycleEnd(row.data_vencimento,row.periodicidade));
        if(billing)await billing.onPaid(c,row);
    }
    async function redeem(id,context){return identity.transaction(async c=>{
        const user=await client(c,context),row=found(await model.subscription(c,id,true));
        if(idString(row.id_usuario)!==idString(user.id_usuario))throw ApiError.naoEncontrado();
        const now=new Date().toISOString().slice(0,10),competence=`${now.slice(0,7)}-01`,contract=snapshot(row.contrato_snapshot);
        const graceEnd=row.fim?new Date(Date.parse(`${row.fim}T00:00:00Z`)+7*86400000).toISOString().slice(0,10):null;
        if(row.status!=='ATIVA'||row.suspenso_por_cobranca||!row.inicio||!graceEnd||row.inicio>now||graceEnd<now||!await model.paidCurrent(c,id)||!contract?.freeComboId||contract.freeCombosPerMonth!==1)throw conflict('Benefício indisponível');
        if(!((await model.combo(c,contract.freeComboId))?.ativo))throw conflict('Combo contratado indisponível');
        if(await model.existingRedemption(c,id,competence))throw conflict('Combo mensal já solicitado');
        const redemptionId=await model.redeem(c,id,user.id_usuario,contract.freeComboId,competence);
        await identity.audit(c,'SUBSCRIPTION.COMBO_REQUESTED',redemptionId,context);
        return {id:redemptionId,subscriptionId:idString(id),comboId:contract.freeComboId,competence,status:'SOLICITADO'};
    },context);}
    return {plans,get,create,patch,archive,summary,subscribe,mySubscriptions,ownSubscription,canSettle,activate,redeem};
}
