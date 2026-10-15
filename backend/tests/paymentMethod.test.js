import test from 'node:test';
import assert from 'node:assert/strict';
import { createPaymentMethodService } from '../services/paymentMethodService.js';
import { unavailablePaymentProvider } from '../providers/paymentProvider.js';
import { paymentMethodSchemas } from '../validators/paymentMethodValidators.js';

function fixture(provider=unavailablePaymentProvider()) {
    const methods=[{id_metodo:'1',id_usuario:'9',tipo:'CREDITO',identificacao:'Visa final 1111',principal:1,provider:'gateway',provider_token:'tok_11111111',ativo:1}];
    const intentions=[];
    const model={
        list:async owner=>methods.filter(x=>x.id_usuario===String(owner)&&x.ativo),
        method:async id=>methods.find(x=>x.id_metodo===String(id))??null,
        ownerMethods:async()=>[],clearPrincipal:async(c,owner)=>{for(const m of methods)if(m.id_usuario===String(owner))m.principal=0;},
        setPrincipal:async(c,id,value)=>{methods.find(x=>x.id_metodo===String(id)).principal=value;},
        archive:async(c,id)=>{const m=methods.find(x=>x.id_metodo===String(id));m.ativo=0;m.principal=0;},
        insert:async(c,owner,type,identification,providerName,token,principal)=>{const id=String(methods.length+1);methods.push({id_metodo:id,id_usuario:String(owner),tipo:type,identificacao:identification,principal,provider:providerName,provider_token:token,ativo:1});return id;},
        order:async id=>id==='11'?{id_pedido:'11',id_usuario:'9',valor_total:'24.50',status:'AGUARDANDO_PAGAMENTO'}:null,
        charge:async id=>id==='20'?{id_cobranca:'20',id_usuario:'9',valor_devido:'19.95',valor_multa_aplicada:'2.00',status:'ATRASADO'}:null,
        intention:async(owner,key)=>intentions.find(x=>x.id_usuario===String(owner)&&x.chave_idempotencia===key)??null,
        insertIntention:async(c,d)=>{const existing=intentions.find(x=>x.id_usuario===String(d.owner)&&x.chave_idempotencia===d.key);if(existing)return {id:existing.id_intencao,created:false};const id=String(intentions.length+1);intentions.push({id_intencao:id,id_usuario:String(d.owner),chave_idempotencia:d.key,id_pedido:d.orderId,id_cobranca:d.chargeId,id_metodo:d.methodId,valor:d.amount,estado:'PREPARADA'});return {id,created:true};}
    };
    const identity={activeActor:async(c,ctx)=>({id_usuario:ctx.actor.id,tipo_usuario:ctx.actor.tipo}),transaction:async fn=>fn({execute:async()=>[]}),audit:async()=>{}};
    const service=createPaymentMethodService({model,identity,provider});
    const context=id=>({actor:{id,tipo:'CLIENTE'}});
    return {service,context,methods,intentions};
}

test('método alheio é invisível; provider ausente falha e não grava método',async()=>{
    const f=fixture();
    for(const action of ['tokenize','create','consult','cancel','refund','verifyWebhook'])await assert.rejects(unavailablePaymentProvider()[action](),{statusCode:503});
    assert.deepEqual(await f.service.list(f.context('8')),[]);
    await assert.rejects(f.service.get('1',f.context('8')),{statusCode:404});
    await assert.rejects(f.service.patch('1',{principal:true},f.context('8')),{statusCode:404});
    await assert.rejects(f.service.remove('1',f.context('8')),{statusCode:404});
    await assert.rejects(f.service.create({type:'CREDITO',setupReference:'setup_123456'},f.context('8')),{statusCode:503});
    assert.equal(f.methods.length,1);
});

test('token vem só do provider e nunca consta no DTO; cartão bruto é rejeitado',async()=>{
    const f=fixture({tokenize:async()=>({provider:'gateway',token:'tok_secret_123456',brand:'Visa',last4:'4242'})});
    const created=await f.service.create({type:'CREDITO',setupReference:'setup_123456'},f.context('8'));
    assert.equal(created.principal,true);
    assert.equal(JSON.stringify(created).includes('tok_secret'),false);
    assert.equal(f.methods[1].provider_token,'tok_secret_123456');
    assert.equal(paymentMethodSchemas.create.safeParse({type:'CREDITO',setupReference:'setup_123456',pan:'4111111111111111',cvv:'123'}).success,false);
    assert.equal(paymentMethodSchemas.create.safeParse({type:'CREDITO',setupReference:'setup_123456',token:'fake'}).success,false);
});

test('preparação exige obrigação própria XOR, método tokenizado e chave estável',async()=>{
    const f=fixture();const ctx=f.context('9'),c={execute:async()=>[]};
    await assert.rejects(f.service.prepare(c,{orderId:'11',chargeId:'20',methodId:'1',key:'checkout_123',context:ctx}),{statusCode:422});
    await assert.rejects(f.service.prepare(c,{orderId:'11',methodId:'1',key:'checkout_123',context:f.context('8')}),{statusCode:404});
    f.methods.push({id_metodo:'2',id_usuario:'8',tipo:'PIX',identificacao:'Pix legado',principal:0,provider:null,provider_token:null,ativo:1});
    await assert.rejects(f.service.prepare(c,{orderId:'11',methodId:'2',key:'checkout_legacy',context:ctx}),{statusCode:404});
    f.methods.push({id_metodo:'3',id_usuario:'9',tipo:'PIX',identificacao:'Pix legado',principal:0,provider:null,provider_token:null,ativo:1});
    await assert.rejects(f.service.prepare(c,{orderId:'11',methodId:'3',key:'checkout_legacy',context:ctx}),{statusCode:409});
    const first=await f.service.prepare(c,{orderId:'11',methodId:'1',key:'checkout_123',context:ctx});
    assert.deepEqual(first,{id:'1',state:'PREPARADA',amount:'24.50'});
    assert.deepEqual(await f.service.prepare(c,{orderId:'11',methodId:'1',key:'checkout_123',context:ctx}),first);
    await assert.rejects(f.service.prepare(c,{chargeId:'20',methodId:'1',key:'checkout_123',context:ctx}),{statusCode:409});
    const charge=await f.service.prepare(c,{chargeId:'20',methodId:'1',key:'subscription_20',context:ctx});
    assert.equal(charge.amount,'21.95');
    assert.equal(f.intentions.length,2);
});
