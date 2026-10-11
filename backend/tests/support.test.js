import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createSupportService} from '../services/supportService.js';
import {createSupportModel} from '../models/supportModel.js';
import {supportOperations} from '../routes/supportRoutes.js';

const client={actor:{id:'2',role:'CLIENTE'}},other={actor:{id:'3',role:'CLIENTE'}},admin={actor:{id:'9',role:'ADMIN'}},admin2={actor:{id:'10',role:'ADMIN'}};
function fixture(){
    const state={ticket:null,messages:[],live:null,notifications:[],audits:[],assignments:[],now:'2026-10-11 12:00:00'};
    const model={
        create:async(c,owner,input)=>{state.ticket={id_suporte:'7',id_cliente:owner,id_atendente:null,assunto:input.subject,status:'ABERTO',data_abertura:state.now,prazo_resposta_em:'2026-10-16 12:00:00',primeira_resposta_em:null,ultima_interacao_em:state.now,data_fechamento:null};return '7';},
        support:async()=>state.ticket,ownerList:async(c,owner)=>state.ticket&&state.ticket.id_cliente===owner?[state.ticket]:[],queue:async()=>state.ticket?[state.ticket]:[],
        append:async(c,id,author,role,message)=>{const msg={id_mensagem:String(state.messages.length+1),id_autor:author,papel:role,mensagem:message,registrada_em:state.now,origem:'NOVA'};state.messages.push(msg);return msg.id_mensagem;},
        messages:async()=>state.messages,lastAdminMessage:async()=>state.messages.findLast(x=>x.papel==='ADMIN')??null,lastClientMessage:async()=>state.messages.findLast(x=>x.papel==='CLIENTE')??null,
        adminUser:async(c,id)=>id==='9'||id==='10'?{id_usuario:id}:null,
        assign:async(c,id,attendant)=>{state.ticket.id_atendente=attendant;state.assignments.push(attendant);},
        latestResponse:async(c,id,message)=>{state.ticket.primeira_resposta_em??=state.now;state.ticket.ultima_interacao_em=state.now;},
        clientInteraction:async(c,id,reopen)=>{state.ticket.ultima_interacao_em=state.now;if(reopen){state.ticket.status='ABERTO';state.ticket.primeira_resposta_em=null;}},
        live:async()=>state.live,expiredIds:async()=>state.live?[{id_suporte:'7'}]:[],expireLive:async()=>{state.live=null;},openQueue:async()=>{state.ticket.status='ABERTO';},
        startLive:async()=>{state.live={id_atendimento:'20',id_atendente:'9',iniciado_em:new Date().toISOString().replace('T',' ').replace('Z','')};state.ticket.status='EM_ATENDIMENTO';return '20';},
        endLive:async()=>{state.live=null;},resolve:async()=>{state.ticket.status='RESOLVIDO';},close:async()=>{state.ticket.status='FECHADO';state.ticket.data_fechamento=state.now;}
    };
    const identity={transaction:async fn=>fn({execute:async()=>{}}),activeActor:async(c,context)=>({id_usuario:context.actor.id,tipo_usuario:context.actor.role}),audit:async(c,event)=>state.audits.push(event)};
    const notifications={emit:async(c,event)=>state.notifications.push(event)};
    return {state,model,service:createSupportService({model,identity,notifications})};
}

test('CLIENTE abre, vê apenas próprio e histórico cresce sem substituir mensagem',async()=>{
    const f=fixture();const opened=await f.service.create({subject:'Pedido',message:'Primeira dúvida'},client);
    assert.equal(opened.status,'ABERTO');assert.equal(opened.responseDueAt,'2026-10-16 12:00:00');
    assert.equal((await f.service.get('7',client)).id,'7');
    await assert.rejects(f.service.get('7',other),{statusCode:404});
    await assert.rejects(f.service.messages('7',{limit:20,cursor:'0'},other),{statusCode:404});
    await assert.rejects(f.service.message('7',{message:'Ataque',mode:'ASYNC'},other),{statusCode:404});
    await f.service.message('7',{message:'Complemento',mode:'ASYNC'},client);
    assert.deepEqual((await f.service.messages('7',{limit:20,cursor:'0'},client)).items.map(x=>x.message),['Primeira dúvida','Complemento']);
});

