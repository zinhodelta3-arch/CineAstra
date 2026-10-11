import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlanService} from '../services/planService.js';
import {createPlanModel} from '../models/planModel.js';
import {planCreate,planPatch,subscriptionCreate} from '../validators/planValidators.js';

function fixture(contracts){
  const state={actor:'CLIENTE',plan:{id_plano:'2',nome:'Cine Médio',descricao:'Oferta',valor_mensal:'30.00',valor_anual:'300.00',limite_membros:2,ativo:1,acesso_catalogo:1,id_combo_medio:'5',combo_gratis_mes:1,custo_beneficios_mensal:'20.00',custo_beneficios_anual:'200.00'},benefits:[{categoria:'SESSION',desconto_bps:1000}],subscription:null,charge:null,redemptions:[],audit:[]};
  const model={lockUser:async()=>({}),byKey:async()=>null,age:async()=>({faixa_etaria:'MAIOR_16'}),activeForUser:async()=>state.subscription&&['PENDENTE','ATIVA'].includes(state.subscription.status)?state.subscription:null,plan:async()=>state.plan,benefits:async()=>state.benefits,combo:async()=>({ativo:1}),
    subscribe:async(c,data)=>{state.subscription={id_assinatura:'9',id_usuario:'7',id_plano:data.planId,periodicidade:data.period,status:'PENDENTE',renovacao_automatica:data.autoRenew,inicio:'2026-10-10',fim:null,preco_contratado:data.price,contrato_snapshot:JSON.stringify(data.snapshot)};return '9';},
    initialCharge:async()=>{state.charge={id_cobranca:'9007199254740993',status:'PENDENTE'};return state.charge.id_cobranca;},subscription:async()=>state.subscription,firstCharge:async()=>state.charge,
    paidCurrent:async()=>state.charge?.status==='PAGO'?state.charge:null,existingRedemption:async()=>state.redemptions[0]??null,redeem:async(c,id,user,combo,competence)=>{state.redemptions.push({id_assinatura:id,competencia:competence});return '9007199254740994';},
    settlement:async()=>({cobranca_status:state.charge?.status,assinatura_status:state.subscription?.status,id_assinatura:'9',periodicidade:'MENSAL'}),activate:async()=>{state.subscription.status='ATIVA';state.subscription.inicio='2026-10-10';state.subscription.fim='2026-11-09';}};
  const identity={transaction:async fn=>fn({}),activeActor:async()=>({id_usuario:'7',tipo_usuario:state.actor}),audit:async(c,event)=>state.audit.push(event)};
  return {state,model,service:createPlanService({model,identity,contracts})};
}

test('assinatura exige aceite da versão vigente e preserva contrato legal',async()=>{
  let version='v1';
  const contracts={planContract:async(c,input,plan,price)=>({offerHash:version==='v1'?'a'.repeat(64):'b'.repeat(64),terms:{version},offer:{total:price}})};
  const f=fixture(contracts),input={planId:'2',period:'MENSAL',autoRenew:true,divisionMode:'TITULAR_PAGA'};
  assert.equal((await f.service.summary(input,{})).offerHash,'a'.repeat(64));
  version='v2';
  await assert.rejects(f.service.subscribe({...input,acceptance:{accepted:true,offerHash:'a'.repeat(64)}},'unique-key-legal-1',{}),{statusCode:409});
  assert.equal(f.state.subscription,null);
  const contract=await f.service.subscribe({...input,acceptance:{accepted:true,offerHash:'b'.repeat(64)}},'unique-key-legal-2',{});
  assert.equal(contract.contract.legal.terms.version,'v2');
});

test('contratação cria snapshot e cobrança, mas não concede benefício antes do pagamento',async()=>{
  const f=fixture();
  const contract=await f.service.subscribe({planId:'2',period:'MENSAL',autoRenew:true},'unique-key-123',{});
  assert.equal(contract.status,'PENDENTE');
  assert.equal(contract.chargeId,'9007199254740993');
  assert.equal(contract.contract.discounts.SESSION,1000);
  assert.equal(await f.service.canSettle({},contract.chargeId),true);
  await assert.rejects(f.service.redeem('9',{}),{statusCode:409});
  f.state.plan.valor_mensal='90.00';f.state.benefits[0].desconto_bps=5000;
  assert.equal((await f.service.ownSubscription('9',{})).contract.monthlyPrice,'30.00');
  assert.equal((await f.service.ownSubscription('9',{})).contract.discounts.SESSION,1000);
});

test('pagamento confirmado ativa contrato; resgate único mensal permanece solicitado',async()=>{
  const f=fixture();
  await f.service.subscribe({planId:'2',period:'MENSAL',autoRenew:true},'unique-key-124',{});
  f.state.charge.status='PAGO';
  await f.service.activate({},f.state.charge.id_cobranca,'2026-10-10 12:00:00');
  const claim=await f.service.redeem('9',{});
  assert.equal(claim.status,'SOLICITADO');
  assert.equal(claim.id,'9007199254740994');
  await assert.rejects(f.service.redeem('9',{}),{statusCode:409});
  assert.equal(f.state.redemptions.length,1);
});

test('assinatura cancelada e pagamento ausente impedem ativação e benefício',async()=>{
  const f=fixture();
  await f.service.subscribe({planId:'2',period:'ANUAL',autoRenew:false},'unique-key-125',{});
  f.state.subscription.status='CANCELADA';
  assert.equal(await f.service.canSettle({},f.state.charge.id_cobranca),false);
  f.state.charge.status='PAGO';
  await assert.rejects(f.service.activate({},f.state.charge.id_cobranca,'2026-10-10 12:00:00'),{statusCode:409});
  await assert.rejects(f.service.redeem('9',{}),{statusCode:409});
});

test('validação de plano e SQL preservam dinheiro e IDs grandes',async()=>{
  assert.equal(planCreate.safeParse({name:'Médio',maxMembers:2,freeComboId:'5',freeCombosPerMonth:1}).success,true);
  assert.equal(planPatch.safeParse({active:true}).success,true);
  assert.equal(subscriptionCreate.safeParse({planId:'2',period:'MENSAL'}).success,true);
  assert.equal(subscriptionCreate.safeParse({planId:'4294967296',period:'MENSAL'}).success,false);
  const statements=[];const c={execute:async(sql,args)=>{statements.push({sql,args});return [{insertId:'9007199254740993'}];}};
  const id=await createPlanModel().initialCharge(c,'9','7','30.00');
  assert.equal(id,'9007199254740993');
  assert.equal(statements[0].args.at(-1),'30.00');
  assert.match(statements[0].sql,/VALUES\(\?,\?,DATE_FORMAT/);
});

test('publicação exige margem líquida de 20% sobre preço mensal e anual',async()=>{
  const f=fixture();f.state.actor='ADMIN';f.state.plan.ativo=0;
  f.model.patch=async(c,id,input)=>{f.state.plan.ativo=input.active?1:0;};
  f.state.plan.valor_mensal='24.00';
  await assert.rejects(f.service.patch('2',{active:true},{}),{statusCode:409});
  f.state.plan.valor_mensal='25.00';
  assert.equal((await f.service.patch('2',{active:true},{})).active,true);
});
