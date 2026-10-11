import test from 'node:test';
import assert from 'node:assert/strict';
import {createParticipationService,divideCents,nextCompetence} from '../services/participationService.js';
import {createParticipationModel} from '../models/participationModel.js';

function fixture(maxMembers=3){
  const state={user:'7',subscription:{id_assinatura:'4',id_usuario:'7',status:'ATIVA',periodicidade:'MENSAL',tipo_divisao:'TITULAR_PAGA',tipo_divisao_proximo:null,tipo_divisao_efetiva_em:null,preco_contratado:'10.00',limite_membros_contratado:maxMembers,inicio:'2026-10-10'},invitations:[],members:[],events:[],proposal:null,votes:[],notices:[],charges:[{id_cobranca:'9007199254740993',id_usuario:'7',valor_devido:'10.00',status:'PAGO'}]};
  let serial=Promise.resolve();
  const identity={transaction:async fn=>{let release;const next=new Promise(resolve=>{release=resolve;});const previous=serial;serial=next;await previous;try{return await fn({});}finally{release();}},activeActor:async()=>({id_usuario:state.user,tipo_usuario:'CLIENTE'}),audit:async()=>{}};
  const model={subscription:async()=>state.subscription,user:async(c,id)=>({id_usuario:id,status:'ATIVO',tipo_usuario:'CLIENTE',faixa_etaria:'MAIOR_16'}),participants:async()=>state.members,participant:async(c,id,user)=>state.members.find(x=>x.id_usuario===user)??null,
    activeCount:async()=>({total:state.members.filter(x=>x.status!=='SAIU').length}),pendingCount:async()=>({total:state.invitations.filter(x=>x.status==='PENDENTE').length}),
    invitation:async(c,id)=>state.invitations.find(x=>x.id_convite===id)??null,invitationForUser:async(c,id,user)=>state.invitations.find(x=>x.id_usuario_convidado===user)??null,
    invite:async(c,id,user)=>{const i={id_convite:String(state.invitations.length+1),id_assinatura:id,id_usuario_convidado:user,status:'PENDENTE',data_convite:'2026-10-10 12:00:00.000',data_resposta:null};state.invitations.push(i);return i.id_convite;},
    myInvitations:async()=>state.invitations,resetInvitation:async(c,id)=>{state.invitations.find(x=>x.id_convite===id).status='PENDENTE';},decideInvitation:async(c,id,status)=>{state.invitations.find(x=>x.id_convite===id).status=status;},
    upsertParticipant:async(c,id,user)=>{const p=state.members.find(x=>x.id_usuario===user);if(p)p.status='ATIVO';else state.members.push({id_usuario:user,status:'ATIVO',entrada_em:'2026-10-10 12:00:00.000',saida_em:null});},
    setParticipant:async(c,id,user,status)=>{state.members.find(x=>x.id_usuario===user).status=status;},event:async(c,id,user,actor,event)=>{state.events.push({id_evento:String(state.events.length+1),id_usuario:user,id_ator:actor,evento:event,criado_em:'2026-10-10 12:00:00.000'});},events:async()=>state.events,
    pendingProposal:async()=>state.proposal?.status==='PENDENTE'?state.proposal:null,createProposal:async(c,id,owner,mode,effective)=>{state.proposal={id_proposta:'90',id_assinatura:id,id_proponente:owner,tipo_divisao:mode,competencia_efetiva:effective,status:'PENDENTE'};return '90';},
    addConsent:async(c,id,user,accepted)=>state.votes.push({id_proposta:id,id_usuario:user,status:accepted?'ACEITO':'PENDENTE'}),proposal:async()=>state.proposal,consent:async(c,id,user)=>state.votes.find(x=>x.id_usuario===user)??null,
    vote:async(c,id,user,status)=>{state.votes.find(x=>x.id_usuario===user).status=status;},pendingVotes:async()=>({total:state.votes.filter(x=>x.status==='PENDENTE').length}),closeProposal:async(c,id,status)=>{state.proposal.status=status;},scheduleMode:async(c,id,mode,effective)=>{state.subscription.tipo_divisao_proximo=mode;state.subscription.tipo_divisao_efetiva_em=effective;},charges:async()=>state.charges};
  const notifications={emit:async(c,event)=>state.notices.push(event)};
  return {state,model,service:createParticipationService({model,identity,notifications})};
}

