import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import { createInventoryService } from '../services/inventoryService.js';
import { createInventoryController } from '../controllers/inventoryController.js';
import { inventoryRoutes } from '../routes/inventoryRoutes.js';
import { createInventoryModel } from '../models/inventoryModel.js';
import { errorMiddleware } from '../middlewares/errorMiddleware.js';
import { ApiError } from '../utils/ApiError.js';

function fixture() {
    let state = { inputs: [
        { id_insumo:'10',id_fornecedor:'5',id_local:'1',quantidade:1,quantidade_reservada:0,quantidade_minima:1,status:'DISPONIVEL' },
        { id_insumo:'11',id_fornecedor:'5',id_local:'1',quantidade:1,quantidade_reservada:0,quantidade_minima:0,status:'DISPONIVEL' }
    ], equipment:[{ id_equipamento:'20',id_fornecedor:'5',id_local:'1',quantidade:0,status:'DISPONIVEL' }], reservations:[], movements:[], orders:[{id_pedido:'100',status:'EM_ANDAMENTO'},{id_pedido:'101',status:'EM_ANDAMENTO'}], audit:[], nextReservation:1,nextMovement:1 };
    let chain = Promise.resolve(), failMovementAt = null;
    const model = {
        async item(kind,id) { return state[kind].find(x => x[kind === 'inputs' ? 'id_insumo' : 'id_equipamento'] === String(id)) ?? null; },
        async supplierByUser(userId) { return userId === '2' ? { id_fornecedor:'5',status:'ATIVO' } : { id_fornecedor:'6',status:'ATIVO' }; },
        async operational() { return { id_usuario:'2',fornecedor_status:'ATIVO',usuario_status:'ATIVO',tipo_usuario:'FORNECEDOR',local_status:'ATIVO',vinculo_status:'ATIVO' }; },
        async order(id) { return state.orders.find(x => x.id_pedido === String(id)) ?? null; },
        async combo(id) { return id === '30' ? { id_combo:'30',id_local:'1',ativo:1 } : null; },
        async comboItems(id) { return id === '30' ? [{id_insumo:'10',quantidade:1},{id_insumo:'11',quantidade:1}] : []; },
        async inputs(ids) { return state.inputs.filter(x => ids.includes(x.id_insumo)).sort((a,b) => Number(a.id_insumo)-Number(b.id_insumo)); },
        async reservations(orderId) { return state.reservations.filter(x => x.id_pedido === String(orderId)).sort((a,b) => Number(a.id_insumo)-Number(b.id_insumo)); },
        async insertReservation(c,orderId,inputId,count) { const id=String(state.nextReservation++); state.reservations.push({id_reserva:id,id_pedido:String(orderId),id_insumo:String(inputId),quantidade:count,status:'ATIVA'}); return id; },
        async setReservation(c,id,status) { state.reservations.find(x => x.id_reserva === String(id)).status=status; },
        async changeInput(c,id,onHand,reserved) { const row=state.inputs.find(x=>x.id_insumo===String(id)), q=row.quantidade+onHand, r=row.quantidade_reservada+reserved; if(q<0||q>2147483647||r<0||r>q) return false; row.quantidade=q;row.quantidade_reservada=r;return true; },
        async changeEquipment(c,id,delta) { const row=state.equipment.find(x=>x.id_equipamento===String(id)), q=row.quantidade+delta;if(q<0||q>2147483647)return false;row.quantidade=q;return true; },
        async insertMovement(c,data) { if (failMovementAt===state.movements.length+1) throw new Error('history failed');const id=String(state.nextMovement++);state.movements.push({id_movimentacao:id,id_insumo:data.inputId??null,id_equipamento:data.equipmentId??null,id_reserva:data.reservationId??null,id_usuario:data.actorId,tipo:data.tipo,quantidade:data.quantidade,motivo:data.motivo??null,data_movimentacao:'2026-10-09'});return id; },
        async movement(id) { return state.movements.find(x=>x.id_movimentacao===String(id))??null; },
        async listMovements(q,supplierId) { return state.movements.filter(x=>BigInt(x.id_movimentacao)>BigInt(q.cursor??'0')&&(!q.inputId||x.id_insumo===q.inputId)&&(!q.equipmentId||x.id_equipamento===q.equipmentId)&&(!supplierId||supplierId==='5')).slice(0,q.limit+1); },
        async alerts(q,supplierId) { return state.inputs.filter(x=>x.id_local===q.localId&&BigInt(x.id_insumo)>BigInt(q.cursor??'0')&&x.quantidade-x.quantidade_reservada<=x.quantidade_minima&&(!supplierId||x.id_fornecedor===supplierId)).slice(0,q.limit+1); }
    };
    const identity = {
        async transaction(work) { const previous=chain;let release;chain=new Promise(resolve=>{release=resolve;});await previous;const saved=structuredClone(state);try{return await work({execute:async()=>[]});}catch(error){state=saved;throw error;}finally{release();} },
        async activeActor(c,context) { return {id_usuario:context.actor.id,tipo_usuario:context.actor.tipo}; },
        async audit(c,action,id) { state.audit.push({action,id}); }
    };
    const service=createInventoryService({model,identity});
    const app=express();app.use(express.json());app.use((req,res,next)=>{res.locals.requestId='00000000-0000-4000-8000-000000000001';next();});
    app.use(inventoryRoutes(createInventoryController(service),{auth(req,res,next){const role=req.headers['x-role'];if(!role)throw ApiError.naoAutorizado();req.usuario={id:req.headers['x-user']??'1',tipo:role};next();}}));app.use(errorMiddleware);
    const api=(method,path,role='ADMIN',user='1')=>request(app)[method](path).set('X-Role',role).set('X-User',user);
    return {service,identity,api,get state(){return state;},set failMovementAt(n){failMovementAt=n;}};
}

