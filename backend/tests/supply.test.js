import test from 'node:test';
import assert from 'node:assert/strict';
import { createSupplyService } from '../services/supplyService.js';
import { supplySchemas } from '../validators/supplyValidators.js';

function fixture(){
    let failReceipt=false;
    let state={items:[{id_insumo:'10',id_fornecedor:'5',id_local:'1',nome:'Pipoca',descricao:null,categoria:'Alimento',quantidade:4,quantidade_reservada:0,quantidade_minima:1,preco:'1.00',status:'DISPONIVEL'}],equipment:[{id_equipamento:'20',id_fornecedor:'5',id_local:'1',quantidade:1,status:'DISPONIVEL'}],sessionStatus:'AGENDADA',requests:[],shipments:[],movements:[],audit:[]};
    const model={
        async local(id){return {id_local:String(id),status:'ATIVO'};},
        async session(id){return {id_sessao:String(id),id_local:'2',status:state.sessionStatus,local_status:'ATIVO'};},
        async member(user,session){return user==='3'&&session==='7'?{id_equipe:'9'}:null;},
        async supplierByUser(user){return {id_fornecedor:user==='2'?'5':'6',status:'ATIVO'};},
        async grant(){return {supplier_status:'ATIVO',user_status:'ATIVO',tipo_usuario:'FORNECEDOR',grant_status:'ATIVO',local_status:'ATIVO'};},
        async item(kind,id){return (kind==='input'?state.items:state.equipment).find(x=>x[kind==='input'?'id_insumo':'id_equipamento']===String(id))??null;},
        async stock(localId){return {inputs:state.items.filter(x=>x.id_local===String(localId)).map(x=>({...x,id:x.id_insumo})),equipment:state.equipment.filter(x=>x.id_local===String(localId)).map(x=>({...x,id:x.id_equipamento}))};},
        async incoming(localId){return state.shipments.filter(x=>x.id_local_destino===String(localId)&&['ENVIADO','EM_TRANSITO'].includes(x.status)).map(x=>({...x,nome:'Pipoca'}));},
        async request(id){return state.requests.find(x=>x.id_solicitacao===String(id))??null;},
        async listRequests(){return state.requests;},
        async createRequest(c,d){const id=String(state.requests.length+1);state.requests.push({id_solicitacao:id,id_usuario:d.actorId,id_local:d.localId,id_sessao:d.sessionId??null,id_insumo:d.inputId??null,id_equipamento:d.equipmentId??null,quantidade:d.quantity,status:'PENDENTE',observacao:null,data_solicitacao:'2026-10-09'});return id;},
        async setRequest(c,id,status){state.requests.find(x=>x.id_solicitacao===String(id)).status=status;},
        async shipment(id){return state.shipments.find(x=>x.id_logistica===String(id))??null;},
        async shipmentByRequest(id){return state.shipments.find(x=>x.id_solicitacao===String(id))??null;},
        async listShipments(){return state.shipments;},
        async createShipment(c,d){const id=String(state.shipments.length+1);state.shipments.push({id_logistica:id,id_fornecedor:d.supplierId,id_local_origem:d.originId,id_local_destino:d.destinationId,id_solicitacao:d.requestId,id_insumo_origem:d.inputId??null,id_equipamento_origem:d.equipmentId??null,id_insumo_destino:null,quantidade:d.quantity,id_usuario_recebimento:null,data_envio:null,data_prevista:null,data_recebimento:null,status:'PENDENTE',observacao:null});return id;},
        async setShipment(c,id,status,receiver){const s=state.shipments.find(x=>x.id_logistica===String(id));s.status=status;if(status==='RECEBIDO')s.id_usuario_recebimento=receiver;},
        async setDestinationItem(c,id,itemId){state.shipments.find(x=>x.id_logistica===String(id)).id_insumo_destino=itemId;},
        async setReturned(c,id,actorId){const s=state.shipments.find(x=>x.id_logistica===String(id));s.status='DEVOLVIDO';s.id_usuario_devolucao=actorId;},
        async cloneInput(c,source,destinationId){const id=String(state.items.length+10);state.items.push({...source,id_insumo:id,id_local:destinationId,quantidade:0,quantidade_reservada:0});return id;},
        async changeInput(c,id,delta){const item=state.items.find(x=>x.id_insumo===String(id));if(!item||item.quantidade+delta<item.quantidade_reservada)return [{affectedRows:0}];item.quantidade+=delta;return [{affectedRows:1}];},
        async changeEquipment(c,id,destinationId){state.equipment.find(x=>x.id_equipamento===String(id)).id_local=destinationId;},
        async equipmentInTransit(id){return state.shipments.find(x=>x.id_equipamento_origem===String(id)&&['PENDENTE','ENVIADO','EM_TRANSITO'].includes(x.status))??null;},
        async movement(c,d){if(failReceipt&&d.type==='ENTRADA')throw new Error('history failed');state.movements.push(d);return String(state.movements.length);}
    };
    const identity={async transaction(fn){const saved=structuredClone(state);try{return await fn({execute:async()=>[]});}catch(e){state=saved;throw e;}},async activeActor(c,ctx){return {id_usuario:ctx.actor.id,tipo_usuario:ctx.actor.tipo};},async audit(c,action,id){state.audit.push({action,id});}};
    const service=createSupplyService({model,identity});
    const ctx=(id,tipo)=>({actor:{id,tipo}});
    return {service,ctx,get state(){return state;},set failReceipt(value){failReceipt=value;}};
}

