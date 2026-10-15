import test from 'node:test';
import assert from 'node:assert/strict';
import {createPaymentService} from '../services/paymentService.js';
import {unavailablePaymentProvider} from '../providers/paymentProvider.js';
import {paymentBody} from '../validators/paymentValidators.js';
import express from 'express';
import request from 'supertest';
import {paymentWebhookRoutes} from '../routes/paymentRoutes.js';

function fixture(subscriptions){
    const row={id_intencao:'1',id_usuario:'9',chave_idempotencia:'checkout_123',id_pedido:'11',id_cobranca:null,id_metodo:'1',valor:'24.50',estado:'PREPARADA',provider:null,provider_ref:null,moeda:'BRL',ultimo_evento_em:null,metodo_provider:'gateway',provider_token:'tok_12345678',metodo_ativo:1,id_pagamento:null,pagamento_status:null};
    const events=[],audits=[],state={creates:0,order:'AGUARDANDO_PAGAMENTO',orderAmount:'24.50',consult:null};
    const model={
        lockOrder:async()=>({id_pedido:'11'}),
        intent:async()=>({...row}),byPayment:async id=>id==='7'&&row.id_pagamento?{...row}:null,
        obligation:async()=>row.id_cobranca?{valor_devido:state.orderAmount,valor_multa_aplicada:'0.00',status:state.order}:{valor:state.orderAmount,status:state.order},
        claim:async(c,r,name)=>{row.estado='ENVIADA';row.provider=name;row.id_pagamento='7';row.pagamento_status='PENDENTE';return '7';},
        setReference:async(c,id,ref)=>{row.provider_ref=ref;},
        event:async(c,name,id)=>events.find(e=>e.eventId===id)??null,
        insertEvent:async(c,e)=>{events.push({...e,id_intencao:e.intentionId});return {id:String(events.length),created:true};},
        settle:async(c,r,status,at,ref,fulfill)=>{row.pagamento_status=status;row.estado='CONCILIADA';row.ultimo_evento_em=at;row.provider_ref=ref;if(status==='APROVADO'&&fulfill)state.order='PAGO';},
        markObserved:async(c,id,at)=>{row.ultimo_evento_em=at;}
    };
    const methods={prepare:async()=>({id:'1',state:row.estado,amount:row.valor})};
    const identity={transaction:async fn=>fn({execute:async()=>[]}),activeActor:async()=>({id_usuario:'9',tipo_usuario:'CLIENTE'}),audit:async(c,type)=>audits.push(type)};
    const provider={name:'gateway',available:true,async create(){state.creates++;throw new Error('timeout após captura possível');},async consult(){return state.consult;},async verifyWebhook({signature}){return signature==='valid_signature_123'?state.consult:null;}};
    const service=createPaymentService({model,methods,identity,provider,subscriptions});
    const context={actor:{id:'9',tipo:'CLIENTE'},requestId:'00000000-0000-4000-8000-000000000001'};
    const event=(id,status,at='2026-10-09T12:00:00.000Z')=>({eventId:id,intentionId:'1',transactionId:'txn_1',status,amount:'24.50',currency:'BRL',occurredAt:at});
    return {service,state,row,events,audits,context,event};
}

test('timeout após cobrança possível não redispara e permanece pendente',async()=>{
    const f=fixture(),input={orderId:'11',methodId:'1'};
    const first=await f.service.create(input,'checkout_123',f.context);
    assert.equal(first.status,'PENDENTE');assert.equal(f.state.creates,1);
    const retry=await f.service.create(input,'checkout_123',f.context);
    assert.equal(retry.id,first.id);assert.equal(f.state.creates,1);
    assert.equal(f.state.order,'AGUARDANDO_PAGAMENTO');
    assert.equal(paymentBody.safeParse({...input,status:'APROVADO'}).success,false);
});

test('valor mudado antes do despacho bloqueia cobrança antiga',async()=>{
    const f=fixture();f.state.orderAmount='25.00';
    await assert.rejects(f.service.create({orderId:'11',methodId:'1'},'checkout_123',f.context),{statusCode:409});
    assert.equal(f.state.creates,0);
});

