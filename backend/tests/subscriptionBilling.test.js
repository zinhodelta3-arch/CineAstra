import test from 'node:test';
import assert from 'node:assert/strict';
import {createSubscriptionBillingService} from '../services/subscriptionBillingService.js';
import {chargeTotal,cycleEnd,daysLate,dueAfterCycle,lateCharges} from '../services/subscriptionBillingMath.js';
import {createIbgeIpcaProvider} from '../providers/ibgeIpcaProvider.js';

function fixture(){
  const state={s:{id_assinatura:'4',id_usuario:'7',status:'ATIVA',renovacao_automatica:1,periodicidade:'MENSAL',tipo_divisao:'TITULAR_PAGA',tipo_divisao_proximo:'DIVISAO_IGUAL',tipo_divisao_efetiva_em:'2026-11-01',preco_contratado:'10.00',fim:'2026-11-09',suspenso_por_cobranca:0},members:[{id_usuario:'9',status:'ATIVO'},{id_usuario:'11',status:'ATIVO'}],cycles:[],charges:[],milestones:new Set(),notices:[],audits:[],ipcaCalls:[],open:false};
  const model={subscription:async()=>state.s,dueSubscriptions:async()=>[{id_assinatura:'4'}],participants:async()=>state.members,cycle:async(c,id,competence)=>state.cycles.find(x=>x.competence===competence)??null,
    insertCycle:async(c,id,competence,due,mode,total,shares)=>{state.cycles.push({competence,due,mode,total,shares});return String(state.cycles.length);},
    insertCharge:async(c,id,userId,competence,amount,due)=>{state.charges.push({id_cobranca:String(state.charges.length+1),id_assinatura:id,id_usuario:userId,competencia:competence,valor_devido:amount,valor_multa_aplicada:'0.00',juros_mora:'0.00',correcao_ipca:'0.00',status:'PENDENTE',data_vencimento:due});},
    applyMode:async(c,id,mode)=>{state.s.tipo_divisao=mode;state.s.tipo_divisao_proximo=null;},
    dueCharges:async(today,limit,cursor)=>state.charges.filter(x=>BigInt(x.id_cobranca)>BigInt(cursor)&&x.status!=='PAGO'&&x.data_vencimento<today).slice(0,limit),
    charge:async(c,id)=>state.charges.find(x=>x.id_cobranca===id)??null,openIntention:async()=>state.open?{id_intencao:'1'}:null,
    updateCharges:async(c,id,fine,interest,correction,today)=>{const row=state.charges.find(x=>x.id_cobranca===id);Object.assign(row,{status:'ATRASADO',valor_multa_aplicada:fine,juros_mora:interest,correcao_ipca:correction,encargos_calculados_ate:today});},
    markLate:async(c,id)=>{state.charges.find(x=>x.id_cobranca===id).status='ATRASADO';},
    mark:async(c,id,milestone)=>{const key=`${id}:${milestone}`;if(state.milestones.has(key))return false;state.milestones.add(key);return true;},
    suspendOwner:async()=>{state.s.suspenso_por_cobranca=1;},suspendParticipant:async(c,id,user)=>{state.members.find(x=>x.id_usuario===user).status='SUSPENSO';},
    cancelSubscription:async()=>{state.s.status='CANCELADA';state.s.renovacao_automatica=0;},leaveParticipant:async(c,id,user)=>{state.members.find(x=>x.id_usuario===user).status='SAIU';},participantEvent:async()=>{},
    unpaidOther:async()=>null,resumeOwner:async()=>{state.s.suspenso_por_cobranca=0;},resumeParticipant:async(c,id,user)=>{state.members.find(x=>x.id_usuario===user).status='ATIVO';}};
  const identity={transaction:async fn=>fn({}),audit:async(c,event)=>state.audits.push(event)};
  const notifications={emit:async(c,event)=>state.notices.push(event)};
  const ipca={index:async period=>{state.ipcaCalls.push(period);return period==='202610'?10000n:10100n;}};
  return {state,model,service:createSubscriptionBillingService({model,identity,notifications,ipca})};
}

test('ciclo mensal emite cotas uma vez, aplica modo agendado e soma valor exato',async()=>{
  const f=fixture();
  const cycle=await f.service.issue('4','2026-11-10');
  assert.equal(cycle.competence,'2026-11-01');
  assert.deepEqual(cycle.shares.map(x=>x.amount),['3.34','3.33','3.33']);
  assert.equal(f.state.charges.length,3);
  assert.equal(f.state.s.tipo_divisao,'DIVISAO_IGUAL');
  assert.equal(await f.service.issue('4','2026-11-10'),null);
  assert.equal(f.state.notices.length,3);
  f.state.s.status='CANCELADA';f.state.s.fim='2026-12-09';
  assert.equal(await f.service.issue('4','2026-12-10'),null);
});