test('solicitação valida item único, quantidade e vínculo de sessão/local',async()=>{
    assert.equal(supplySchemas.request.safeParse({localId:'2',sessionId:'7',inputId:'10',quantity:2}).success,true);
    assert.equal(supplySchemas.request.safeParse({localId:'2',sessionId:'7',inputId:'10',equipmentId:'20',quantity:2}).success,false);
    const f=fixture();
    await assert.rejects(f.service.createRequest({localId:'1',sessionId:'7',inputId:'10',quantity:2},f.ctx('3','COLABORADOR')),{statusCode:403});
    await assert.rejects(f.service.createRequest({localId:'2',sessionId:'7',inputId:'10',quantity:2},f.ctx('4','COLABORADOR')),{statusCode:403});
    assert.equal(f.state.requests.length,0);
});

test('envio e recebimento alteram saldos uma vez; repetição e local errado são bloqueados',async()=>{
    const f=fixture(),staff=f.ctx('3','COLABORADOR'),supplier=f.ctx('2','FORNECEDOR');
    const req=await f.service.createRequest({localId:'2',sessionId:'7',inputId:'10',quantity:2},staff);
    await assert.rejects(f.service.decide(req.id_solicitacao,'APROVADA',f.ctx('4','FORNECEDOR')),{statusCode:403});
    await f.service.decide(req.id_solicitacao,'APROVADA',supplier);
    await f.service.transitionShipment('1','send',supplier);
    assert.equal(f.state.items[0].quantidade,2);
    await assert.rejects(f.service.transitionShipment('1','receive',supplier),{statusCode:403});
    f.failReceipt=true;
    await assert.rejects(f.service.transitionShipment('1','receive',staff),/history failed/);
    assert.equal(f.state.items.length,1);assert.equal(f.state.shipments[0].status,'ENVIADO');
    f.failReceipt=false;
    await f.service.transitionShipment('1','receive',staff);
    assert.equal(f.state.items[1].id_local,'2');assert.equal(f.state.items[1].quantidade,2);
    assert.equal(f.state.movements.length,2);
    await assert.rejects(f.service.transitionShipment('1','receive',staff),{statusCode:409});
    assert.equal(f.state.movements.length,2);
    assert.equal(f.state.requests[0].status,'FINALIZADA');
});

test('estoque mostra a chegar; equipamento só volta após sessão encerrada e uma vez',async()=>{
    const f=fixture(),staff=f.ctx('3','COLABORADOR'),supplier=f.ctx('2','FORNECEDOR');
    await f.service.createRequest({localId:'2',sessionId:'7',equipmentId:'20',quantity:1},staff);
    await f.service.decide('1','APROVADA',supplier);
    assert.equal((await f.service.stock({localId:'2',sessionId:'7'},staff)).a_chegar.length,0);
    await f.service.transitionShipment('1','send',supplier);
    assert.equal((await f.service.stock({localId:'2',sessionId:'7'},staff)).a_chegar.length,1);
    await f.service.transitionShipment('1','receive',staff);
    assert.equal(f.state.equipment[0].id_local,'2');
    await assert.rejects(f.service.returnEquipment('1',staff),{statusCode:409});
    f.state.sessionStatus='ENCERRADA';
    await assert.rejects(f.service.returnEquipment('1',f.ctx('4','COLABORADOR')),{statusCode:403});
    await f.service.returnEquipment('1',staff);
    assert.equal(f.state.equipment[0].id_local,'1');
    assert.equal(f.state.movements.length,3);
    await assert.rejects(f.service.returnEquipment('1',staff),{statusCode:409});
    assert.equal(f.state.movements.length,3);
});
