import test from 'node:test';
import assert from 'node:assert/strict';
import {operationalOrder} from '../services/orderOperationalStatus.js';
import {createOrderService} from '../services/orderService.js';

test('estados operacionais são calculados por unidade sem alterar estado financeiro',()=>{
    const base={id_item:'1',id_ticket:'9007199254740993',id_sessao:'5',data:'2026-10-10',horario_inicio:'12:00:00',horario_fim:'14:00:00',ticket_status:'GERADO'};
    assert.equal(operationalOrder([base],Date.parse('2026-10-10T11:00:00Z')).operationalStatus,'AGENDADO');
    assert.equal(operationalOrder([base],Date.parse('2026-10-10T13:00:00Z')).operationalStatus,'ATRASADO');
    assert.equal(operationalOrder([{...base,id_sessao:null,id_combo:'2'}],Date.parse('2026-10-10T13:00:00Z')).operationalStatus,'EM_REALIZACAO');
    assert.equal(operationalOrder([base],Date.parse('2026-10-10T15:00:00Z')).operationalStatus,'ATRASADO');
    assert.equal(operationalOrder([{...base,ticket_status:'UTILIZADO',ultima_passagem:'ENTRADA'}]).operationalStatus,'PARTICIPANDO');
    assert.equal(operationalOrder([{...base,ticket_status:'UTILIZADO',ultima_passagem:'SAIDA'}]).operationalStatus,'FINALIZADO');
    assert.equal(operationalOrder([{...base,id_sessao:null,id_insumo:'2',ticket_status:'UTILIZADO'}]).operationalStatus,'FINALIZADO');
    assert.equal(operationalOrder([{...base,id_sessao:null,id_insumo:null,id_filme:'2'}]).operationalStatus,null);
    assert.equal(operationalOrder([base]).items[0].ticketId,'9007199254740993');
});

test('status do pedido exige proprietário e pagamento; pedido financeiro não é alterado',async()=>{
    const state={owner:'11',status:'PAGO'};
    const model={ownStatus:async(c,id,user)=>user===state.owner?{id_pedido:id,status:state.status}:null,operationalRows:async()=>[{id_item:'1',id_ticket:'2',id_insumo:'2',ticket_status:'UTILIZADO'}]};
    const identity={transaction:async fn=>fn({}),activeActor:async()=>({id_usuario:'11',tipo_usuario:'CLIENTE'})};
    const service=createOrderService({model,identity,pricing:{}});
    assert.equal((await service.status('99',{})).operationalStatus,'FINALIZADO');
    assert.equal(state.status,'PAGO');
    state.status='AGUARDANDO_PAGAMENTO';
    assert.equal((await service.status('99',{})).operationalStatus,null);
    state.owner='12';
    await assert.rejects(service.status('99',{}),{statusCode:404});
});
