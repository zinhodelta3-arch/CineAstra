import test from 'node:test';
import assert from 'node:assert/strict';
import { createSeatOccupancyService } from '../services/seatOccupancyService.js';

function fixture() {
    const orders = new Map([['1',{id_pedido:'1',status:'EM_ANDAMENTO'}],['2',{id_pedido:'2',status:'EM_ANDAMENTO'}]]);
    let active = null, ticket = false;
    const model = {
        order: async (_,id) => orders.get(id),
        session: async () => ({id_sessao:'3',id_sala:'4',status:'AGENDADA'}),
        room: async () => ({id_sala:'4',id_local:'5',status:'ATIVA'}),
        location: async () => ({id_local:'5',status:'ATIVO'}),
        seat: async () => ({id_assento:'6',id_sala:'4',status:'ATIVA'}),
        expire: async () => {},
        occupancy: async () => active,
        reserve: async (_,orderId) => { active={id_ocupacao:'7',id_pedido:orderId,estado:'RESERVADA'}; return '7'; },
        item: async () => ({id_item:'8',id_pedido:'1',id_sessao:'3',id_assento:'6'}),
        confirm: async (_,id,itemId) => { active={...active,id_item:itemId,estado:'CONFIRMADA'}; return true; },
        occupiedByOrder: async (_,orderId) => active?.id_pedido===orderId?[active]:[],
        liveTicket: async () => ticket ? {id_ticket:'9'} : null,
        release: async () => { active=null; }
    };
    return { service:createSeatOccupancyService(model), orders, setTicket:value=>{ticket=value;}, get active(){return active;} };
}

test('ultima cadeira: reserva exclusiva, venda historica cancelada e nova reserva',async()=>{
    const f=fixture(), c={execute:async()=>{}};
    const seat={sessionId:'3',seatId:'6'};
    assert.equal(await f.service.reserve(c,{orderId:'1',...seat}),'7');
    assert.equal(await f.service.reserve(c,{orderId:'1',...seat}),'7');
    await assert.rejects(f.service.reserve(c,{orderId:'2',...seat}),{code:'SEAT_CONFLICT'});
    await assert.rejects(f.service.confirm(c,{orderId:'1',...seat,itemId:'8'}),{code:'SEAT_CONFLICT'});
    f.orders.get('1').status='PAGO';
    assert.equal(await f.service.confirm(c,{orderId:'1',...seat,itemId:'8'}),'7');
    f.orders.get('1').status='CANCELADO';
    f.setTicket(true);
    await assert.rejects(f.service.releaseCancelled(c,{orderId:'1'}),{code:'SEAT_CONFLICT'});
    f.setTicket(false);
    assert.equal(await f.service.releaseCancelled(c,{orderId:'1'}),1);
    assert.equal(f.active,null);
    assert.equal(await f.service.reserve(c,{orderId:'2',...seat}),'7');
});
