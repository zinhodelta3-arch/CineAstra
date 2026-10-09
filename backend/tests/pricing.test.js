import test from 'node:test';
import assert from 'node:assert/strict';
import { cents,money,basePrice,ordinaryQuote,ticketQuote } from '../services/pricingMath.js';
import { createPricingService } from '../services/pricingService.js';
import { pricingSchemas } from '../validators/pricingValidators.js';
import { createPricingModel } from '../models/pricingModel.js';
import express from 'express';
import request from 'supertest';
import { pricingRoutes } from '../routes/pricingRoutes.js';
import { createPricingController } from '../controllers/pricingController.js';
import { errorMiddleware } from '../middlewares/errorMiddleware.js';
import { ApiError } from '../utils/ApiError.js';

test('C100: markup 60%, descontos 25%, alerta sobre custo e meia legal',()=>{
    const cost=cents('100.00'),base=basePrice(cost,6000);
    assert.equal(money(base),'160.00');
    const ordinary=ordinaryQuote({cost,base,discountBps:2500,capBps:2500,minMarginBps:2000});
    assert.equal(money(ordinary.price),'120.00');assert.equal(ordinary.belowMargin,false);
    const half=ticketQuote({cost,base,halfEligible:true,capBps:2500,minMarginBps:2000,halfProjectionBps:5000});
    assert.equal(money(half.price),'80.00');assert.equal(half.benefit,'MEIA');assert.equal(half.belowCost,true);
    assert.equal(half.projectedBelowMargin,false);
    const mixed=ticketQuote({cost,base,privateDiscountBps:2500,halfEligible:true,capBps:2500,minMarginBps:2000,halfProjectionBps:5000});
    assert.equal(mixed.projectedBelowMargin,true);
    const promoted=ticketQuote({cost,base,publicDiscountBps:1000,privateDiscountBps:2500,halfEligible:true,capBps:2500,minMarginBps:2000,halfProjectionBps:5000});
    assert.equal(money(promoted.publicPrice),'144.00');assert.equal(money(promoted.halfPrice),'72.00');assert.equal(promoted.projectedBelowMargin,true);
    assert.equal(pricingSchemas.quote.safeParse({lines:[{category:'SESSION',id:'1',quantity:1,halfPreview:true}]}).success,true);
    assert.equal(pricingSchemas.quote.safeParse({lines:[{category:'SESSION',id:'1',quantity:2}]}).success,false);
    assert.equal(pricingSchemas.quote.safeParse({lines:[{category:'INPUT',id:'1',quantity:1,halfPreview:true}]}).success,false);
});

function fixture(){
    let state={usage:[],snapshots:[],published:[],audit:[],orderStatus:'EM_ANDAMENTO'},chain=Promise.resolve();
    const params={categoria:'INPUT',markup_bps:6000,margem_alerta_bps:2000,teto_desconto_bps:2500,ocupacao_referencia:20,meia_projecao_bps:5000,combo_passo_bps:500,atualizado_em:'2026-10-09'};
    const model={
        async activePlan(){return null;},async parameter(category){return {...params,categoria:category};},
        async product(category){return category==='SESSION'?{id:'11',custo_local_dia:'0.00',custo_exibicao:'2000.00',horario_inicio:'10:00:00',horario_fim:'12:00:00',status:'AGENDADA',capacidade:20,published:'160.00'}:category==='COMBO'?{id:'30',custo_operacional:'10.00',published:'336.00',ativo:1}:{id:'10',custo_receita:'80.00',custo_parceria:'20.00',published:'160.00',status:'DISPONIVEL'};},
        async comboParts(){return [{id_insumo:'10',quantidade:2,custo_receita:'80.00',custo_parceria:'20.00',status:'DISPONIVEL'}];},
        async activePromotions(){return [];},
        async referenced(){return null;},async publishPrice(c,category,id,price,annual){state.published.push({category,id,price,annual});},
        async coupon(code){return code==='PROMO25'?{id_cupom:'1',codigo:code,desconto:'25.00',validade:'2099-01-01',limite_uso:1,ativo:1}:null;},
        async couponUses(){return {total:state.usage.filter(x=>x.status!=='LIBERADO').length};},
        async order(id){return {id_pedido:id,id_usuario:'3',status:state.orderStatus};},
        async snapshot(id){return state.snapshots.find(x=>x.id_pedido===id)??null;},
        async recordCoupon(c,id,couponId,bps){state.usage.push({id_pedido:id,id_cupom:couponId,bps,status:'RESERVADO',expira_em:'2099-01-01 00:00:00'});},
        async couponUsage(id){return state.usage.find(x=>x.id_pedido===id)??null;},
        async couponById(){return {id_cupom:'1'};},
        async setCouponUsage(c,id,status){const row=state.usage.find(x=>x.id_pedido===id);row.status=status;},
        async insertSnapshot(c,id,quote){state.snapshots.push({id_pedido:id,snapshot:JSON.stringify(quote)});}
    };
    const identity={
        async activeActor(c,context){return {id_usuario:context.actor.id,tipo_usuario:context.actor.tipo};},
        async transaction(fn){const before=chain;let release;chain=new Promise(resolve=>release=resolve);await before;const saved=structuredClone(state);try{return await fn({execute:async()=>[]});}catch(e){state=saved;throw e;}finally{release();}},
        async audit(c,action,id){state.audit.push({action,id});}
    };
    const service=createPricingService({model,identity}),context={actor:{id:'3',tipo:'CLIENTE'}};
    return {service,identity,context,get state(){return state;}};
}

