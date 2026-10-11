import test from 'node:test';
import assert from 'node:assert/strict';
import {createRefundService} from '../services/refundService.js';
import {refundSchemas} from '../validators/refundValidators.js';
import express from 'express';
import request from 'supertest';
import {createRefundController} from '../controllers/refundController.js';

function fixture({ageDays=2,providerMode='PENDING',planPaid=false}={}){
    const date=new Date(Date.now()-ageDays*86400000).toISOString().slice(0,19).replace('T',' ');
    const payment={id_pagamento:'7',id_pedido:planPaid?null:'11',id_cobranca:planPaid?'20':null,id_usuario:'9',valor:'24.50',status:'APROVADO',transacao_id:'txn_1',provider:'gateway',provider_ref:'txn_1',data_pedido:planPaid?null:date,assinatura_inicio:planPaid?date.slice(0,10):null,assinatura_status:planPaid?'ATIVA':null};
    const requests=[],audits=[],state={calls:0,mode:providerMode,consult:null,plan:'ATIVA'};
    const lookup=id=>{const r=requests.find(x=>x.id_reembolso===String(id));return r?{...r,pagamento_valor:payment.valor,pagamento_status:payment.status,transacao_id:payment.transacao_id,id_pedido:payment.id_pedido,id_cobranca:payment.id_cobranca,pagamento_provider:payment.provider,pagamento_provider_ref:payment.provider_ref}:null;};
    const model={
        payment:async()=>({...payment}),refund:async id=>lookup(id),byKey:async(owner,key)=>requests.find(x=>x.id_usuario===String(owner)&&x.chave_idempotencia===key)??null,
        confirmed:async()=>({total:requests.filter(x=>x.status==='CONFIRMADA').reduce((n,x)=>n+Number(x.valor_confirmado),0).toFixed(2)}),
        insert:async(c,d)=>{const prior=requests.find(x=>x.id_usuario===String(d.owner)&&x.chave_idempotencia===d.key);if(prior)return {id:prior.id_reembolso,created:false};const id=String(requests.length+1);requests.push({id_reembolso:id,id_pagamento:String(d.paymentId),id_usuario:String(d.owner),chave_idempotencia:d.key,motivo:d.reason,detalhes:d.details,dentro_prazo:d.within,termos_versao:d.termsVersion,valor_solicitado:d.amount,valor_confirmado:null,status:d.status,provider_ref:null,compensacao_status:'NAO_APLICAVEL',solicitado_em:'2026-10-10 12:00:00',prazo_resposta_em:'2026-10-15 12:00:00',respondido_em:null});return {id,created:true};},
        sent:async(c,id)=>{requests[Number(id)-1].status='ENVIADA';},reference:async(c,id,ref)=>{requests[Number(id)-1].provider_ref=ref;},
        confirmedRefund:async(c,r,amount,total)=>{const x=requests[Number(r.id_reembolso)-1];x.status='CONFIRMADA';x.valor_confirmado=amount;x.compensacao_status='PENDENTE';payment.status=total===payment.valor?'ESTORNADO':'PARCIALMENTE_ESTORNADO';},
        failed:async(c,id)=>{requests[Number(id)-1].status='FALHOU';},decision:async(c,id,status,amount,version,basis)=>{const x=requests[Number(id)-1];x.status=status;x.valor_solicitado=amount;x.termos_versao=version;x.decisao_fundamento=basis;},
        plan:async()=>({id_assinatura:'3',id_usuario:'9',status:state.plan}),latestPlanPayment:async()=>planPaid?{id_pagamento:'7'}:null,cancelPlan:async()=>{state.plan='CANCELADA';payment.assinatura_status='CANCELADA';}
    };
    const identity={transaction:async fn=>fn({execute:async()=>[]}),activeActor:async(c,ctx)=>({id_usuario:ctx.actor.id,tipo_usuario:ctx.actor.tipo}),audit:async(c,type)=>audits.push(type)};
    const provider={name:'gateway',available:true,async refund(){state.calls++;if(state.mode==='THROW')throw new Error('timeout');return {status:state.mode,refundId:'refund_1',amount:requests.at(-1).valor_solicitado,currency:'BRL'};},async consultRefund(){return state.consult;}};
    const service=createRefundService({model,identity,provider,termsVersion:'2026-10'});
    const client={actor:{id:'9',tipo:'CLIENTE'}},admin={actor:{id:'1',tipo:'ADMIN'}};
    return {service,payment,requests,audits,state,client,admin};
}

test('arrependimento em sete dias confirma recebimento e não inventa estorno',async()=>{
    const f=fixture();
    const first=await f.service.request('7',{reason:'ARREPENDIMENTO'},'refund_key_123',f.client);
    assert.equal(first.status,'RECEBIDA');assert.equal(first.requestedAmount,'24.50');assert.equal(first.confirmedAmount,null);
    assert.equal(f.state.calls,0);assert.equal(f.payment.status,'APROVADO');
    assert.ok(first.responseDueAt);
    await f.service.dispatch(first.id,f.client);
    assert.equal(f.state.calls,1);
    const retry=await f.service.request('7',{reason:'ARREPENDIMENTO'},'refund_key_123',f.client);
    assert.equal(retry.id,first.id);assert.equal(f.state.calls,1);
    await assert.rejects(f.service.get('1',{actor:{id:'8',tipo:'CLIENTE'}}),{statusCode:404});
});

