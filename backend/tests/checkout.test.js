import test from 'node:test';
import assert from 'node:assert/strict';
import {createCheckoutService} from '../services/checkoutService.js';
import {createPaymentService} from '../services/paymentService.js';

function fixture(contracts){
    const state={order:null,items:[],events:[],inventory:[],seats:[],coupons:[],calls:0,cancelKeys:new Map()};
    const identity={transaction:async fn=>fn({execute:async()=>[[{seats_expected:0,seats_reserved:0,stock_expected:0,stock_reserved:0,stock_invalid:0,coupon_reserved:0,coupon_expected:0}]]}),activeActor:async()=>({id_usuario:'9',tipo_usuario:'CLIENTE'}),audit:async()=>{}};
    const model={checkoutByKey:async(c,u,key)=>state.order?.key===key?state.order:null,
        createCheckout:async(c,u,key,hash)=>{state.order={id_pedido:'123',checkout_hash:hash,key,status:'EM_ANDAMENTO',valor_total:'0.00',checkout_expira_em:'2099-01-01 00:00:00.000'};return '123';},
        insertCheckoutItem:async(c,id,line,price)=>{state.items.push({line,price});return String(state.items.length);},
        finalizeCheckout:async(c,id,total)=>{state.order.status='AGUARDANDO_PAGAMENTO';state.order.valor_total=total;},
        checkoutOrder:async()=>state.order,expiredIds:async()=>state.order?.status==='AGUARDANDO_PAGAMENTO'?[{id_pedido:'123'}]:[],
        cancelExpired:async()=>{if(state.order.status!=='AGUARDANDO_PAGAMENTO')return false;state.order.status='CANCELADO';return true;},hasStock:async()=>state.inventory.length>0,
        ownOrderForCancel:async(c,id,owner)=>id==='123'&&owner==='9'?state.order:null,
        cancelKey:async(c,owner,key)=>state.cancelKeys.has(key)?{id_pedido:state.cancelKeys.get(key)}:null,
        recordCancelKey:async(c,owner,id,key)=>state.cancelKeys.set(key,id),
        hasTicket:async()=>false,orderIntentions:async()=>[],cancelPreparedIntentions:async()=>{},
        cancelPending:async()=>{state.order.status='CANCELADO';return true;}};
    const orders={quoteOnConnection:async()=>({total:'20.00',finalizable:true})};
    const pricing={commit:async(c,{input})=>({total:'20.00',couponId:'5',lines:input.lines.map(()=>({unitPrice:'20.00',subtotal:'20.00'}))}),settleCoupon:async(c,input)=>state.coupons.push(input.action)};
    const inventory={reserve:async()=>state.inventory.push('reserved'),transition:async(c,{action})=>state.inventory.push(action)};
    const seats={reserve:async()=>state.seats.push('reserved'),confirm:async()=>state.seats.push('confirmed'),releaseCancelled:async()=>state.seats.push('released')};
    const service=createCheckoutService({model,orders,identity,pricing,inventory,seats,contracts});
    return {service,state,identity};
}

test('checkout exige hash da oferta e grava contrato na mesma transação',async()=>{
    const saved=[],contracts={contract:async()=>({offerHash:'a'.repeat(64),terms:{version:'v1'}}),save:async(c,id,hash,snapshot)=>saved.push({id,hash,snapshot})};
    const {service,state}=fixture(contracts),base={lines:[{kind:'SESSION',id:'3',seatId:'4',quantity:1}]};
    await assert.rejects(service.checkout(base,'contract:1',{}),{statusCode:409});
    await assert.rejects(service.checkout({...base,acceptance:{accepted:true,offerHash:'b'.repeat(64)}},'contract:2',{}),{statusCode:409});
    assert.equal(state.order,null);
    const result=await service.checkout({...base,acceptance:{accepted:true,offerHash:'a'.repeat(64)}},'contract:3',{});
    assert.equal(result.orderId,'123');assert.equal(saved[0].hash,'a'.repeat(64));assert.equal(saved[0].snapshot.terms.version,'v1');
});

test('checkout persiste uma vez e rejeita chave com entrada diferente',async()=>{
    const {service,state}=fixture(),context={actor:{id:'9'}},input={localId:'2',lines:[{kind:'SESSION',id:'3',seatId:'4',quantity:1}]};
    const a=await service.checkout(input,'order:unique-1',context);
    const b=await service.checkout(input,'order:unique-1',context);
    assert.equal(a.orderId,'123');assert.deepEqual(b,a);assert.equal(state.items.length,1);assert.deepEqual(state.seats,['reserved']);
    await assert.rejects(service.checkout({...input,localId:'7'},'order:unique-1',context),{statusCode:409});
});