test('cotação não consome cupom; confirmação concorrente confirma só um pedido e snapshot',async()=>{
    const f=fixture(),input={lines:[{category:'INPUT',id:'10',quantity:1}],couponCode:'PROMO25'};
    const quote=await f.service.quote(input,f.context);
    assert.equal(quote.lines[0].base,'160.00');assert.equal(quote.total,'120.00');assert.equal(f.state.usage.length,0);
    assert.equal(Object.hasOwn(quote.lines[0],'cost'),false);assert.equal(Object.hasOwn(quote,'couponId'),false);
    const results=await Promise.allSettled([
        f.identity.transaction(c=>f.service.commit(c,{orderId:'100',input,context:f.context})),
        f.identity.transaction(c=>f.service.commit(c,{orderId:'101',input,context:f.context}))
    ]);
    assert.deepEqual(results.map(x=>x.status).sort(),['fulfilled','rejected']);
    assert.equal(f.state.usage.length,1);assert.equal(f.state.snapshots.length,1);
    const again=await f.identity.transaction(c=>f.service.commit(c,{orderId:f.state.snapshots[0].id_pedido,input,context:f.context}));
    assert.equal(again.total,'120.00');assert.equal(f.state.usage.length,1);
});

test('modelo usa lock do cupom e grava snapshot em SQL parametrizado',async()=>{
    const queries=[],db={async execute(sql,args){queries.push({sql,args});return [[{id_cupom:'1'}]];}};
    const m=createPricingModel(db);
    await m.coupon('PROMO25',db,true);
    assert.ok(queries[0].sql.endsWith('FOR UPDATE'));assert.deepEqual(queries[0].args,['PROMO25']);
    await m.recordCoupon(db,'9007199254740993','1',2500);
    assert.deepEqual(queries[1].args,['9007199254740993','1',2500]);
    await m.insertSnapshot(db,'9007199254740993',{total:'120.00'});
    assert.equal(queries[2].args[0],'9007199254740993');
});

test('prévia de meia usa preço público, mas não confirma direito sem prova',async()=>{
    const f=fixture(),input={lines:[{category:'SESSION',id:'11',quantity:1,halfPreview:true}]};
    const quote=await f.service.quote(input,f.context);
    assert.equal(quote.lines[0].halfPrice,'80.00');assert.equal(quote.lines[0].unitPrice,'80.00');
    assert.equal(quote.lines[0].halfEligibilityUnverified,true);assert.equal(quote.finalizable,false);
    await assert.rejects(f.identity.transaction(c=>f.service.commit(c,{orderId:'100',input,context:f.context})),{statusCode:403});
    assert.equal(f.state.snapshots.length,0);
    const admin=await f.service.adminQuote(input,{actor:{id:'1',tipo:'ADMIN'}});
    assert.equal(admin.lines[0].belowMargin,true);assert.equal(admin.lines[0].cost,'100.00');
});

test('combo aplica desconto proporcional aos itens sob teto total',async()=>{
    const f=fixture(),quote=await f.service.quote({lines:[{category:'COMBO',id:'30',quantity:1}]},f.context);
    assert.equal(quote.lines[0].base,'336.00');assert.equal(quote.lines[0].discountBps,500);
    assert.equal(quote.total,'319.20');
});

test('HTTP exige autenticação, separa ADMIN e valida corpo da cotação',async()=>{
    const app=express();app.use(express.json());app.use((req,res,next)=>{res.locals.requestId='00000000-0000-4000-8000-000000000001';next();});
    const service={quote:async input=>({lines:input.lines,total:'160.00'}),parameters:async()=>[]};
    app.use(pricingRoutes(createPricingController(service),{auth(req,res,next){const role=req.headers['x-role'];if(!role)throw ApiError.naoAutorizado();req.usuario={id:'3',tipo:role};next();}}));app.use(errorMiddleware);
    await request(app).post('/api/pricing/quote').send({lines:[{category:'INPUT',id:'10',quantity:1}]}).expect(401);
    await request(app).get('/api/admin/pricing/parameters').set('X-Role','CLIENTE').expect(403);
    await request(app).post('/api/pricing/quote').set('X-Role','CLIENTE').send({lines:[{category:'INPUT',id:'10',quantity:0}]}).expect(422);
    const result=await request(app).post('/api/pricing/quote').set('X-Role','CLIENTE').send({lines:[{category:'INPUT',id:'10',quantity:1}]}).expect(200);
    assert.equal(result.body.data.total,'160.00');
});

test('ADMIN publica preço derivado do custo, sem usar float',async()=>{
    const f=fixture(),result=await f.service.publish('INPUT','10',{actor:{id:'1',tipo:'ADMIN'}});
    assert.equal(result.price,'160.00');assert.equal(f.state.published[0].price,'160.00');
});

test('reserva de cupom só confirma com pedido pago e pode ser liberada',async()=>{
    const f=fixture(),input={lines:[{category:'INPUT',id:'10',quantity:1}],couponCode:'PROMO25'};
    await f.identity.transaction(c=>f.service.commit(c,{orderId:'100',input,context:f.context}));
    await assert.rejects(f.identity.transaction(c=>f.service.settleCoupon(c,{orderId:'100',action:'CONFIRMAR'})),{statusCode:409});
    f.state.orderStatus='PAGO';
    await f.identity.transaction(c=>f.service.settleCoupon(c,{orderId:'100',action:'CONFIRMAR'}));
    assert.equal(f.state.usage[0].status,'CONFIRMADO');
    await f.identity.transaction(c=>f.service.settleCoupon(c,{orderId:'100',action:'CONFIRMAR'}));
    assert.equal(f.state.usage.length,1);
    const released=fixture();
    await released.identity.transaction(c=>released.service.commit(c,{orderId:'101',input,context:released.context}));
    await released.identity.transaction(c=>released.service.settleCoupon(c,{orderId:'101',action:'LIBERAR'}));
    assert.equal(released.state.usage[0].status,'LIBERADO');
});
