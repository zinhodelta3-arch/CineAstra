import test from 'node:test';
import assert from 'node:assert/strict';
import {orderBody} from '../validators/orderValidators.js';
import {createOrderService} from '../services/orderService.js';
import {createPricingService} from '../services/pricingService.js';

test('carrinho aceita apenas tipo unico e IDs; preço, dono e status do cliente são rejeitados',()=>{
    const line={kind:'SESSION',id:'3',seatId:'4',quantity:1};
    assert.equal(orderBody.safeParse({lines:[line],total:'0.01'}).success,false);
    assert.equal(orderBody.safeParse({lines:[line],ownerId:'9'}).success,false);
    assert.equal(orderBody.safeParse({lines:[{...line,comboId:'5'}]}).success,false);
    assert.equal(orderBody.safeParse({lines:[{...line,quantity:2}]}).success,false);
    assert.equal(orderBody.safeParse({lines:[{kind:'STREAMING',id:'2',quantity:1}]}).success,false);
    assert.equal(orderBody.safeParse({lines:[{kind:'STREAMING',id:'2',mode:'COMPRA',quantity:1}]}).success,true);
});

test('compra definitiva de streaming usa custo e preço próprios no motor 28',async()=>{
    const model={activePlan:async()=>null,parameter:async()=>({markup_bps:6000,margem_alerta_bps:2000,teto_desconto_bps:2500,ocupacao_referencia:20,meia_projecao_bps:5000,combo_passo_bps:500,atualizado_em:'2026-10-10'}),
        product:async()=>({status:'ATIVO',disponivel_streaming:1,custo_streaming_compra:'10.00',published:'16.00'}),activePromotions:async()=>[]};
    const identity={transaction:async fn=>fn({execute:async()=>[]}),activeActor:async()=>({id_usuario:'1',tipo_usuario:'CLIENTE'})};
    const pricing=createPricingService({model,identity});
    const quote=await pricing.quote({lines:[{category:'PURCHASE',id:'2',quantity:1}]},{actor:{id:'1'}});
    assert.equal(quote.total,'16.00');assert.equal(quote.lines[0].unitPrice,'16.00');assert.equal(quote.finalizable,true);
});

test('cotação valida sala, cadeira e idade; preço vem do motor 28',async()=>{
    const calls=[],user={id_usuario:'1',tipo_usuario:'CLIENTE',data_nascimento:'1990-01-01'};let occupied=false;
    const model={age:async()=>({faixa_etaria:'MAIOR_16'}),session:async()=>({id_sala:'5',id_local:'7',status:'AGENDADA',sala_status:'ATIVA',local_status:'ATIVO',filme_status:'ATIVO',disponivel_cinema:1,classificacao:'12',data:'2026-12-01'}),seat:async()=>({id_sala:'5',status:'ATIVA'}),occupiedSeat:async()=>occupied?{id_ocupacao:'9'}:null,
        };
    const identity={transaction:async fn=>fn({execute:async()=>[]}),activeActor:async()=>user};
    const pricing={quoteOnConnection:async(_,input)=>{calls.push(input);return {lines:[{category:'SESSION',id:'3',quantity:1,unitPrice:'20.00',subtotal:'20.00'}],total:'20.00',finalizable:true};}};
    const service=createOrderService({model,identity,pricing});
    const result=await service.quote({localId:'7',lines:[{kind:'SESSION',id:'3',seatId:'4',quantity:1}]},{actor:{id:'1'}});
    assert.equal(result.total,'20.00');assert.equal(calls[0].lines[0].category,'SESSION');
    occupied=true;
    await assert.rejects(service.quote({localId:'7',lines:[{kind:'SESSION',id:'3',seatId:'4',quantity:1}]},{actor:{id:'1'}}),{code:'ORDER_CONFLICT'});
    occupied=false;
    await assert.rejects(service.quote({localId:'8',lines:[{kind:'SESSION',id:'3',seatId:'4',quantity:1}]},{actor:{id:'1'}}),{code:'ORDER_CONFLICT'});
    user.data_nascimento='2020-01-01';
    await assert.rejects(service.quote({localId:'7',lines:[{kind:'SESSION',id:'3',seatId:'4',quantity:1}]},{actor:{id:'1'}}),{statusCode:403});
});

test('insumo e combo somam demanda do mesmo estoque; menor não recebe cotação finalizável',async()=>{
    const user={id_usuario:'1',tipo_usuario:'CLIENTE',data_nascimento:'2015-01-01'};
    const operational={id_local:'7',status:'DISPONIVEL',local_status:'ATIVO',fornecedor_status:'ATIVO',usuario_status:'ATIVO',vinculo_status:'ATIVO'};
    const model={age:async()=>({faixa_etaria:'ATE_16'}),input:async()=>operational,combo:async()=>({id_local:'7',ativo:1,local_status:'ATIVO'}),comboParts:async()=>[{id_insumo:'2',quantidade:2}],stock:async()=>({...operational,quantidade:3,quantidade_reservada:0})};
    const identity={transaction:async fn=>fn({execute:async()=>[]}),activeActor:async()=>user};
    const pricing={quoteOnConnection:async()=>({lines:[],total:'1.00',finalizable:true})};
    const service=createOrderService({model,identity,pricing});
    const lines=[{kind:'INPUT',id:'2',quantity:2},{kind:'COMBO',id:'3',quantity:1}];
    await assert.rejects(service.quote({localId:'7',lines},{actor:{id:'1'}}),{code:'ORDER_CONFLICT'});
    const quote=await service.quote({localId:'7',lines:[{kind:'INPUT',id:'2',quantity:1}]},{actor:{id:'1'}});
    assert.equal(quote.finalizable,false);assert.equal(quote.guardianAuthorizationRequired,true);assert.equal(quote.fees,'0.00');
});