test('centavos são distribuídos deterministicamente e somam o preço exato',()=>{
  const shares=divideCents(1000n,['9','7','11'],'DIVISAO_IGUAL','7');
  assert.deepEqual(shares,[{userId:'7',amount:'3.34'},{userId:'9',amount:'3.33'},{userId:'11',amount:'3.33'}]);
  assert.equal(shares.reduce((sum,x)=>sum+BigInt(x.amount.replace('.','')),0n),1000n);
  assert.deepEqual(divideCents(1000n,['7','9'],'TITULAR_PAGA','7'),[{userId:'7',amount:'10.00'},{userId:'9',amount:'0.00'}]);
  assert.match(nextCompetence('MENSAL',new Date('2026-12-31T23:00:00Z')),/^2027-01-01$/);
  assert.equal(nextCompetence('ANUAL',new Date('2026-12-31T23:00:00Z'),'2026-10-10'),'2027-10-01');
});

test('convites concorrentes reservam limite incluindo titular; saída preserva fatura passada',async()=>{
  const f=fixture(2);
  const results=await Promise.allSettled([f.service.invite('4','9',{}),f.service.invite('4','10',{})]);
  assert.equal(results.filter(x=>x.status==='fulfilled').length,1);
  assert.equal(results.filter(x=>x.status==='rejected')[0].reason.statusCode,409);
  f.state.user='9';
  await f.service.decide('1',true,{});
  assert.equal(f.state.members[0].status,'ATIVO');
  assert.equal((await f.service.members('4',{})).participants[0].joinedAt,'2026-10-10T12:00:00.000Z');
  const old=structuredClone(f.state.charges);
  await f.service.changeMember('4','9','SAIU',{});
  assert.equal(f.state.members[0].status,'SAIU');
  assert.deepEqual(f.state.charges,old);
  assert.equal(f.state.events.at(-1).evento,'SAIU');
  assert.equal((await f.service.currentCharges('4','2026-10-01',{})).charges.length,0);
});

test('mudança de rateio exige consentimento e só afeta prévia do próximo ciclo',async()=>{
  const f=fixture();f.state.members.push({id_usuario:'9',status:'ATIVO',entrada_em:'2026-10-10 12:00:00.000',saida_em:null});
  const proposal=await f.service.propose('4','DIVISAO_IGUAL',{});
  assert.equal(proposal.status,'PENDENTE');
  assert.equal((await f.service.preview('4',{})).divisionMode,'TITULAR_PAGA');
  f.state.user='9';
  assert.equal((await f.service.pendingDivision('4',{})).proposal.myConsent,'PENDENTE');
  assert.equal((await f.service.consent('4','90',true,{})).status,'APROVADA');
  const preview=await f.service.preview('4',{});
  assert.equal(preview.divisionMode,'DIVISAO_IGUAL');
  assert.deepEqual(preview.shares.map(x=>x.amount),['5.00','5.00']);
  assert.equal(preview.issued,false);
  assert.equal(f.state.subscription.tipo_divisao,'TITULAR_PAGA');
  assert.equal(f.state.charges[0].valor_devido,'10.00');
  assert.equal((await f.service.currentCharges('4','2026-10-01',{})).charges.length,0);
  assert.ok(f.state.notices.length>=2);
});

test('saída cancela votação pendente; suspensão é do titular e retira direito de participante',async()=>{
  const f=fixture();f.state.members.push({id_usuario:'9',status:'ATIVO'});
  await f.service.propose('4','DIVISAO_IGUAL',{});
  f.state.user='9';
  await assert.rejects(f.service.changeMember('4','9','SUSPENSO',{}),{statusCode:404});
  await f.service.changeMember('4','9','SAIU',{});
  assert.equal(f.state.proposal.status,'CANCELADA');
  await assert.rejects(f.service.preview('4',{}),{statusCode:404});
  f.state.user='7';f.state.members[0].status='ATIVO';
  await f.service.changeMember('4','9','SUSPENSO',{});
  assert.equal(f.state.members[0].status,'SUSPENSO');
});

test('model bloqueia assinatura e mantém cobranças imutáveis na consulta',async()=>{
  const calls=[];const c={execute:async(sql,args)=>{calls.push({sql,args});return [[{id_assinatura:'4'}]];}};
  await createParticipationModel().subscription(c,'4',true);
  assert.match(calls[0].sql,/FOR UPDATE$/);
  assert.equal(calls[0].args[0],'4');
});
