import test from 'node:test';
import assert from 'node:assert/strict';
import {createStreamingService} from '../services/streamingService.js';
import {createOrderModel} from '../models/orderModel.js';
import {createStreamingModel} from '../models/streamingModel.js';
import {createCheckoutService} from '../services/checkoutService.js';

function fixture(){
    const state={user:'11',birth:'1990-01-01',status:'PAGO',accessStatus:'ATIVO',expiresAt:'2099-01-01 00:00:00.000',age:'MAIOR_16',classificacao:'12',signs:0,grants:[],planStatus:'ATIVA',planEnd:'2099-01-01',participantStatus:'ATIVO',participantSuspended:0,ownerSuspended:0,division:'DIVISAO_IGUAL',ownCharge:'PAGO',ownerCharge:'PAGO',catalogAccess:true};
    const row=()=>({id_acesso:'9007199254740993',id_item:'7',id_filme:'8',id_usuario:'11',tipo_streaming:'ALUGUEL',status:state.accessStatus,pedido_status:state.status,data_inicio:'2026-10-10 00:00:00.000',data_expiracao:state.expiresAt,filme_status:'ATIVO',disponivel_streaming:1,classificacao:state.classificacao,url_reproducao:'https://private-origin.example.invalid/master.m3u8'});
    const model={orderItems:async()=>[{id_item:'7',id_filme:'8',id_usuario:'11',tipo_streaming:'ALUGUEL',dias_acesso_aluguel_snapshot:3,pedido_status:'PAGO'}],clock:async()=>({agora:'2026-10-10 00:00:00.000'}),existing:async()=>state.grants.length?{id_usuario:'11',id_filme:'8',status:'ATIVO'}:null,grant:async(c,item,user,at)=>state.grants.push({item,user,at}),
        owned:async(c,id,user)=>user==='11'?row():null,list:async()=>[row()],age:async()=>state.age?{faixa_etaria:state.age}:null,
        sellableFilm:async()=>({status:'ATIVO',disponivel_streaming:1,url_reproducao:'https://private-origin.example.invalid/master.m3u8'}),
        planFilm:async()=>({id_filme:'8',status:'ATIVO',disponivel_streaming:1,classificacao:state.classificacao,url_reproducao:'https://private-origin.example.invalid/master.m3u8'}),
        planCandidates:async()=>[{id_assinatura:'9007199254740994',id_usuario:'7',status:state.planStatus,inicio:'2026-10-10',fim:state.planEnd,tipo_divisao:state.division,suspenso_por_cobranca:state.ownerSuspended,contrato_snapshot:JSON.stringify({catalogAccess:state.catalogAccess}),participante_status:state.participantStatus,participante_suspenso:state.participantSuspended,cobranca_propria:state.ownCharge,cobranca_titular:state.ownerCharge}]};
    const identity={transaction:async fn=>fn({}),activeActor:async()=>({id_usuario:state.user,tipo_usuario:'CLIENTE',data_nascimento:state.birth})};
    const provider={available:true,privateOrigin:true,deliveryHosts:['private-delivery.example.invalid'],async sign(){state.signs++;return {url:'https://private-delivery.example.invalid/watch?signature=opaque',expiresAt:new Date(Date.now()+30000).toISOString()};}};
    return {state,model,identity,provider,service:createStreamingService({model,identity,provider})};
}

test('aluguel usa snapshot e acesso só é concedido após confirmação, no mesmo checkout',async()=>{
    const calls=[];
    const c={execute:async(sql,args)=>{calls.push({sql,args});return sql.startsWith('SELECT dias_acesso')?[[{dias_acesso_aluguel:3,status:'ATIVO',disponivel_streaming:1}]]:[{insertId:'9'}];}};
    await createOrderModel().insertCheckoutItem(c,'4',{kind:'STREAMING',id:'8',mode:'ALUGUEL',quantity:1},{unitPrice:'12.00',subtotal:'12.00'});
    assert.match(calls[1].sql,/dias_acesso_aluguel_snapshot/);
    assert.equal(calls[1].args.at(-1),3);
    const f=fixture();
    assert.deepEqual(await f.service.grant({},'4'),{created:1});
    assert.deepEqual(await f.service.grant({},'4'),{created:0});
    assert.equal(f.state.grants[0].at,'2026-10-10 00:00:00.000');
    const events=[];
    const checkout=createCheckoutService({model:{hasStock:async()=>false},orders:{},identity:{},pricing:{settleCoupon:async()=>events.push('coupon')},inventory:{},seats:{},tickets:{issue:async()=>events.push('ticket')},streaming:{grant:async()=>events.push('access')}});
    await checkout.confirm({execute:async()=>[[]]},'4','11');
    assert.deepEqual(events,['coupon','ticket','access']);
});

test('lista própria não contém URL privada; play exige direito pago, vigente e dono',async()=>{
    const f=fixture(),ctx={};
    const page=await f.service.list({limit:50,cursor:'0'},ctx);
    assert.equal(page.items[0].id,'9007199254740993');
    assert.equal(JSON.stringify(page).includes('url_reproducao'),false);
    assert.equal(JSON.stringify(page).includes('private-origin'),false);
    assert.match((await f.service.play('9007199254740993',ctx)).url,/^https:\/\/private-delivery/);
    f.state.status='AGUARDANDO_PAGAMENTO';
    await assert.rejects(f.service.play('9007199254740993',ctx),{statusCode:403});
    f.state.status='PAGO';f.state.expiresAt='2020-01-01 00:00:00.000';
    await assert.rejects(f.service.play('9007199254740993',ctx),{statusCode:403});
    f.state.expiresAt='2099-01-01 00:00:00.000';f.state.user='12';
    await assert.rejects(f.service.play('9007199254740993',ctx),{statusCode:404});
    assert.equal(f.state.signs,1);
});