test('gateway pendente e timeout só conciliam; confirmação integral gera compensação pendente',async()=>{
    const f=fixture({providerMode:'THROW'});
    const receipt=await f.service.request('7',{reason:'ARREPENDIMENTO'},'refund_key_123',f.client);
    assert.equal(receipt.status,'RECEBIDA');await f.service.dispatch(receipt.id,f.client);assert.equal(f.state.calls,1);
    f.state.consult={status:'PENDING',refundId:'refund_1',amount:'24.50',currency:'BRL'};
    assert.equal((await f.service.reconcile('1',f.client)).status,'ENVIADA');
    f.state.consult={status:'CONFIRMED',refundId:'refund_1',amount:'24.50',currency:'BRL'};
    const done=await f.service.reconcile('1',f.client);
    assert.equal(done.status,'CONFIRMADA');assert.equal(done.compensation,'PENDENTE');assert.equal(f.payment.status,'ESTORNADO');
    assert.equal(f.state.calls,1);assert.equal(f.audits.filter(x=>x.includes('CONFIRMED')).length,1);
    assert.equal((await f.service.reconcile('1',f.client)).status,'CONFIRMADA');
});

test('falha definitiva e resposta divergente não confirmam estorno',async()=>{
    const f=fixture();await f.service.request('7',{reason:'ARREPENDIMENTO'},'refund_key_123',f.client);await f.service.dispatch('1',f.client);
    f.state.consult={status:'CONFIRMED',refundId:'refund_1',amount:'25.00',currency:'BRL'};
    await assert.rejects(f.service.reconcile('1',f.client),{statusCode:409});
    assert.equal(f.payment.status,'APROVADO');
    f.state.consult={status:'FAILED',refundId:'refund_1',amount:'24.50',currency:'BRL'};
    assert.equal((await f.service.reconcile('1',f.client)).status,'FALHOU');
});

test('após sete dias fica em análise; ADMIN decide parcial com versão dos Termos',async()=>{
    const f=fixture({ageDays:9});
    const receipt=await f.service.request('7',{reason:'DEFEITO',details:'Falha na sessão'},'refund_key_123',f.client);
    assert.equal(receipt.status,'EM_ANALISE');assert.equal(f.state.calls,0);
    await assert.rejects(f.service.decide('1',{decision:'APPROVE',amount:'10.00',termsVersion:'errada',basis:'Termos aplicáveis ao defeito'},f.admin),{statusCode:422});
    const approved=await f.service.decide('1',{decision:'APPROVE',amount:'10.00',termsVersion:'2026-10',basis:'Termos aplicáveis ao defeito'},f.admin);
    assert.equal(approved.status,'RECEBIDA');assert.equal(approved.requestedAmount,'10.00');
    await f.service.dispatch('1',f.admin);
    f.state.consult={status:'CONFIRMED',refundId:'refund_1',amount:'10.00',currency:'BRL'};
    await f.service.reconcile('1',f.client);
    assert.equal(f.payment.status,'PARCIALMENTE_ESTORNADO');
    assert.equal(refundSchemas.decision.safeParse({decision:'APPROVE',termsVersion:'2026-10',basis:'Termos aplicáveis ao defeito'}).success,false);
});

test('titular cancela renovação; outro usuário não cancela',async()=>{
    const f=fixture();
    await assert.rejects(f.service.cancelPlan('3',{actor:{id:'8',tipo:'CLIENTE'}}),{statusCode:404});
    const result=await f.service.cancelPlan('3',f.client);
    assert.equal(result.status,'CANCELADA');assert.equal(f.state.plan,'CANCELADA');
});

test('cancelamento do plano pago abre reembolso próprio uma vez',async()=>{
    const f=fixture({planPaid:true});
    await assert.rejects(f.service.request('7',{reason:'CANCELAMENTO_PLANO'},'refund_key_123',f.client),{statusCode:409});
    const first=await f.service.cancelPlan('3',f.client);
    assert.equal(first.status,'CANCELADA');assert.equal(first.refund.reason,'CANCELAMENTO_PLANO');
    assert.equal(first.refund.requestedAmount,'24.50');assert.equal(f.state.calls,0);
    await f.service.dispatch(first.refund.id,f.client);assert.equal(f.state.calls,1);
    const repeat=await f.service.cancelPlan('3',f.client);
    assert.equal(repeat.refund.id,first.refund.id);assert.equal(f.state.calls,1);
});

test('HTTP confirma recebimento mesmo com despacho que nunca termina',async()=>{
    let started=false;
    const service={request:async()=>({id:'1',status:'RECEBIDA'}),dispatch:async()=>{started=true;await new Promise(()=>{});}};
    const app=express();app.use((req,res,next)=>{req.usuario={id:'9',tipo:'CLIENTE'};res.locals.requestId='00000000-0000-4000-8000-000000000001';next();});
    app.post('/refund/:id',createRefundController(service).request);
    const response=await request(app).post('/refund/7');
    assert.equal(response.status,202);assert.equal(response.body.data.status,'RECEBIDA');
    await new Promise(resolve=>setImmediate(resolve));assert.equal(started,true);
});