test('movimento tem um item, sinal correto, propriedade e histórico atômico',async()=>{
    const f=fixture();
    await f.api('post','/api/inventory/movements').send({inputId:'10',equipmentId:'20',tipo:'ENTRADA',quantidade:1}).expect(422);
    await f.api('post','/api/inventory/movements').send({inputId:'10',tipo:'SAIDA',quantidade:1}).expect(422);
    await f.api('post','/api/inventory/movements','FORNECEDOR','3').send({inputId:'10',tipo:'ENTRADA',quantidade:1}).expect(403);
    await f.api('post','/api/inventory/movements').send({inputId:'10',tipo:'SAIDA',quantidade:-2}).expect(409);
    f.failMovementAt=1;
    await f.api('post','/api/inventory/movements').send({inputId:'10',tipo:'ENTRADA',quantidade:1}).expect(500);
    assert.equal(f.state.inputs[0].quantidade,1);assert.equal(f.state.movements.length,0);
    f.failMovementAt=null;
    const result=await f.api('post','/api/inventory/movements','FORNECEDOR','2').send({inputId:'10',tipo:'ENTRADA',quantidade:1}).expect(201);
    assert.equal(result.body.data.balance.disponivel,2);assert.equal(f.state.movements.length,1);
    await f.api('get','/api/inventory/alerts?localId=1','FORNECEDOR','2').expect(200);
    await f.api('get','/api/inventory/inputs/10','FORNECEDOR','3').expect(403);
});

test('último item concorrente: só um pedido reserva; combo bloqueia todos componentes',async()=>{
    const f=fixture(), line=[{inputId:'10',quantidade:1}];
    const results=await Promise.allSettled([f.identity.transaction(c=>f.service.reserve(c,{orderId:'100',localId:'1',lines:line})),f.identity.transaction(c=>f.service.reserve(c,{orderId:'101',localId:'1',lines:line}))]);
    assert.deepEqual(results.map(x=>x.status).sort(),['fulfilled','rejected']);
    assert.equal(f.state.inputs[0].quantidade_reservada,1);
    assert.equal(f.state.reservations.length,1);
    await assert.rejects(f.identity.transaction(c=>f.service.reserve(c,{orderId:'101',localId:'1',lines:[{comboId:'30',quantidade:1}]})),{statusCode:409});
    await f.identity.transaction(c=>f.service.transition(c,{orderId:'100',action:'LIBERAR'}));
    assert.equal(f.state.inputs[0].quantidade_reservada,0);
    await f.identity.transaction(c=>f.service.reserve(c,{orderId:'101',localId:'1',lines:[{comboId:'30',quantidade:1}]}));
    assert.equal(f.state.reservations.length,3);
    assert.equal(f.state.inputs[0].quantidade_reservada,1);assert.equal(f.state.inputs[1].quantidade_reservada,1);
});

test('consumo parcial falho volta saldo/reserva/histórico; compensação é idempotente',async()=>{
    const f=fixture();
    await f.identity.transaction(c=>f.service.reserve(c,{orderId:'100',localId:'1',lines:[{comboId:'30',quantidade:1}]}));
    f.failMovementAt=2;
    await assert.rejects(f.identity.transaction(c=>f.service.transition(c,{orderId:'100',actorId:'1',action:'CONSUMIR'})),/history failed/);
    assert.deepEqual(f.state.inputs.map(x=>[x.quantidade,x.quantidade_reservada]),[[1,1],[1,1]]);
    assert.equal(f.state.movements.length,0);
    f.failMovementAt=null;
    await f.identity.transaction(c=>f.service.transition(c,{orderId:'100',actorId:'1',action:'CONSUMIR'}));
    assert.deepEqual(f.state.inputs.map(x=>[x.quantidade,x.quantidade_reservada]),[[0,0],[0,0]]);
    await f.identity.transaction(c=>f.service.transition(c,{orderId:'100',actorId:'1',action:'CONSUMIR'}));
    assert.equal(f.state.movements.length,2);
    await f.identity.transaction(c=>f.service.transition(c,{orderId:'100',actorId:'1',action:'COMPENSAR'}));
    await f.identity.transaction(c=>f.service.transition(c,{orderId:'100',actorId:'1',action:'COMPENSAR'}));
    assert.deepEqual(f.state.inputs.map(x=>x.quantidade),[1,1]);assert.equal(f.state.movements.length,4);
});

test('SQL mantém atualização condicional e histórico parametrizado',async()=>{
    const queries=[];const db={async execute(sql,args){queries.push({sql,args});return [{affectedRows:1,insertId:'9007199254740993'}];}};
    const model=createInventoryModel(db);
    assert.equal(await model.changeInput(db,'10',-1,0),true);
    assert.ok(queries[0].sql.includes('quantidade + ? >= quantidade_reservada + ?'));
    await model.insertMovement(db,{inputId:'10',actorId:'1',tipo:'SAIDA',quantidade:-1});
    assert.ok(queries[1].sql.includes('VALUES (?,?,?,?,?,?,?)'));
    assert.equal(queries[1].args[0],'10');
});