test('webhook falso rejeitado, valor/moeda divergentes não aprovam',async()=>{
    const f=fixture();await f.service.create({orderId:'11',methodId:'1'},'checkout_123',f.context);
    const headers={'x-payment-timestamp':String(Math.floor(Date.now()/1000)),'x-payment-signature':'bad_signature_123'};
    await assert.rejects(f.service.webhook('gateway',Buffer.from('{}'),headers,f.context),{statusCode:401});
    f.state.consult={...f.event('ev_1','APROVADO'),amount:'25.00'};
    await assert.rejects(f.service.webhook('gateway',Buffer.from('{}'),{...headers,'x-payment-signature':'valid_signature_123'},f.context),{statusCode:409});
    assert.equal(f.state.order,'AGUARDANDO_PAGAMENTO');assert.equal(f.events.length,0);
});

test('webhook duplicado e antigo não repetem aprovação/outbox',async()=>{
    const f=fixture();await f.service.create({orderId:'11',methodId:'1'},'checkout_123',f.context);
    const headers={'x-payment-timestamp':String(Math.floor(Date.now()/1000)),'x-payment-signature':'valid_signature_123'};
    f.state.consult=f.event('ev_approved','APROVADO');
    await f.service.webhook('gateway',Buffer.from('{}'),headers,f.context);
    assert.equal(f.state.order,'PAGO');assert.equal(f.audits.filter(x=>x==='PAYMENT.APPROVED').length,1);
    const repeated=await f.service.webhook('gateway',Buffer.from('{}'),headers,f.context);
    assert.equal(repeated.duplicate,true);
    f.state.consult=f.event('ev_old','RECUSADO','2026-10-09T11:00:00.000Z');
    const old=await f.service.webhook('gateway',Buffer.from('{}'),headers,f.context);
    assert.equal(old.ignored,true);assert.equal(f.row.pagamento_status,'APROVADO');
    assert.equal(f.audits.filter(x=>x==='PAYMENT.APPROVED').length,1);
});

test('aprovação tardia de pedido cancelado vira revisão sem conceder direito',async()=>{
    const f=fixture();await f.service.create({orderId:'11',methodId:'1'},'checkout_123',f.context);
    f.state.order='CANCELADO';f.state.consult=f.event('ev_late','APROVADO');
    const headers={'x-payment-timestamp':String(Math.floor(Date.now()/1000)),'x-payment-signature':'valid_signature_123'};
    await f.service.webhook('gateway',Buffer.from('{}'),headers,f.context);
    assert.equal(f.row.pagamento_status,'APROVADO');assert.equal(f.state.order,'CANCELADO');
    assert.equal(f.audits.includes('PAYMENT.APPROVAL_REVIEW'),true);
});

test('cobrança de assinatura só ativa após webhook válido e obrigação elegível',async()=>{
    const calls=[];const subscriptions={canSettle:async()=>{calls.push('check');return true;},activate:async()=>calls.push('activate')};
    const f=fixture(subscriptions);f.row.id_pedido=null;f.row.id_cobranca='9007199254740993';f.state.order='PENDENTE';
    await f.service.create({chargeId:f.row.id_cobranca,methodId:'1'},'checkout_123',f.context);
    assert.deepEqual(calls,[]);
    f.state.consult=f.event('subscription_approved','APROVADO');
    const headers={'x-payment-timestamp':String(Math.floor(Date.now()/1000)),'x-payment-signature':'valid_signature_123'};
    await f.service.webhook('gateway',Buffer.from('{}'),headers,f.context);
    assert.deepEqual(calls,['check','activate']);
    assert.equal(f.state.order,'PAGO');
});

test('sem provider real falha explicitamente antes de criar intenção',async()=>{
    const f=fixture(),service=createPaymentService({model:{},methods:{prepare(){throw new Error('não deve chamar');}},identity:{},provider:unavailablePaymentProvider()});
    await assert.rejects(service.create({orderId:'11',methodId:'1'},'checkout_123',f.context),{statusCode:503});
});

test('webhook recebe bytes brutos antes do parser JSON',async()=>{
    const app=express();let captured=null;
    app.use('/api/payments/webhooks',express.raw({type:'application/json'}),paymentWebhookRoutes({webhook:(req,res)=>{captured=req.body;res.status(204).end();}}));
    app.use(express.json());
    const body='{"id":"evt_1"}';
    const response=await request(app).post('/api/payments/webhooks/gateway').set('Content-Type','application/json').send(body);
    assert.equal(response.status,204);assert.equal(Buffer.isBuffer(captured),true);assert.equal(captured.toString(),body);
});
