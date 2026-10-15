import test from 'node:test';
import assert from 'node:assert/strict';
import {createNewsletterCampaignService} from '../services/newsletterCampaignService.js';
import {createNewsletterCampaignModel} from '../models/newsletterCampaignModel.js';
import {newsletterCampaignOperations} from '../routes/newsletterCampaignRoutes.js';

const input={categoryId:'1',name:'Oferta de outubro',subject:'Oferta especial',html:'<p>Olá <strong>pessoa</strong></p><script>alert(1)</script><a href="javascript:alert(2)" onclick="x()">link</a>',text:'Olá pessoa'};
function fixture(role='ADMIN'){
    const state={category:{id_categoria:'1',codigo:'PROMOCOES',nome:'Promoções',descricao:null,ativo:1},campaign:null,queued:0,audit:[]};
    const model={category:async()=>state.category,categories:async()=>[state.category],createCampaign:async(c,value)=>{state.campaign={id_campanha:'7',id_categoria:value.categoryId,nome:value.name,assunto:value.subject,conteudo_html:value.html,conteudo_texto:value.text,status:'RASCUNHO',agendada_para:null};return '7';},campaign:async()=>state.campaign,patchCampaign:async(c,id,value)=>Object.assign(state.campaign,{id_categoria:value.categoryId,nome:value.name,assunto:value.subject,conteudo_html:value.html,conteudo_texto:value.text}),schedule:async(c,id,at)=>Object.assign(state.campaign,{status:'AGENDADA',agendada_para:at}),queue:async()=>{state.queued++;},cancelCampaign:async()=>{state.campaign.status='CANCELADA';},cancelQueue:async()=>{},archiveCategory:async()=>{state.category.ativo=0;},cancelCategoryCampaigns:async()=>{if(state.campaign&&state.campaign.status==='AGENDADA')state.campaign.status='CANCELADA';},cancelCategoryQueue:async()=>{}};
    const identity={transaction:async fn=>fn({}),activeActor:async()=>({tipo_usuario:role}),audit:async(c,event)=>state.audit.push(event)};
    return {state,service:createNewsletterCampaignService({model,identity})};
}

test('ADMIN cria rascunho com HTML sanitizado e texto simples obrigatório',async()=>{
    const f=fixture();const campaign=await f.service.createCampaign(input,{});
    assert.equal(campaign.status,'RASCUNHO');assert.equal(campaign.text,'Olá pessoa');
    assert.match(campaign.html,/<strong>pessoa<\/strong>/);
    assert.doesNotMatch(campaign.html,/script|javascript:|onclick|alert/);
    await assert.rejects(f.service.createCampaign({...input,html:'<script>x</script>'},{}),{statusCode:422});
    const forbidden=fixture('CLIENTE');await assert.rejects(forbidden.service.createCampaign(input,{}),{statusCode:403});
    assert.equal(forbidden.state.campaign,null);
});

test('agendamento exige futuro UTC e rascunho; cancelamento encerra fila',async()=>{
    const f=fixture();await f.service.createCampaign(input,{});
    await assert.rejects(f.service.schedule('7','2020-01-01 00:00:00',{}),{statusCode:422});
    assert.equal(f.state.queued,0);
    const at='2099-01-01 00:00:00';const campaign=await f.service.schedule('7',at,{});
    assert.equal(campaign.status,'AGENDADA');assert.equal(f.state.queued,1);
    await assert.rejects(f.service.patchCampaign('7',input,{}),{statusCode:409});
    await assert.rejects(f.service.schedule('7',at,{}),{statusCode:409});
    assert.deepEqual(await f.service.cancel('7',{}),{cancelled:true});
    assert.equal(f.state.campaign.status,'CANCELADA');
});

test('categoria inativa impede campanha e arquivamento cancela campanha agendada',async()=>{
    const f=fixture();await f.service.createCampaign(input,{});await f.service.schedule('7','2099-01-01 00:00:00',{});
    await f.service.archiveCategory('1',{});
    assert.equal(f.state.campaign.status,'CANCELADA');
    await assert.rejects(f.service.createCampaign(input,{}),{statusCode:409});
});

test('cancelamento interrompe campanha em envio e não altera entrega já concluída',async()=>{
    const f=fixture();await f.service.createCampaign(input,{});
    f.state.campaign.status='ENVIANDO';
    assert.deepEqual(await f.service.cancel('7',{}),{cancelled:true});
    assert.equal(f.state.campaign.status,'CANCELADA');
    f.state.campaign.status='CONCLUIDA';
    await assert.rejects(f.service.cancel('7',{}),{statusCode:409});
    const calls=[],c={execute:async(sql,args)=>{calls.push(sql);return [{affectedRows:1}];}};
    await createNewsletterCampaignModel().cancelQueue(c,'7');
    assert.match(calls[0],/PROCESSANDO/);
    assert.match(calls[0],/processando_desde=NULL/);
});

test('fila seleciona apenas aceite da categoria da campanha, confirmado e ATIVO, preservando ENVIADO',async()=>{
    const calls=[],c={execute:async(sql,args)=>{calls.push({sql,args});return [{affectedRows:0}];}};
    await createNewsletterCampaignModel().queue(c,'7');
    const {sql,args}=calls[0];
    assert.deepEqual(args,['7']);
    assert.match(sql,/pref\.id_categoria=cat\.id_categoria AND pref\.aceita=TRUE/);
    assert.match(sql,/cat\.ativo=TRUE/);
    assert.match(sql,/sub\.status='ATIVO' AND sub\.confirmado_em IS NOT NULL/);
    assert.match(sql,/ON DUPLICATE KEY UPDATE id_envio=newsletter_envios\.id_envio/);
    assert.doesNotMatch(sql,/status\s*=\s*'PENDENTE'/);
    const subscribers=[{category:'PROMOCOES',active:true,confirmed:true,accepted:true},{category:'LANCAMENTOS',active:true,confirmed:true,accepted:true},{category:'PROMOCOES',active:false,confirmed:true,accepted:true},{category:'PROMOCOES',active:true,confirmed:false,accepted:true},{category:'PROMOCOES',active:true,confirmed:true,accepted:false}];
    assert.deepEqual(subscribers.filter(s=>s.category==='PROMOCOES'&&s.active&&s.confirmed&&s.accepted),[subscribers[0]]);
});

test('dez rotas administrativas documentam CRUD e transições',()=>{
    assert.equal(newsletterCampaignOperations.length,10);
    assert.ok(newsletterCampaignOperations.some(x=>x.path.endsWith('/schedule')));
    assert.ok(newsletterCampaignOperations.some(x=>x.path.endsWith('/cancel')));
});