test('ADMIN atribui elegível, responde e resolve; outro ADMIN não responde',async()=>{
    const f=fixture();await f.service.create({subject:'Cobrança',message:'Dúvida'},client);
    assert.equal((await f.service.get('7',admin2)).id,'7');
    assert.deepEqual((await f.service.messages('7',{limit:20,cursor:'0'},admin2)).items.map(x=>x.message),['Dúvida']);
    assert.equal((await f.service.adminQueue({limit:20,cursor:'0'},admin2)).items[0].id,'7');
    await assert.rejects(f.service.message('7',{message:'Sem atribuição',mode:'ASYNC'},admin2),{statusCode:403});
    await assert.rejects(f.service.assign('7','3',admin),{statusCode:422});
    await f.service.assign('7','9',admin);
    assert.equal((await f.service.assign('7','9',admin)).attendantId,'9');
    await assert.rejects(f.service.assign('7','10',admin2),{statusCode:409,code:'SUPPORT_CONFLICT'});
    assert.deepEqual(f.state.assignments,['9']);
    await assert.rejects(f.service.message('7',{message:'Intruso',mode:'ASYNC'},admin2),{statusCode:403});
    await assert.rejects(f.service.resolve('7',admin),{statusCode:409});
    await f.service.message('7',{message:'Resposta humana',mode:'ASYNC'},admin);
    assert.equal(f.state.notifications.length,1);
    assert.equal(f.state.notifications[0].recipientId,'2');
    assert.equal((await f.service.resolve('7',admin)).status,'RESOLVIDO');
    assert.equal((await f.service.close('7',client)).status,'FECHADO');
    await assert.rejects(f.service.message('7',{message:'Novo texto',mode:'ASYNC'},client),{statusCode:409});
});

test('limite de dez minutos encerra sessão ao vivo e devolve solicitação à fila',async()=>{
    const f=fixture();await f.service.create({subject:'Ajuda',message:'Olá'},client);await f.service.assign('7','9',admin);
    assert.equal((await f.service.startLive('7',admin)).expiresInSeconds,600);
    f.state.live.iniciado_em='2020-01-01 00:00:00';
    await assert.rejects(f.service.message('7',{message:'Tarde',mode:'LIVE'},client),{statusCode:409});
    assert.equal(f.state.ticket.status,'ABERTO');assert.equal(f.state.live,null);
    assert.equal(f.state.messages.length,1);
    assert.equal((await f.service.adminQueue({limit:20,cursor:'0'},admin)).items[0].status,'ABERTO');
});

test('encerrar live manualmente mantém demanda aberta; cliente pode reabrir resolução',async()=>{
    const f=fixture();await f.service.create({subject:'Ajuda',message:'Olá'},client);await f.service.assign('7','9',admin);
    await f.service.startLive('7',admin);assert.deepEqual(await f.service.endLive('7',admin),{status:'ABERTO',queued:true});
    await f.service.message('7',{message:'Resolvido',mode:'ASYNC'},admin);await f.service.resolve('7',admin);
    await f.service.message('7',{message:'Ainda não',mode:'ASYNC'},client);
    assert.equal(f.state.ticket.status,'ABERTO');assert.equal(f.state.ticket.primeira_resposta_em,null);
    await assert.rejects(f.service.resolve('7',admin),{statusCode:409});
});

test('job expira live após dez minutos sem fechar a demanda',async()=>{
    const f=fixture();await f.service.create({subject:'Ajuda',message:'Olá'},client);await f.service.assign('7','9',admin);
    await f.service.startLive('7',admin);f.state.live.iniciado_em='2020-01-01 00:00:00';
    assert.deepEqual(await f.service.expireBatch(),{expired:1});
    assert.equal(f.state.ticket.status,'ABERTO');assert.equal(f.state.ticket.data_fechamento,null);
    assert.deepEqual(await f.service.expireBatch(),{expired:0});
});

test('SQL e migration guardam histórico, SLA e sessão única; reembolso usa rota própria',async()=>{
    const calls=[],c={execute:async(sql,args)=>{calls.push({sql,args});return [[{id_suporte:'7'}]];}};
    await createSupportModel().messages(c,'7',20,'0');
    assert.match(calls[0].sql,/id_suporte=\? AND id_mensagem>\?/);
    assert.equal(supportOperations.length,11);
    assert.equal(supportOperations.some(x=>x.path.includes('refund')),false);
    const migration=await readFile(new URL('../migrations/20261011_27_support_history.sql',import.meta.url),'utf8');
    assert.match(migration,/INSERT INTO suporte_mensagens/);
    assert.match(migration,/UNIQUE KEY uk_suporte_atendimento_ativo/);
    assert.match(migration,/INTERVAL 10 MINUTE/);
    assert.match(migration,/INTERVAL 5 DAY/);
});