test('idade é revalidada em cada play e provider ausente falha fechado',async()=>{
    const f=fixture(),ctx={};
    f.state.age=null;
    await assert.rejects(f.service.play('9007199254740993',ctx),{statusCode:403});
    f.state.age='MAIOR_16';f.state.birth='2010-01-01';f.state.classificacao='18';
    await assert.rejects(f.service.play('9007199254740993',ctx),{statusCode:403});
    f.state.classificacao='12';
    const unavailable=createStreamingService({model:f.model,identity:f.identity,provider:{available:false}});
    await assert.rejects(unavailable.play('9007199254740993',ctx),{statusCode:503});
    await assert.rejects(unavailable.ensureSellable({},[{kind:'STREAMING',id:'8'}]),{statusCode:503});
});

test('URL do provider deve vir de host HTTPS permitido e ser temporária',async()=>{
    const f=fixture();
    f.provider.sign=async()=>({url:'https://public.example.invalid/film',expiresAt:new Date(Date.now()+30000).toISOString()});
    await assert.rejects(f.service.play('9007199254740993',{}),{statusCode:503});
});

test('SQL de direito usa validade congelada no aluguel e NULL na compra',async()=>{
    const calls=[],c={execute:async(sql,args)=>{calls.push({sql,args});return [{insertId:'9007199254740993'}];}};
    const model=createStreamingModel();
    await model.grant(c,{id_item:'1',id_filme:'2',tipo_streaming:'ALUGUEL',dias_acesso_aluguel_snapshot:3},'11','2026-10-10 20:00:00.000');
    await model.grant(c,{id_item:'3',id_filme:'2',tipo_streaming:'COMPRA'},'11','2026-10-10 20:00:00.000');
    assert.match(calls[0].sql,/DATE_ADD\(\?, INTERVAL \? DAY\)/);
    assert.equal(calls[0].args.at(-1),3);
    assert.match(calls[1].sql,/NULL,'ATIVO'/);
    assert.equal(calls[1].args.length,4);
});

test('aluguel legado sem snapshot não é aprovado automaticamente',async()=>{
    const f=fixture();
    f.model.orderItems=async()=>[{id_item:'7',id_filme:'8',id_usuario:'11',tipo_streaming:'ALUGUEL',dias_acesso_aluguel_snapshot:null,pedido_status:'PAGO'}];
    assert.equal(await f.service.canGrant({},'4'),false);
    await assert.rejects(f.service.grant({},'4'),{statusCode:409});
    assert.equal(f.state.grants.length,0);
});

test('streaming do plano exige benefício, cota paga, participante ativo e prazo',async()=>{
    const f=fixture();
    const result=await f.service.playWithPlan('8',{});
    assert.equal(result.subscriptionId,'9007199254740994');
    assert.equal(result.filmId,'8');
    f.state.planEnd='2020-01-01';
    await assert.rejects(f.service.playWithPlan('8',{}),{statusCode:403});
    f.state.planEnd='2099-01-01';f.state.participantStatus='SAIU';
    await assert.rejects(f.service.playWithPlan('8',{}),{statusCode:403});
    f.state.participantStatus='ATIVO';f.state.ownCharge='ATRASADO';
    await assert.rejects(f.service.playWithPlan('8',{}),{statusCode:403});
    f.state.ownCharge='PAGO';f.state.catalogAccess=false;
    await assert.rejects(f.service.playWithPlan('8',{}),{statusCode:403});
});

test('suspensão individual não retira compra avulsa paga nem direito de outro membro',async()=>{
    const f=fixture();
    f.state.participantSuspended=1;
    await assert.rejects(f.service.playWithPlan('8',{}),{statusCode:403});
    assert.match((await f.service.play('9007199254740993',{})).url,/private-delivery/);
    f.state.participantSuspended=0;f.state.ownerSuspended=1;
    assert.equal((await f.service.playWithPlan('8',{})).filmId,'8');
    f.state.division='TITULAR_PAGA';
    await assert.rejects(f.service.playWithPlan('8',{}),{statusCode:403});
});

test('participante recém aceito usa pagamento do titular até sua primeira cota',async()=>{
    const f=fixture();
    f.state.ownCharge=null;
    assert.equal((await f.service.playWithPlan('8',{})).filmId,'8');
    f.state.ownerCharge='ATRASADO';
    await assert.rejects(f.service.playWithPlan('8',{}),{statusCode:403});
    f.state.ownCharge='PENDENTE';f.state.ownerCharge='PAGO';
    await assert.rejects(f.service.playWithPlan('8',{}),{statusCode:403});
});

test('play por assinatura revalida idade e participação após assinar URL',async()=>{
    const f=fixture();
    f.state.age=null;
    await assert.rejects(f.service.playWithPlan('8',{}),{statusCode:403});
    f.state.age='MAIOR_16';
    f.provider.sign=async()=>{f.state.participantStatus='SAIU';return {url:'https://private-delivery.example.invalid/watch?signature=opaque',expiresAt:new Date(Date.now()+30000).toISOString()};};
    await assert.rejects(f.service.playWithPlan('8',{}),{statusCode:403});
});

test('modelo de plano consulta contrato e cobranças sem criar item de pedido',async()=>{
    const calls=[],c={execute:async(sql,args)=>{calls.push({sql,args});return [[]];}};
    await createStreamingModel().planCandidates(c,'9007199254740993');
    assert.match(calls[0].sql,/assinatura_participantes/);
    assert.match(calls[0].sql,/assinatura_cobrancas/);
    assert.doesNotMatch(calls[0].sql,/itens_pedido|acessos_streaming/);
    assert.deepEqual(calls[0].args,['9007199254740993','9007199254740993','9007199254740993']);
});
