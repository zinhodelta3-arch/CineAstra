import test from 'node:test';
import assert from 'node:assert/strict';
import {createReportService} from '../services/reportService.js';
import {createReportModel} from '../models/reportModel.js';
import {financialQuery,auditQuery,httpQuery} from '../validators/reportValidators.js';

function fixture(role='ADMIN'){
    const identity={transaction:fn=>fn({}),activeActor:async()=>({tipo_usuario:role,id_usuario:'7'})};
    const model={payments:async()=>({captures:'2',orders:'1',charges:'0',gross:'40.00'}),refunds:async()=>({refunds:'1',refunded:'10.00'}),costs:async()=>({snapshot_orders:'1',known_cost:'12.00',missing_cost_lines:'0',margin_alert_lines:'1',projected_margin_alert_lines:'0'}),audit:async()=>[{id_auditoria:'9007199254740993',id_usuario:'7',aggregate_id:'10',event_type:'ORDER.CHECKOUT_CREATED',occurred_at:'2026-10-10 12:00:00.000',request_id:'r',payload:'SECRET'},{id_auditoria:'2',id_usuario:null,aggregate_id:'11',event_type:'ORDER.CHECKOUT_EXPIRED',occurred_at:'2026-10-10 12:01:00.000',request_id:'r2',payload:'SECRET'}],http:async()=>[{id_log:'3',id_usuario:'7',rota:'/api/orders/:id',metodo:'GET',status_code:200,tempo_resposta_ms:12,data_hora:'2026-10-10 12:00:00.000',ip_address:'127.0.0.1',dados_requisicao:'SECRET'}]};
    return {service:createReportService({model,identity}),model};
}
const q={from:'2026-10-10',to:'2026-10-11',scope:'ALL'};
test('relatório separa capturas, estorno e custo uma vez por pedido',async()=>{
    const {service}=fixture();const result=await service.finance(q,{});
    assert.equal(result.grossCaptured,'40.00');assert.equal(result.confirmedRefunds,'10.00');assert.equal(result.netCashMovement,'30.00');
    assert.equal(result.duplicateCaptureCandidates,'1');assert.equal(result.knownOrderCost,'12.00');assert.equal(result.marginAlertLines,'1');assert.equal(result.netProfitAvailable,false);
    assert.equal((await service.socialAllocation(q,{})).amount,null);
});
test('estorno de captura anterior pode gerar caixa líquido negativo sem inventar lucro',async()=>{
    const {service,model}=fixture();model.payments=async()=>({captures:'0',orders:'0',charges:'0',gross:'0.00'});
    model.costs=async()=>({snapshot_orders:'0',known_cost:'0.00',missing_cost_lines:'0',margin_alert_lines:'0',projected_margin_alert_lines:'0'});
    assert.equal((await service.finance(q,{})).netCashMovement,'-10.00');
});
test('perfil proibido falha antes das consultas; logs omitem payload, IP e user-agent',async()=>{
    const forbidden=fixture('CLIENTE');await assert.rejects(forbidden.service.finance(q,{}),{statusCode:403});
    const {service}=fixture();const filter={...q,limit:1};
    const audit=await service.audit(filter,{}),http=await service.http(filter,{});
    assert.equal(audit.pagination.nextCursor,'9007199254740993');
    assert.equal(JSON.stringify(audit).includes('SECRET'),false);
    assert.equal(JSON.stringify(http).includes('127.0.0.1'),false);
    assert.equal(http.items[0].route,'[redacted]');
    assert.equal(JSON.stringify(http).includes('SECRET'),false);
});
test('intervalo/escopo estritos e SQL parametrizado sem juntar reembolsos ao bruto',async()=>{
    assert.equal(financialQuery.safeParse({...q,scope:'ALL; DROP TABLE pagamentos'}).success,false);
    assert.equal(auditQuery.safeParse({from:q.from,to:q.to,limit:101}).success,false);
    assert.equal(httpQuery.safeParse({from:q.from,to:q.to,eventType:'ORDER.CREATED'}).success,false);
    assert.equal(financialQuery.safeParse({...q,to:'2028-10-10'}).success,false);
    const executed=[];const c={execute:async(sql,args)=>{executed.push({sql,args});return [[{}]];}};
    const model=createReportModel();await model.payments(c,q,'2026-10-10 00:00:00.000','2026-10-12 00:00:00.000');await model.refunds(c,q,'2026-10-10 00:00:00.000','2026-10-12 00:00:00.000');await model.costs(c,'2026-10-10 00:00:00.000','2026-10-12 00:00:00.000');
    assert.match(executed[0].sql,/FROM pagamentos p WHERE/);assert.doesNotMatch(executed[0].sql,/JOIN reembolso/);
    assert.match(executed[1].sql,/r.status='CONFIRMADA'/);assert.match(executed[2].sql,/SELECT DISTINCT p.id_pedido/);
    assert.equal(executed.every(x=>x.args.length===2),true);
});
