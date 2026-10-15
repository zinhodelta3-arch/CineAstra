import {ApiError} from '../utils/ApiError.js';
import {idString} from '../utils/dto.js';
import {cents,money} from './pricingMath.js';
import {chargeTotal} from './subscriptionBillingMath.js';

const conflict=message=>new ApiError(message,409,null,'PARTICIPATION_CONFLICT');
const found=row=>{if(!row)throw ApiError.naoEncontrado();return row;};
const same=(a,b)=>idString(a)===idString(b);
const utc=value=>{if(value==null)return null;const text=String(value).replace(' ','T');return text.endsWith('Z')?text:`${text}${text.includes('.')?'':'.000'}Z`;};
const invitationDto=row=>({id:idString(row.id_convite),subscriptionId:idString(row.id_assinatura),userId:idString(row.id_usuario_convidado),status:row.status,invitedAt:utc(row.data_convite),respondedAt:utc(row.data_resposta)});
const memberDto=row=>({userId:idString(row.id_usuario),status:row.status,joinedAt:utc(row.entrada_em),leftAt:utc(row.saida_em)});
const page=(rows,limit,key,mapper)=>({items:rows.slice(0,limit).map(mapper),pagination:{limit,nextCursor:rows.length>limit?idString(rows[limit-1][key]):null}});
export function nextCompetence(period,now=new Date(),startedOn=null){
  const y=now.getUTCFullYear(),m=now.getUTCMonth();
  if(period==='MENSAL')return new Date(Date.UTC(y,m+1,1)).toISOString().slice(0,10);
  if(period!=='ANUAL'||!/^\d{4}-(0[1-9]|1[0-2])-\d{2}$/.test(startedOn??''))throw new TypeError('Ciclo anual inválido');
  const anchorMonth=Number(startedOn.slice(5,7))-1;
  return new Date(Date.UTC(y+(m>=anchorMonth?1:0),anchorMonth,1)).toISOString().slice(0,10);
}
export function divideCents(total,users,mode,ownerId){
  const unique=[...new Set(users.map(idString))].sort((a,b)=>BigInt(a)<BigInt(b)?-1:1);
  if(!unique.includes(idString(ownerId))||unique.length===0)throw new TypeError('Titular ausente');
  if(mode==='TITULAR_PAGA')return unique.map(userId=>({userId,amount:userId===idString(ownerId)?money(total):'0.00'}));
  if(mode!=='DIVISAO_IGUAL')throw new TypeError('Rateio inválido');
  const base=total/BigInt(unique.length),remainder=total%BigInt(unique.length);
  return unique.map((userId,index)=>({userId,amount:money(base+(BigInt(index)<remainder?1n:0n))}));
}
export function createParticipationService({model,identity,notifications}){
  const tx=(ctx,fn)=>identity.transaction(fn,ctx);
  async function actor(c,ctx){const a=await identity.activeActor(c,ctx);if(a.tipo_usuario!=='CLIENTE')throw ApiError.acessoNegado();return a;}
  async function owner(c,id,ctx){const a=await actor(c,ctx),s=found(await model.subscription(c,id,true));if(!same(s.id_usuario,a.id_usuario))throw ApiError.naoEncontrado();return {a,s};}
  async function visible(c,id,ctx){const a=await actor(c,ctx),s=found(await model.subscription(c,id));if(!same(s.id_usuario,a.id_usuario)){const member=await model.participant(c,id,a.id_usuario);if(!member||member.status==='SAIU')throw ApiError.naoEncontrado();}return {a,s};}
  async function associated(c,id,ctx){const a=await actor(c,ctx),s=found(await model.subscription(c,id));if(!same(s.id_usuario,a.id_usuario)&&!(await model.participant(c,id,a.id_usuario)))throw ApiError.naoEncontrado();return {a,s};}
  async function notify(c,userId,type,key,message){if(notifications)await notifications.emit(c,{recipientId:idString(userId),title:'Atualização da assinatura',message,type,dedupeKey:key});}
  async function noticeAll(c,s,type,key,message){for(const id of [s.id_usuario,...(await model.participants(c,s.id_assinatura)).filter(p=>p.status!=='SAIU').map(p=>p.id_usuario)])await notify(c,id,type,`${key}:${id}`,message);}
  async function cancelPending(c,s){const pending=await model.pendingProposal(c,s.id_assinatura);if(pending){await model.closeProposal(c,pending.id_proposta,'CANCELADA');await noticeAll(c,s,'RATEIO_ALTERADO',`rateio_cancelado:${pending.id_proposta}`,'A proposta de rateio foi cancelada por alteração dos participantes.');}}
  async function members(id,ctx){return tx(ctx,async c=>{const {s}=await visible(c,id,ctx);return {subscriptionId:idString(id),ownerId:idString(s.id_usuario),divisionMode:s.tipo_divisao,scheduledMode:s.tipo_divisao_proximo??null,scheduledCompetence:s.tipo_divisao_efetiva_em??null,maxMembers:s.limite_membros_contratado,participants:(await model.participants(c,id)).map(memberDto)};});}
  async function history(id,q,ctx){return tx(ctx,async c=>{const {a,s}=await associated(c,id,ctx),member=same(a.id_usuario,s.id_usuario)?null:await model.participant(c,id,a.id_usuario);return page(await model.events(c,id,q.limit,q.cursor,member?.status==='SAIU'?a.id_usuario:null),q.limit,'id_evento',r=>({id:idString(r.id_evento),userId:idString(r.id_usuario),actorId:idString(r.id_ator),event:r.event,at:utc(r.criado_em)}));});}
  async function invite(id,userId,ctx){return tx(ctx,async c=>{
    const {a,s}=await owner(c,id,ctx);
    if(s.status!=='ATIVA'||same(userId,a.id_usuario))throw conflict('Assinatura ou destinatário inelegível');
    const target=found(await model.user(c,userId));
    if(target.tipo_usuario!=='CLIENTE'||target.status!=='ATIVO'||!target.faixa_etaria||target.faixa_etaria==='ATE_16')throw ApiError.acessoNegado();
    const count=Number((await model.activeCount(c,id)).total)+Number((await model.pendingCount(c,id)).total)+1;
    if(count>=Number(s.limite_membros_contratado))throw conflict('Limite do plano atingido');
    const member=await model.participant(c,id,userId);
    if(member?.status!=='SAIU'&&member)throw conflict('Participante já vinculado');
    const previous=await model.invitationForUser(c,id,userId);
    if(previous?.status==='PENDENTE'||previous?.status==='ACEITO'&&member?.status!=='SAIU')throw conflict('Convite existente');
    let invitationId;if(previous){invitationId=idString(previous.id_convite);await model.resetInvitation(c,invitationId);}else invitationId=await model.invite(c,id,userId);
    await notify(c,userId,'CONVITE_PLANO',`convite:${invitationId}:${Date.now()}`,'Você recebeu um convite para participar de um plano. Confira as condições antes de aceitar.');
    await identity.audit(c,'SUBSCRIPTION.INVITED',invitationId,ctx);
    return invitationDto(found(await model.invitation(c,invitationId)));
  });}
  async function myInvitations(q,ctx){return tx(ctx,async c=>{const a=await actor(c,ctx);return page(await model.myInvitations(c,a.id_usuario,q.limit,q.cursor),q.limit,'id_convite',invitationDto);});}
  async function decide(invitationId,accept,ctx){return tx(ctx,async c=>{
    const a=await actor(c,ctx),initial=found(await model.invitation(c,invitationId));
    const s=found(await model.subscription(c,initial.id_assinatura,true));
    const row=found(await model.invitation(c,invitationId,true));
    if(!same(row.id_usuario_convidado,a.id_usuario))throw ApiError.naoEncontrado();
    if(row.status!=='PENDENTE'||s.status!=='ATIVA')throw conflict('Convite indisponível');
    if(accept){
      if(await model.pendingProposal(c,s.id_assinatura))throw conflict('Mudança de rateio em votação');
      const count=Number((await model.activeCount(c,s.id_assinatura)).total)+1;
      if(count>=Number(s.limite_membros_contratado))throw conflict('Limite do plano atingido');
      const target=found(await model.user(c,a.id_usuario));
      if(target.status!=='ATIVO'||!target.faixa_etaria||target.faixa_etaria==='ATE_16')throw ApiError.acessoNegado();
      await model.upsertParticipant(c,s.id_assinatura,a.id_usuario);
      await model.event(c,s.id_assinatura,a.id_usuario,a.id_usuario,'ENTROU');
    }
    await model.decideInvitation(c,invitationId,accept?'ACEITO':'RECUSADO');
    await noticeAll(c,s,'PARTICIPACAO_PLANO',`convite_decidido:${invitationId}`,accept?'Um participante aceitou o convite. As cotas serão recalculadas no ciclo seguinte.':'Um convite de plano foi recusado.');
    await identity.audit(c,accept?'SUBSCRIPTION.JOINED':'SUBSCRIPTION.INVITE_DECLINED',invitationId,ctx);
    return invitationDto(found(await model.invitation(c,invitationId)));
  });}
  async function changeMember(id,userId,status,ctx){return tx(ctx,async c=>{
    const a=await actor(c,ctx),s=found(await model.subscription(c,id,true));
    if(status==='SAIU'){if(!same(userId,a.id_usuario)||same(a.id_usuario,s.id_usuario))throw ApiError.acessoNegado();}
    else if(!same(a.id_usuario,s.id_usuario))throw ApiError.naoEncontrado();
    const member=found(await model.participant(c,id,userId));
    if(status==='SAIU'&&member.status==='SAIU')return {userId:idString(userId),status};
    if(status==='SUSPENSO'&&member.status!=='ATIVO'||status==='ATIVO'&&member.status!=='SUSPENSO'||status==='SAIU'&&member.status==='SAIU')throw conflict('Transição inválida');
    await model.setParticipant(c,id,userId,status);
    await model.event(c,id,userId,a.id_usuario,status==='ATIVO'?'REATIVADO':status);
    await cancelPending(c,s);
    if(status==='SAIU')await notify(c,userId,'PARTICIPACAO_PLANO',`saida:${id}:${userId}`,'Sua participação foi encerrada. Cobranças anteriores permanecem no histórico.');
    await noticeAll(c,s,'PARTICIPACAO_PLANO',`participante:${id}:${userId}:${status}:${Date.now()}`,'A participação no plano mudou. Confira as próximas cotas antes da renovação.');
    await identity.audit(c,`SUBSCRIPTION.MEMBER_${status}`,id,ctx);
    return {userId:idString(userId),status};
  });}
  async function propose(id,mode,ctx){return tx(ctx,async c=>{
    const {a,s}=await owner(c,id,ctx);
    if(s.status!=='ATIVA'||s.tipo_divisao===mode||s.tipo_divisao_proximo||await model.pendingProposal(c,id))throw conflict('Mudança de rateio indisponível');
    const participants=(await model.participants(c,id)).filter(p=>p.status!=='SAIU');
    const effective=nextCompetence(s.periodicidade,new Date(),s.inicio),proposalId=await model.createProposal(c,id,a.id_usuario,mode,effective);
    await model.addConsent(c,proposalId,a.id_usuario,true);
    for(const p of participants)await model.addConsent(c,proposalId,p.id_usuario,false);
    if(!participants.length){await model.closeProposal(c,proposalId,'APROVADA');await model.scheduleMode(c,id,mode,effective);}
    await noticeAll(c,s,'RATEIO_PROPOSTA',`rateio_proposta:${proposalId}`,'Foi proposta uma mudança de rateio para o próximo ciclo. É necessária a concordância de todos.');
    await identity.audit(c,'SUBSCRIPTION.DIVISION_PROPOSED',proposalId,ctx);
    return {id:proposalId,subscriptionId:idString(id),divisionMode:mode,effectiveCompetence:effective,status:participants.length?'PENDENTE':'APROVADA'};
  });}
  async function pendingDivision(id,ctx){return tx(ctx,async c=>{
    const {a}=await visible(c,id,ctx),pending=await model.pendingProposal(c,id);
    if(!pending)return {proposal:null};
    const row=found(await model.proposal(c,pending.id_proposta)),vote=await model.consent(c,row.id_proposta,a.id_usuario);
    return {proposal:{id:idString(row.id_proposta),subscriptionId:idString(id),divisionMode:row.tipo_divisao,effectiveCompetence:row.competencia_efetiva,status:row.status,myConsent:vote?.status??null}};
  });}
  async function consent(id,proposalId,accept,ctx){return tx(ctx,async c=>{
    const a=await actor(c,ctx),s=found(await model.subscription(c,id,true)),proposal=found(await model.proposal(c,proposalId));
    if(!same(proposal.id_assinatura,id))throw ApiError.naoEncontrado();
    const vote=await model.consent(c,proposalId,a.id_usuario);
    if(!vote)throw ApiError.naoEncontrado();
    if(s.status!=='ATIVA'||proposal.status!=='PENDENTE'||vote.status!=='PENDENTE')throw conflict('Voto indisponível');
    await model.vote(c,proposalId,a.id_usuario,accept?'ACEITO':'RECUSADO');
    let status='PENDENTE';
    if(!accept){status='REJEITADA';await model.closeProposal(c,proposalId,status);}
    else if(Number((await model.pendingVotes(c,proposalId)).total)===0){status='APROVADA';await model.closeProposal(c,proposalId,status);await model.scheduleMode(c,id,proposal.tipo_divisao,proposal.competencia_efetiva);}
    await noticeAll(c,s,'RATEIO_ALTERADO',`rateio_voto:${proposalId}:${a.id_usuario}`,'Uma proposta de rateio recebeu uma decisão. Consulte o próximo ciclo.');
    await identity.audit(c,'SUBSCRIPTION.DIVISION_VOTED',proposalId,ctx);
    return {id:idString(proposalId),status,divisionMode:proposal.tipo_divisao,effectiveCompetence:proposal.competencia_efetiva};
  });}
  async function preview(id,ctx){return tx(ctx,async c=>{
    const {s}=await visible(c,id,ctx);
    if(s.status!=='ATIVA'||!s.preco_contratado)throw conflict('Ciclo sem preço contratado');
    const competence=nextCompetence(s.periodicidade,new Date(),s.inicio),mode=s.tipo_divisao_proximo&&s.tipo_divisao_efetiva_em<=competence?s.tipo_divisao_proximo:s.tipo_divisao;
    const users=[s.id_usuario,...(await model.participants(c,id)).filter(p=>p.status!=='SAIU').map(p=>p.id_usuario)];
    const shares=divideCents(cents(s.preco_contratado),users,mode,s.id_usuario);
    return {subscriptionId:idString(id),competence,divisionMode:mode,total:s.preco_contratado,shares,issued:false};
  });}
  async function currentCharges(id,competence,ctx){return tx(ctx,async c=>{const {a}=await associated(c,id,ctx);return {subscriptionId:idString(id),competence,charges:(await model.charges(c,id,competence)).filter(x=>same(x.id_usuario,a.id_usuario)).map(x=>({id:idString(x.id_cobranca),userId:idString(x.id_usuario),amount:x.valor_devido,fine:x.valor_multa_aplicada??'0.00',interest:x.juros_mora??'0.00',correction:x.correcao_ipca??'0.00',total:x.status==='ISENTO'?'0.00':chargeTotal(x),ipcaThrough:x.ipca_periodo_final??null,dueOn:x.data_vencimento,paidAt:utc(x.data_pagamento),status:x.status}))};});}
  return {members,history,invite,myInvitations,decide,changeMember,propose,pendingDivision,consent,preview,currentCharges};
}
