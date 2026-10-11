import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createNewsletterService,newsletterTerms} from '../services/newsletterService.js';
import {createNewsletterModel} from '../models/newsletterModel.js';
import {unavailableNewsletterEmailProvider} from '../providers/newsletterEmailProvider.js';
import {newsletterOperations} from '../routes/newsletterRoutes.js';

function fixture(){
    const state={categories:[{id_categoria:'1',codigo:'PROMOCOES',nome:'Promoções',descricao:null},{id_categoria:'2',codigo:'LANCAMENTOS',nome:'Lançamentos',descricao:null}],subscriber:null,preferences:[],token:null,sent:[]};
    const model={categories:async()=>state.categories,byEmail:async(c,email)=>state.subscriber?.email===email?state.subscriber:null,
        insert:async(c,data)=>{state.subscriber={id_inscrito:'9',email:data.email,status:'PENDENTE',version:data.version};return '9';},
        preference:async(c,id,categoryId)=>state.preferences.push(categoryId),token:async(c,id,hash)=>{state.token={id_token:'20',id_inscrito:id,hash,finalidade:'CONFIRMACAO',utilizado_em:null,expira_em:'2099-01-01 00:00:00'};},
        tokenOwner:async(c,hash)=>state.token&&hash.equals(state.token.hash)?{id_inscrito:'9'}:null,subscriber:async()=>state.subscriber,
        lockedToken:async(c,id,hash)=>state.token&&hash.equals(state.token.hash)?state.token:null,
        useToken:async()=>{state.token.utilizado_em='2026-10-10 12:00:00';},activate:async()=>{state.subscriber.status='ATIVO';},invalidateOther:async()=>{}};
    const database={transaction:async fn=>fn({}),withConnection:async fn=>fn({})};
    const emailProvider={assertAvailable:async()=>{},sendConfirmation:async message=>state.sent.push(message)};
    return {state,model,database,emailProvider,service:createNewsletterService({database,model,emailProvider})};
}
const input={email:' Pessoa@Exemplo.com ',name:'Pessoa',accepted:true,termsVersion:newsletterTerms.version,categories:['PROMOCOES']};

test('opções expõem termo versionado e categorias independentes',async()=>{
    const f=fixture(),options=await f.service.options();
    assert.equal(options.terms.version,newsletterTerms.version);
    assert.deepEqual(options.categories.map(x=>x.code),['PROMOCOES','LANCAMENTOS']);
});

test('inscrição pendente guarda hash binário, só categoria escolhida e confirma uma vez',async()=>{
    const f=fixture();
    assert.deepEqual(await f.service.subscribe(input),{accepted:true,message:'Se a inscrição puder ser iniciada, enviaremos um link de confirmação para o e-mail informado.'});
    assert.equal(f.state.subscriber.status,'PENDENTE');
    assert.equal(f.state.subscriber.email,'pessoa@exemplo.com');
    assert.deepEqual(f.state.preferences,['1']);
    assert.equal(f.state.token.hash.length,32);
    assert.equal(f.state.sent[0].token.length,64);
    assert.deepEqual(f.state.token.hash,createHash('sha256').update(Buffer.from(f.state.sent[0].token,'hex')).digest());
    assert.deepEqual(await f.service.confirm(f.state.sent[0].token),{confirmed:true});
    assert.equal(f.state.subscriber.status,'ATIVO');
    await assert.rejects(f.service.confirm(f.state.sent[0].token),{statusCode:422});
});

test('token vencido e finalidade diversa não ativam, sem revelar inscrito',async()=>{
    const f=fixture();await f.service.subscribe(input);
    f.state.token.expira_em='2020-01-01 00:00:00';
    await assert.rejects(f.service.confirm(f.state.sent[0].token),{statusCode:422});
    assert.equal(f.state.subscriber.status,'PENDENTE');
    f.state.token.expira_em='2099-01-01 00:00:00';f.state.token.finalidade='DESCADASTRO';
    await assert.rejects(f.service.confirm(f.state.sent[0].token),{statusCode:422});
    await assert.rejects(f.service.confirm('0'.repeat(64)),{statusCode:422});
});

test('e-mail duplicado recebe resposta igual e não altera aceite nem envia token',async()=>{
    const f=fixture();const first=await f.service.subscribe(input);
    const duplicate=await f.service.subscribe({...input,categories:['LANCAMENTOS'],name:'Terceiro'});
    assert.deepEqual(duplicate,first);
    assert.deepEqual(f.state.preferences,['1']);
    assert.equal(f.state.sent.length,1);
    assert.equal(f.state.subscriber.status,'PENDENTE');
    await f.service.confirm(f.state.sent[0].token);
    assert.deepEqual(await f.service.subscribe(input),first);
    assert.equal(f.state.subscriber.status,'ATIVO');
});

