import {ApiError} from '../utils/ApiError.js';
import {idString} from '../utils/dto.js';

const units=value=>{const s=String(value??'0');if(!/^\d{1,30}(?:\.\d{1,2})?$/.test(s))throw new TypeError('Decimal inválido');const [whole,fraction='']=s.split('.');return BigInt(whole)*100n+BigInt(fraction.padEnd(2,'0'));};
const amount=value=>`${value<0n?'-':''}${(value<0n?-value:value)/100n}.${String((value<0n?-value:value)%100n).padStart(2,'0')}`;
const count=value=>BigInt(String(value??0));
const window=q=>[`${q.from} 00:00:00.000`,new Date(Date.parse(`${q.to}T00:00:00Z`)+86400000).toISOString().slice(0,10)+' 00:00:00.000'];
const instant=value=>new Date(`${String(value).replace(' ','T')}Z`).toISOString();
const paged=(rows,q,map)=>{const items=rows.slice(0,q.limit);return {items:items.map(map),pagination:{limit:q.limit,nextCursor:rows.length>q.limit?idString(items.at(-1).id):null}};};
export function createReportService({model,identity,allowedRoutes=[]}){
    const routes=new Set(allowedRoutes);
    const tx=(context,fn)=>identity.transaction(async c=>{const actor=await identity.activeActor(c,context);if(actor.tipo_usuario!=='ADMIN')throw ApiError.acessoNegado();return fn(c);},context);
    return {
        finance:(q,context)=>tx(context,async c=>{const [start,end]=window(q);const paid=await model.payments(c,q,start,end),refunded=await model.refunds(c,q,start,end),cost=q.scope==='SUBSCRIPTIONS'?null:await model.costs(c,start,end);
            const gross=units(paid.gross),refunds=units(refunded.refunded),captures=count(paid.captures),orders=count(paid.orders),charges=count(paid.charges),snapshotOrders=count(cost?.snapshot_orders);
            return {period:{from:q.from,to:q.to,timeZone:'UTC'},scope:q.scope,grossCaptured:amount(gross),confirmedRefunds:amount(refunds),netCashMovement:amount(gross-refunds),captureCount:String(captures),refundCount:String(count(refunded.refunds)),duplicateCaptureCandidates:String(captures-orders-charges),orderCount:String(orders),subscriptionChargeCount:String(charges),knownOrderCost:cost?amount(units(cost.known_cost)):null,orderSnapshotCount:String(snapshotOrders),missingOrderSnapshots:String(orders-snapshotOrders),missingCostLines:String(count(cost?.missing_cost_lines)),marginAlertLines:String(count(cost?.margin_alert_lines)),projectedMarginAlertLines:String(count(cost?.projected_margin_alert_lines)),netProfitAvailable:false,notes:['Capturas e estornos são contabilizados na data de cada evento; estorno de período anterior pode tornar o movimento líquido negativo.','Custo conhecido cobre apenas snapshots de pedidos, uma vez por pedido. Não inclui custos de assinatura, despesas operacionais, tributos ou folha.']};
        }),
        socialAllocation:(q,context)=>tx(context,async()=>({period:{from:q.from,to:q.to,timeZone:'UTC'},status:'NOT_CALCULABLE',minPercent:'5.00',maxPercent:'10.00',basis:'lucro líquido apurado externamente',amount:null,reason:'Não há apuração contábil completa de custos, tributos e despesas no sistema; folha permanece fora do escopo.'})),
        audit:(q,context)=>tx(context,async c=>{const [start,end]=window(q);return paged((await model.audit(c,q,start,end)).map(r=>({id:r.id_auditoria,actorId:r.id_usuario==null?null:idString(r.id_usuario),aggregateId:r.aggregate_id,eventType:r.event_type,occurredAt:instant(r.occurred_at),requestId:r.request_id})),q,r=>({actorId:r.actorId,aggregateId:r.aggregateId,eventType:r.eventType,occurredAt:r.occurredAt,requestId:r.requestId}));}),
        http:(q,context)=>tx(context,async c=>{const [start,end]=window(q);return paged((await model.http(c,q,start,end)).map(r=>({id:r.id_log,actorId:r.id_usuario==null?null:idString(r.id_usuario),route:routes.has(r.rota)?r.rota:'[redacted]',method:r.metodo,statusCode:r.status_code,elapsedMs:r.tempo_resposta_ms,occurredAt:instant(r.data_hora)})),q,r=>({actorId:r.actorId,route:r.route,method:r.method,statusCode:r.statusCode,elapsedMs:r.elapsedMs,occurredAt:r.occurredAt}));})
    };
}