test('execuções repetidas do job não duplicam ciclo, cobrança ou aviso',async()=>{
  const f=fixture();
  await f.service.runOnce({today:'2026-11-10'});
  await f.service.runOnce({today:'2026-11-10'});
  assert.equal(f.state.cycles.length,1);
  assert.equal(f.state.charges.length,3);
  assert.equal(f.state.notices.length,3);
  await f.service.runOnce({today:'2026-11-18'});
  await f.service.runOnce({today:'2026-11-18'});
  assert.equal(f.state.notices.filter(x=>x.type==='ATRASO_ASSINATURA').length,3);
  assert.equal(f.state.notices.filter(x=>x.type==='SUSPENSAO_ASSINATURA').length,3);
});

test('assinatura anual emite somente no vencimento do ano seguinte',async()=>{
  const f=fixture();
  f.state.s.periodicidade='ANUAL';f.state.s.fim='2027-10-09';
  f.state.s.tipo_divisao_proximo=null;
  assert.equal(await f.service.issue('4','2027-10-09'),null);
  const cycle=await f.service.issue('4','2027-10-10');
  assert.equal(cycle.due,'2027-10-10');
  assert.equal(cycle.competence,'2027-10-01');
  assert.equal(f.state.charges.length,1);
});

test('fronteiras de atraso e encargos exatos preservam só o devedor',async()=>{
  const f=fixture();await f.service.issue('4','2026-11-10');
  const debtor=f.state.charges.find(x=>x.id_usuario==='9');
  await f.service.processCharge(debtor.id_cobranca,'2026-11-11');
  assert.equal(debtor.status,'ATRASADO');assert.equal(debtor.valor_multa_aplicada,'0.07');
  assert.equal(f.state.members.find(x=>x.id_usuario==='9').status,'ATIVO');
  await f.service.processCharge(debtor.id_cobranca,'2026-11-17');
  assert.equal(f.state.members.find(x=>x.id_usuario==='9').status,'ATIVO');
  await f.service.processCharge(debtor.id_cobranca,'2026-11-18');
  assert.equal(f.state.members.find(x=>x.id_usuario==='9').status,'SUSPENSO');
  assert.equal(f.state.members.find(x=>x.id_usuario==='11').status,'ATIVO');
  await f.service.processCharge(debtor.id_cobranca,'2026-11-18');
  assert.equal(f.state.notices.filter(x=>x.type==='SUSPENSAO_ASSINATURA').length,1);
  await f.service.processCharge(debtor.id_cobranca,'2026-12-10');
  assert.equal(f.state.members.find(x=>x.id_usuario==='9').status,'SUSPENSO');
  await f.service.processCharge(debtor.id_cobranca,'2026-12-11');
  assert.equal(f.state.members.find(x=>x.id_usuario==='9').status,'SAIU');
  assert.equal(f.state.s.status,'ATIVA');
  assert.equal(f.state.notices.filter(x=>x.type==='CANCELAMENTO_ASSINATURA').length,1);
});

test('titular inadimplente cancela assinatura; pagamento em curso congela encargos',async()=>{
  const f=fixture();f.state.s.tipo_divisao_proximo=null;f.state.s.tipo_divisao='TITULAR_PAGA';
  await f.service.issue('4','2026-11-10');
  f.state.open=true;await f.service.processCharge('1','2026-11-18');
  assert.equal(f.state.charges[0].valor_multa_aplicada,'0.00');
  assert.equal(f.state.s.suspenso_por_cobranca,1);
  f.state.open=false;await f.service.processCharge('1','2026-12-10');
  assert.equal(f.state.s.status,'ATIVA');
  await f.service.processCharge('1','2026-12-11');
  assert.equal(f.state.s.status,'CANCELADA');assert.equal(f.state.s.renovacao_automatica,0);
  assert.equal(f.state.charges[0].status,'ATRASADO');
});

test('juros pro rata, multa uma vez, IPCA real e calendário mensal/anual',()=>{
  assert.equal(daysLate('2026-10-10','2026-10-10'),0);
  assert.equal(daysLate('2026-10-10','2026-11-09'),30);
  assert.equal(dueAfterCycle('2026-02-27'),'2026-02-28');
  assert.equal(cycleEnd('2026-02-28','MENSAL'),'2026-03-27');
  assert.equal(cycleEnd('2026-10-10','ANUAL'),'2027-10-09');
  assert.deepEqual(lateCharges('100.00',30,10000n,10100n),{fine:'2.00',interest:'1.00',correction:'1.00'});
  assert.equal(chargeTotal({valor_devido:'100.00',valor_multa_aplicada:'2.00',juros_mora:'1.00',correcao_ipca:'-0.50'}),'102.50');
});

test('provider IBGE usa número-índice oficial e rejeita índice ausente',async()=>{
  const urls=[];const provider=createIbgeIpcaProvider({fetcher:async url=>{urls.push(url);return {ok:true,json:async()=>[{D1C:'1',D2C:'2266',D3C:'202608',V:'7633.2300000000000'}]};}});
  assert.equal(await provider.index('202608'),76332300000000000n);
  assert.equal(await provider.index('202608'),76332300000000000n);
  assert.equal(urls.length,1);
  assert.match(urls[0],/^https:\/\/apisidra\.ibge\.gov\.br\/values\/t\/1737/);
  await assert.rejects(provider.index('202609'));
});