test('sem provider de e-mail falha sem criar inscrição; termo/categoria inválidos são recusados',async()=>{
    const f=fixture();
    const unavailable=createNewsletterService({database:f.database,model:f.model,emailProvider:unavailableNewsletterEmailProvider()});
    await assert.rejects(unavailable.subscribe(input),{statusCode:503});
    assert.equal(f.state.subscriber,null);
    await assert.rejects(f.service.subscribe({...input,termsVersion:'antigo'}),{statusCode:422});
    await assert.rejects(f.service.subscribe({...input,accepted:false}),{statusCode:422});
    await assert.rejects(f.service.subscribe({...input,categories:['INEXISTENTE']}),{statusCode:422});
    assert.equal(f.state.subscriber,null);
});

test('SQL e contrato público não usam token puro nem revelam estado por e-mail',async()=>{
    const calls=[],c={execute:async(sql,args)=>{calls.push({sql,args});return [[{id_inscrito:'9'}]];}};
    await createNewsletterModel().token(c,'9',Buffer.alloc(32));
    assert.match(calls[0].sql,/token_hash/);
    assert.equal(Buffer.isBuffer(calls[0].args[1]),true);
    assert.deepEqual(newsletterOperations.map(x=>x.path).slice(0,3),['/api/newsletter/options','/api/newsletter/subscribe','/api/newsletter/confirm']);
});

function managementFixture(){
    const state={subscriber:{id_inscrito:'9',email:'pessoa@exemplo.com',status:'ATIVO',consentimento_em:'2026-10-10 10:00:00',confirmed:true,descadastrado_em:null},tokens:[],sent:[],prefs:new Map([['PROMOCOES',true],['LANCAMENTOS',false]]),queue:[{category:'PROMOCOES',status:'PENDENTE'},{category:'LANCAMENTOS',status:'FALHOU'},{category:'PROMOCOES',status:'ENVIADO'}]};
    const codes=[{id_categoria:'1',codigo:'PROMOCOES',nome:'Promoções'},{id_categoria:'2',codigo:'LANCAMENTOS',nome:'Lançamentos'}];
    const model={categories:async()=>codes,byEmail:async(c,email)=>email===state.subscriber.email?state.subscriber:null,
        authorizationToken:async(c,id,purpose,hash)=>state.tokens.push({id_token:String(state.tokens.length+1),id_inscrito:id,finalidade:purpose,hash,expira_em:'2099-01-01 00:00:00',utilizado_em:null}),
        tokenOwner:async(c,hash)=>state.tokens.find(x=>x.hash.equals(hash))?{id_inscrito:'9'}:null,
        subscriber:async()=>state.subscriber,lockedToken:async(c,id,hash)=>state.tokens.find(x=>x.hash.equals(hash))??null,
        preferences:async()=>codes.map(x=>({codigo:x.codigo,nome:x.nome,aceita:state.prefs.get(x.codigo)??false})),
        resetPreferences:async()=>{for(const key of state.prefs.keys())state.prefs.set(key,false);},
        acceptPreference:async(c,id,categoryId)=>state.prefs.set(codes.find(x=>x.id_categoria===categoryId).codigo,true),
        cancelDisallowed:async()=>{for(const x of state.queue)if(!state.prefs.get(x.category)&&['PENDENTE','FALHOU'].includes(x.status))x.status='CANCELADO';},
        useToken:async(c,id)=>{state.tokens.find(x=>x.id_token===id).utilizado_em='2026-10-10 12:00:00';},
        unsubscribe:async()=>{state.subscriber.status='DESCADASTRADO';state.subscriber.descadastrado_em='2026-10-10 12:00:00';},
        cancelQueue:async()=>{for(const x of state.queue)if(['PENDENTE','FALHOU'].includes(x.status))x.status='CANCELADO';},
        invalidateTokens:async()=>{for(const x of state.tokens)if(!x.utilizado_em)x.utilizado_em='2026-10-10 12:00:00';},
        restart:async(c,id,version)=>{Object.assign(state.subscriber,{status:'PENDENTE',version,confirmed:false,descadastrado_em:null});},
        suppressed:async()=>false,
        token:async(c,id,hash)=>state.tokens.push({id_token:String(state.tokens.length+1),id_inscrito:id,finalidade:'CONFIRMACAO',hash,expira_em:'2099-01-01 00:00:00',utilizado_em:null}),
        activate:async()=>{state.subscriber.status='ATIVO';state.subscriber.confirmed=true;},invalidateOther:async()=>{}};
    const database={transaction:async fn=>fn({}),withConnection:async fn=>fn({})};
    const emailProvider={assertAvailable:async()=>{},sendAuthorization:async d=>state.sent.push(d),sendConfirmation:async d=>state.sent.push(d)};
    return {state,model,service:createNewsletterService({database,model,emailProvider})};
}

