import {idString} from '../utils/dto.js';
import {cents} from './pricingMath.js';
import {divideCents} from './participationService.js';
import {competenceOf,daysLate,dueAfterCycle,lateCharges} from './subscriptionBillingMath.js';

const prevMonth=date=>new Date(Date.UTC(Number(date.slice(0,4)),Number(date.slice(5,7))-2,1)).toISOString().slice(0,7).replace('-','');
const todayUtc=()=>new Date().toISOString().slice(0,10);
export function createSubscriptionBillingService({model,identity,notifications,ipca}){
  const tx=fn=>identity.transaction(fn,{});
  async function notify(c,userId,type,key,message){if(notifications)await notifications.emit(c,{recipientId:idString(userId),title:'Cobrança da assinatura',message,type,dedupeKey:key});}
  async function issue(id,today=todayUtc()){return tx(async c=>{
    const s=await model.subscription(c,id,true);
    if(!s||s.status!=='ATIVA'||!s.renovacao_automatica||!s.fim||s.fim>=today||!s.preco_contratado)return null;
    const due=dueAfterCycle(s.fim),competence=competenceOf(due);
    if(await model.cycle(c,id,competence))return null;
    const mode=s.tipo_divisao_proximo&&s.tipo_divisao_efetiva_em<=competence?s.tipo_divisao_proximo:s.tipo_divisao;
    const members=await model.participants(c,id),users=[s.id_usuario,...members.map(x=>x.id_usuario)];
    const shares=divideCents(cents(s.preco_contratado),users,mode,s.id_usuario);
    const total=shares.reduce((sum,x)=>sum+cents(x.amount),0n);
    if(total!==cents(s.preco_contratado))throw new Error('Rateio inconsistente');
    const cycleId=await model.insertCycle(c,id,competence,due,mode,s.preco_contratado,shares);
    for(const share of shares){if(mode==='TITULAR_PAGA'&&share.userId!==idString(s.id_usuario))continue;
      await model.insertCharge(c,id,share.userId,competence,share.amount,due);
      await notify(c,share.userId,'COBRANCA_ASSINATURA',`ciclo:${id}:${competence}:${share.userId}`,'Nova cobrança da assinatura disponível para pagamento. Consulte valor e vencimento na sua conta.');
    }
    if(s.tipo_divisao_proximo&&s.tipo_divisao_efetiva_em<=competence)await model.applyMode(c,id,mode);
    await identity.audit(c,'SUBSCRIPTION.CYCLE_ISSUED',cycleId,{});
    return {id:cycleId,subscriptionId:idString(id),competence,due,mode,shares};
  });}
  async function indexPair(due,today){
    const start=prevMonth(due),end=prevMonth(today);
    if(start===end)return {start:1n,end:1n,period:end};
    try{return {start:await ipca.index(start),end:await ipca.index(end),period:end};}
    catch{return null;}
  }
  async function processCharge(id,today=todayUtc()){return tx(async c=>{
    const initial=await model.charge(c,id),s=initial?await model.subscription(c,initial.id_assinatura,true):null;
    if(!s)return null;
    const row=await model.charge(c,id,true);
    if(!row||!['PENDENTE','ATRASADO'].includes(row.status))return null;
    const days=daysLate(row.data_vencimento,today);
    if(days===0)return null;
    const pair=await indexPair(row.data_vencimento,today);
    if(!await model.openIntention(c,id)){
      const charges=lateCharges(row.valor_devido,days,pair?.start??1n,pair?.end??1n);
      await model.updateCharges(c,id,charges.fine,charges.interest,pair?charges.correction:row.correcao_ipca??'0.00',today,pair?.period??null);
    }else await model.markLate(c,id);
    if(await model.mark(c,id,'ATRASO_1')){
      await notify(c,row.id_usuario,'ATRASO_ASSINATURA',`atraso1:${id}`,'Sua cobrança está em atraso. Consulte o valor atualizado e as opções de pagamento na sua conta.');
      await identity.audit(c,'SUBSCRIPTION.CHARGE_LATE',id,{});
    }
    if(s.status!=='ATIVA')return {id:idString(id),days,status:'ATRASADO'};
    if(days>=8&&await model.mark(c,id,'SUSPENSAO_8')){
      if(idString(row.id_usuario)===idString(s.id_usuario))await model.suspendOwner(c,s.id_assinatura);
      else await model.suspendParticipant(c,s.id_assinatura,row.id_usuario);
      await notify(c,row.id_usuario,'SUSPENSAO_ASSINATURA',`suspensao8:${id}`,'Os benefícios da sua participação foram suspensos por atraso. Itens já pagos e sua conta permanecem acessíveis.');
      await identity.audit(c,'SUBSCRIPTION.CHARGE_SUSPENDED',id,{});
    }
    if(days>30&&await model.mark(c,id,'CANCELAMENTO_30')){
      if(idString(row.id_usuario)===idString(s.id_usuario))await model.cancelSubscription(c,s.id_assinatura);
      else{await model.leaveParticipant(c,s.id_assinatura,row.id_usuario);await model.participantEvent(c,s.id_assinatura,row.id_usuario,s.id_usuario,'SAIU');}
      await notify(c,row.id_usuario,'CANCELAMENTO_ASSINATURA',`cancelamento30:${id}`,'Sua assinatura ou participação foi cancelada após atraso prolongado. O débito permanece no histórico.');
      await identity.audit(c,'SUBSCRIPTION.CHARGE_CANCELLED',id,{});
    }
    return {id:idString(id),days,status:'ATRASADO'};
  });}
  async function onPaid(c,settlement){
    const s=await model.subscription(c,settlement.id_assinatura,true);
    if(!s||s.status!=='ATIVA')return;
    if(await model.unpaidOther(c,s.id_assinatura,settlement.id_usuario))return;
    if(idString(settlement.id_usuario)===idString(s.id_usuario))await model.resumeOwner(c,s.id_assinatura);
    else await model.resumeParticipant(c,s.id_assinatura,settlement.id_usuario);
  }
  async function runOnce({today=todayUtc(),limit=25,cursor='0'}={}){
    const due=await model.dueSubscriptions(today,limit);
    for(const row of due)await issue(row.id_assinatura,today);
    const charges=await model.dueCharges(today,limit,cursor);
    for(const row of charges)await processCharge(row.id_cobranca,today);
    return {issuedCandidates:due.length,processed:charges.length,nextCursor:charges.length===limit?idString(charges.at(-1).id_cobranca):'0'};
  }
  return {issue,processCharge,onPaid,runOnce};
}
