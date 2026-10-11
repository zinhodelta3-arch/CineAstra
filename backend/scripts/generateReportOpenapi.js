import {readFile,writeFile} from 'node:fs/promises';
import {reportOperations} from '../routes/reportRoutes.js';
const file=new URL('../docs/openapi.json',import.meta.url),spec=JSON.parse(await readFile(file,'utf8'));
spec.info.version='1.32.0';
spec.tags=[...spec.tags.filter(x=>x.name!=='Relatórios'),{name:'Relatórios',description:'Consulta administrativa paginada e apuração financeira sem lucro fictício.'}];
const id={type:'string',pattern:'^[1-9][0-9]{0,19}$'},count={type:'string',pattern:'^(0|[1-9][0-9]*)$'},str={type:'string'},money={type:'string',pattern:'^-?(0|[1-9][0-9]*)\\.[0-9]{2}$'};
const obj=(properties,required=Object.keys(properties))=>({type:'object',additionalProperties:false,properties,required});
const period=obj({from:{type:'string',format:'date'},to:{type:'string',format:'date'},timeZone:{type:'string',enum:['UTC']}});
const pagination=obj({limit:{type:'integer'},nextCursor:{...id,nullable:true}});
const data={
    finance:obj({period,scope:{type:'string',enum:['ALL','ORDERS','SUBSCRIPTIONS']},grossCaptured:money,confirmedRefunds:money,netCashMovement:money,captureCount:count,refundCount:count,duplicateCaptureCandidates:count,orderCount:count,subscriptionChargeCount:count,knownOrderCost:{...money,nullable:true},orderSnapshotCount:count,missingOrderSnapshots:count,missingCostLines:count,marginAlertLines:count,projectedMarginAlertLines:count,netProfitAvailable:{type:'boolean',enum:[false]},notes:{type:'array',items:str}}),
    social:obj({period,status:{type:'string',enum:['NOT_CALCULABLE']},minPercent:str,maxPercent:str,basis:str,amount:{type:'null',nullable:true},reason:str}),
    audit:obj({items:{type:'array',items:obj({actorId:{...id,nullable:true},aggregateId:id,eventType:str,occurredAt:{type:'string',format:'date-time'},requestId:str})},pagination}),
    http:obj({items:{type:'array',items:obj({actorId:{...id,nullable:true},route:str,method:str,statusCode:{type:'integer'},elapsedMs:{type:'integer'},occurredAt:{type:'string',format:'date-time'}})},pagination})
};
// OpenAPI 3.0 representa null com nullable:true, sem type:null.
data.social.properties.amount={type:'string',nullable:true};
const response=schema=>({description:'Consulta autorizada',content:{'application/json':{schema:obj({success:{type:'boolean',enum:[true]},data:schema,requestId:{type:'string',format:'uuid'}})}}});
const errors={400:'BadRequest',401:'Unauthorized',403:'Forbidden',404:'NotFound',409:'Conflict',413:'PayloadTooLarge',422:'ValidationError',429:'RateLimited',500:'InternalError',503:'Unavailable'};
for(const r of reportOperations){const common=[{name:'from',in:'query',required:true,schema:{type:'string',format:'date'}},{name:'to',in:'query',required:true,schema:{type:'string',format:'date'}}];
    const isFinancial=['finance','social'].includes(r.action);
    const op={operationId:r.operationId,tags:['Relatórios'],summary:{finance:'Apurar movimento financeiro do período',social:'Consultar elegibilidade da destinação social',audit:'Consultar eventos de auditoria redigidos',http:'Consultar logs HTTP redigidos'}[r.action],description:{finance:'Capturas aprovadas e estornos confirmados são agregados separadamente por data UTC. Custo conhecido vem uma vez do snapshot de cada pedido; não é lucro líquido. Duplicidade de captura é sinalizada, sem apagar entrada financeira real. Inclui contagem de alertas RN18.',social:'RN17 prevê 5% a 10% do lucro líquido apurado. Sem contabilidade completa, não calcula base ou valor; folha RN14 permanece fora.',audit:'Somente campos mínimos de auditoria, sem payload/outbox. ADMIN; paginação por id BIGINT.',http:'Somente rota template, método, status, latência e instante; sem IP, user-agent, request/response ou tokens. ADMIN; paginação por id BIGINT.'}[r.action],security:[{bearerAuth:[]}],parameters:isFinancial?[...common,{name:'scope',in:'query',required:false,schema:{type:'string',enum:['ALL','ORDERS','SUBSCRIPTIONS'],default:'ALL'}}]:[...common,{name:'limit',in:'query',required:false,schema:{type:'integer',minimum:1,maximum:100,default:20}},{name:'cursor',in:'query',required:false,schema:id},{name:'actorId',in:'query',required:false,schema:id},...(r.action==='audit'?[{name:'eventType',in:'query',required:false,schema:str}]:[{name:'status',in:'query',required:false,schema:{type:'integer',minimum:100,maximum:599}}])],responses:{'200':response(data[r.action])}};
    for(const [code,name] of Object.entries(errors))op.responses[code]={$ref:`#/components/responses/${name}`};
    (spec.paths[r.path]??={})[r.method]=op;
}
await writeFile(file,`${JSON.stringify(spec,null,2)}\n`);
console.info(`Relatórios: ${reportOperations.length} operações documentadas.`);