test('token DESCADASTRO não gerencia preferências; GET lógico não consome GESTAO',async()=>{
    const f=managementFixture();
    await f.service.requestAuthorization({email:'pessoa@exemplo.com',purpose:'GESTAO'});
    const management=f.state.sent.at(-1).token;
    assert.equal((await f.service.viewPreferences(management)).categories[0].accepted,true);
    assert.equal((await f.service.viewPreferences(management)).categories[1].accepted,false);
    assert.equal(f.state.tokens[0].utilizado_em,null);
    await f.service.requestAuthorization({email:'pessoa@exemplo.com',purpose:'DESCADASTRO'});
    const optout=f.state.sent.at(-1).token;
    await assert.rejects(f.service.viewPreferences(optout),{statusCode:422});
    await assert.rejects(f.service.unsubscribe(management),{statusCode:422});
    await assert.rejects(f.service.viewPreferences('0'.repeat(64)),{statusCode:422});
});

test('troca independente cancela fila da categoria recusada e consome gestão',async()=>{
    const f=managementFixture();await f.service.requestAuthorization({email:'pessoa@exemplo.com',purpose:'GESTAO'});
    const token=f.state.sent.at(-1).token;
    assert.deepEqual(await f.service.changePreferences({token,categories:['LANCAMENTOS']}),{updated:true});
    assert.deepEqual([...f.state.prefs.values()],[false,true]);
    assert.deepEqual(f.state.queue.map(x=>x.status),['CANCELADO','FALHOU','ENVIADO']);
    await assert.rejects(f.service.changePreferences({token,categories:[]}),{statusCode:422});
});

test('opt-out após enfileirar cancela pendente/falho, invalida tokens e não apaga enviado',async()=>{
    const f=managementFixture();
    await f.service.requestAuthorization({email:'pessoa@exemplo.com',purpose:'GESTAO'});
    const management=f.state.sent.at(-1).token;
    await f.service.requestAuthorization({email:'pessoa@exemplo.com',purpose:'DESCADASTRO'});
    const optout=f.state.sent.at(-1).token;
    assert.deepEqual(await f.service.unsubscribe(optout),{unsubscribed:true});
    assert.equal(f.state.subscriber.status,'DESCADASTRADO');
    assert.deepEqual(f.state.queue.map(x=>x.status),['CANCELADO','CANCELADO','ENVIADO']);
    await assert.rejects(f.service.viewPreferences(management),{statusCode:422});
    await assert.rejects(f.service.unsubscribe(optout),{statusCode:422});
});

test('reinscrição exige token de gestão, novo aceite e nova confirmação',async()=>{
    const f=managementFixture();f.state.subscriber.status='DESCADASTRADO';
    await f.service.requestAuthorization({email:'pessoa@exemplo.com',purpose:'GESTAO'});
    const token=f.state.sent.at(-1).token;
    await assert.rejects(f.service.resubscribe({token,accepted:false,termsVersion:newsletterTerms.version,categories:['LANCAMENTOS']}),{statusCode:422});
    assert.deepEqual(await f.service.resubscribe({token,accepted:true,termsVersion:newsletterTerms.version,categories:['LANCAMENTOS']}),{pending:true});
    assert.equal(f.state.subscriber.status,'PENDENTE');
    assert.deepEqual([...f.state.prefs.values()],[false,true]);
    assert.equal(f.state.sent.at(-1).token.length,64);
    await assert.rejects(f.service.resubscribe({token,accepted:true,termsVersion:newsletterTerms.version,categories:['LANCAMENTOS']}),{statusCode:422});
    assert.deepEqual(await f.service.confirm(f.state.sent.at(-1).token),{confirmed:true});
    assert.equal(f.state.subscriber.status,'ATIVO');
});

test('bloqueio de bounce impede reinscrição posterior ao descadastro',async()=>{
    const f=managementFixture();f.state.subscriber.status='DESCADASTRADO';
    await f.service.requestAuthorization({email:'pessoa@exemplo.com',purpose:'GESTAO'});
    const token=f.state.sent.at(-1).token;
    f.model.suppressed=async()=>({id_inscrito:'9'});
    await assert.rejects(f.service.resubscribe({token,accepted:true,termsVersion:newsletterTerms.version,categories:['PROMOCOES']}),{statusCode:422});
    assert.equal(f.state.subscriber.status,'DESCADASTRADO');
});
