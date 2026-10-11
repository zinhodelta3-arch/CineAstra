import test from 'node:test';
import assert from 'node:assert/strict';
import {createNewsletterDeliveryService} from '../services/newsletterDeliveryService.js';
import {createNewsletterDeliveryModel} from '../models/newsletterDeliveryModel.js';
import {unavailableNewsletterEmailProvider} from '../providers/newsletterEmailProvider.js';

function fixture(count=1){
    const state={rows:Array.from({length:count},(_,i)=>({id:String(i+1),attempts:0,status:'PENDENTE',active:true,confirmed:true,accepted:true,categoryActive:true})),sent:new Map(),claimed:[],failedSentOnce:false,bounced:false,onDelivery:null};
    let queue=Promise.resolve();
    const database={
        transaction:fn=>{const next=queue.then(()=>fn({}));queue=next.catch(()=>{});return next;},
        withConnection:fn=>fn({})
    };
    const model={activateDue:async()=>{},expireLeases:async()=>{},next:async()=>{const row=state.rows.find(x=>x.status==='PENDENTE'||x.status==='PROCESSANDO'&&x.reclaim);return row?{id_envio:row.id,tentativas:row.attempts}:null;},
        markClaim:async(c,id)=>{const row=state.rows.find(x=>x.id===id);row.status='PROCESSANDO';row.attempts++;row.reclaim=false;state.claimed.push(id);},
        delivery:async(c,id,attempt)=>{state.onDelivery?.();const row=state.rows.find(x=>x.id===id);return row.status==='PROCESSANDO'&&row.attempts===attempt&&row.active&&row.confirmed&&row.accepted&&row.categoryActive&&!state.bounced?{email:`u${id}@example.com`,assunto:'Campanha',conteudo_html:'<p>Olá</p>',conteudo_texto:'Olá'}:null;},
        cancel:async(c,id,attempt)=>{const row=state.rows.find(x=>x.id===id);if(row.attempts===attempt)row.status='CANCELADO';},
        sent:async(c,id,attempt)=>{if(state.failedSentOnce){state.failedSentOnce=false;throw new Error('DB after provider acceptance');}const row=state.rows.find(x=>x.id===id);if(row.status==='PROCESSANDO'&&row.attempts===attempt){row.status='ENVIADO';return [{affectedRows:1}];}return [{affectedRows:0}];},
        failed:async(c,id,attempt)=>{const row=state.rows.find(x=>x.id===id);if(row.status==='PROCESSANDO'&&row.attempts===attempt)row.status='FALHOU';},complete:async()=>{},
        subscriberByEmail:async()=>({id_inscrito:'1'}),suppress:async()=>{state.bounced=true;},blockActive:async()=>{state.rows[0].active=false;},cancelSubscriberQueue:async()=>{state.rows[0].status='CANCELADO';}
    };
    const provider={name:'mail',available:true,assertAvailable:async()=>{},sendCampaign:async message=>{state.sent.set(message.idempotencyKey,(state.sent.get(message.idempotencyKey)??0)+1);return {accepted:true,messageId:`provider-${message.sendId}`};},verifyBounce:async()=>({verified:true,type:'BOUNCE',eventId:'e1',email:'u1@example.com'})};
    return {state,database,model,provider,service:createNewsletterDeliveryService({database,model,provider})};
}

test('dois workers reivindicam envios distintos; chave externa é id_envio',async()=>{
    const f=fixture(2),worker2=createNewsletterDeliveryService({database:f.database,model:f.model,provider:f.provider});
    const results=await Promise.all([f.service.runOnce(),worker2.runOnce()]);
    assert.deepEqual(results.map(x=>x.state),['SENT','SENT']);
    assert.deepEqual(f.state.claimed,['1','2']);
    assert.deepEqual([...f.state.sent.keys()],['1','2']);
});

test('falha após aceite deixa lease; recuperação usa mesma chave externa',async()=>{
    const f=fixture();f.state.failedSentOnce=true;
    await assert.rejects(f.service.runOnce(),/DB after provider acceptance/);
    assert.equal(f.state.rows[0].status,'PROCESSANDO');
    f.state.rows[0].reclaim=true;
    assert.equal((await f.service.runOnce()).state,'SENT');
    assert.deepEqual(f.state.claimed,['1','1']);
    assert.deepEqual([...f.state.sent.keys()],['1']);
    assert.equal(f.state.sent.get('1'),2); // provider real deve deduplicar quando suportado
});

test('opt-out entre claim e revalidação cancela sem envio',async()=>{
    const f=fixture();f.state.onDelivery=()=>{f.state.rows[0].active=false;};
    assert.equal((await f.service.runOnce()).state,'CANCELLED');
    assert.equal(f.state.sent.size,0);
    assert.equal(f.state.rows[0].status,'CANCELADO');
});

test('provider indisponível não reivindica nem conclui ficticiamente',async()=>{
    const f=fixture();const service=createNewsletterDeliveryService({database:f.database,model:f.model,provider:unavailableNewsletterEmailProvider()});
    await assert.rejects(service.runOnce(),{statusCode:503});
    assert.deepEqual(f.state.claimed,[]);
});

test('bounce autenticado bloqueia e cancela; não autenticado não altera estado',async()=>{
    const f=fixture();
    f.provider.verifyBounce=async()=>({verified:false,type:'BOUNCE',eventId:'e1',email:'u1@example.com'});
    await assert.rejects(f.service.bounce('mail',Buffer.from('{}'),{}),{statusCode:401});
    assert.equal(f.state.bounced,false);
    f.provider.verifyBounce=async()=>({verified:true,type:'COMPLAINT',eventId:'e2',email:'u1@example.com'});
    assert.deepEqual(await f.service.bounce('mail',Buffer.from('{}'),{}),{blocked:true});
    assert.equal(f.state.bounced,true);assert.equal(f.state.rows[0].status,'CANCELADO');
});

test('SQL usa SKIP LOCKED, lease, backoff, elegibilidade e fencing por tentativa',async()=>{
    const calls=[],c={execute:async(sql,args)=>{calls.push({sql,args});return [[{id_envio:'9007199254740993',tentativas:1}]];}};
    const model=createNewsletterDeliveryModel();
    await model.next(c,5,300);await model.delivery(c,'9007199254740993',2);await model.sent(c,'9007199254740993',2,null);
    assert.match(calls[0].sql,/FOR UPDATE OF e SKIP LOCKED/);
    assert.match(calls[0].sql,/TIMESTAMPDIFF\(SECOND/);
    assert.match(calls[0].sql,/processando_desde<DATE_SUB/);
    assert.match(calls[1].sql,/sub\.confirmado_em IS NOT NULL/);
    assert.match(calls[1].sql,/pref\.aceita=TRUE AND block\.id_inscrito IS NULL/);
    assert.match(calls[2].sql,/status='PROCESSANDO' AND tentativas=\?/);
    assert.deepEqual(calls[2].args,[null,'9007199254740993',2]);
});