test('job cancela pedido vencido e libera assento/cupom sem confirmar direito',async()=>{
    const {service,state}=fixture(),context={actor:{id:'9'}};
    await service.checkout({lines:[{kind:'SESSION',id:'3',seatId:'4',quantity:1}]},'order:unique-2',context);
    assert.deepEqual(await service.expireBatch(),{cancelled:1});
    assert.equal(state.order.status,'CANCELADO');assert.deepEqual(state.seats,['reserved','released']);assert.deepEqual(state.coupons,['LIBERAR']);
    assert.deepEqual(await service.expireBatch(),{cancelled:0});
});

test('aprovação tardia de checkout não confirma reservas',async()=>{
    const {service:checkout,identity}=fixture();let approved=0,review=0;
    const row={id_intencao:'1',id_usuario:'9',id_pedido:'123',id_pagamento:'7',provider:'gateway',moeda:'BRL',valor:'20.00',pagamento_status:'PENDENTE',provider_ref:null,ultimo_evento_em:null};
    const model={lockOrder:async()=>({id_pedido:'123'}),intent:async()=>row,event:async()=>null,insertEvent:async()=>({created:true}),obligation:async()=>({valor:'20.00',status:'AGUARDANDO_PAGAMENTO',checkout_expira_em:'2020-01-01 00:00:00.000'}),settle:async(c,r,s,t,ref,fulfill)=>{approved+=Number(fulfill);review+=Number(!fulfill);},markObserved:async()=>{}};
    const provider={name:'gateway',available:true,create(){},consult(){},verifyWebhook:async()=>({eventId:'late:1',intentionId:'1',transactionId:'txn:1',status:'APROVADO',currency:'BRL',amount:'20.00',occurredAt:new Date().toISOString()})};
    const payment=createPaymentService({model,methods:{},identity:{...identity,audit:async()=>{}},provider,checkout});
    await payment.webhook('gateway',Buffer.from('{}'),{'x-payment-timestamp':String(Math.floor(Date.now()/1000)),'x-payment-signature':'valid_signature_123'},{});
    assert.equal(approved,0);assert.equal(review,1);
});

test('confirmação paga consome estoque e confirma assento/cupom uma única vez',async()=>{
    const {service,state}=fixture();
    await service.checkout({localId:'2',lines:[{kind:'SESSION',id:'3',seatId:'4',quantity:1},{kind:'INPUT',id:'8',quantity:1}]},'order:unique-3',{actor:{id:'9'}});
    const connection={execute:async sql=>sql.startsWith('SELECT id_item')?[[{id_item:'1',id_sessao:'3',id_assento:'4'}]]:[[{seats_expected:1,seats_reserved:1,stock_expected:1,stock_reserved:1,stock_invalid:0,coupon_expected:1,coupon_reserved:1}]]};
    assert.equal(await service.ready(connection,'123',state.order),true);
    state.order.status='PAGO';
    await service.confirm(connection,'123','9');
    assert.deepEqual(state.inventory,['reserved','CONSUMIR']);
    assert.deepEqual(state.seats,['reserved','confirmed']);
    assert.deepEqual(state.coupons,['CONFIRMAR']);
});

test('cancelamento manual libera estoque, assento e cupom uma vez',async()=>{
    const {service,state}=fixture();
    await service.checkout({localId:'2',lines:[{kind:'SESSION',id:'3',seatId:'4',quantity:1},{kind:'INPUT',id:'8',quantity:1}]},'order:cancel-1',{actor:{id:'9'}});
    const first=await service.cancel('123','cancel:once',{actor:{id:'9'}});
    assert.deepEqual(first,{orderId:'123',status:'CANCELADO'});
    assert.deepEqual(await service.cancel('123','cancel:once',{actor:{id:'9'}}),first);
    assert.deepEqual(await service.cancel('123','cancel:other',{actor:{id:'9'}}),first);
    assert.deepEqual(state.inventory,['reserved','LIBERAR']);
    assert.deepEqual(state.seats,['reserved','released']);
    assert.deepEqual(state.coupons,['LIBERAR']);
});
