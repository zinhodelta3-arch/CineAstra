import {readFile,writeFile} from 'node:fs/promises';
import {ticketOperations} from '../routes/ticketRoutes.js';

const file=new URL('../docs/openapi.json',import.meta.url),spec=JSON.parse(await readFile(file,'utf8'));
spec.info.version='1.23.0';
spec.info.description=spec.info.description.replace('tickets seguem na tarefa35.','tickets por unidade emitidos na aprovação e consumidos por equipe vinculada.');
spec.tags=[...spec.tags.filter(x=>x.name!=='Tickets'),{name:'Tickets',description:'Tickets por unidade, consulta e consumo por equipe vinculada.'}];
const id={type:'string',pattern:'^[1-9][0-9]{0,19}$'};
const obj=(properties,required=Object.keys(properties))=>({type:'object',additionalProperties:false,properties,required});
const ref=name=>({$ref:`#/components/schemas/${name}`});
const code={type:'string',pattern:'^[A-Za-z0-9_-]{43}$'};
const nullableDate={type:'string',format:'date-time',nullable:true};
spec.components.schemas.Ticket=obj({id,itemId:id,type:{type:'string',enum:['INGRESSO_SESSAO','RETIRADA_INSUMO','ACESSO_STREAMING']},unit:{type:'integer',minimum:1},status:{type:'string',enum:['GERADO','UTILIZADO','CANCELADO','EXPIRADO']},presence:{type:'string',enum:['DENTRO','FORA'],nullable:true},expiresAt:nullableDate,usedAt:nullableDate,exitedAt:nullableDate});
spec.components.schemas.OwnerTicket=structuredClone(spec.components.schemas.Ticket);
spec.components.schemas.OwnerTicket.properties.code=code;
spec.components.schemas.OwnerTicket.required.push('code');
spec.components.schemas.TicketValidation=structuredClone(spec.components.schemas.Ticket);
spec.components.schemas.TicketValidation.properties.valid={type:'boolean'};
spec.components.schemas.TicketValidation.properties.reentryAllowed={type:'boolean'};
spec.components.schemas.TicketValidation.properties.halfEvidenceRequired={type:'boolean'};
spec.components.schemas.TicketValidation.required.push('valid','reentryAllowed','halfEvidenceRequired');
spec.components.schemas.TicketConsumption=structuredClone(spec.components.schemas.Ticket);
spec.components.schemas.TicketConsumption.properties.halfEvidenceChecked={type:'boolean'};
spec.components.schemas.TicketConsumption.required.push('halfEvidenceChecked');
spec.components.schemas.TicketReentry=structuredClone(spec.components.schemas.TicketConsumption);
spec.components.schemas.TicketReentry.properties.presence={type:'string',enum:['DENTRO']};
spec.components.schemas.TicketPassage=obj({id,ticketId:id,type:{type:'string',enum:['ENTRADA','SAIDA']},at:{type:'string',format:'date-time'},staffId:{...id,nullable:true}});
const envelope=schema=>obj({success:{type:'boolean',enum:[true]},data:schema,requestId:{type:'string',format:'uuid'}});
const page=schema=>obj({items:{type:'array',items:schema},pagination:obj({limit:{type:'integer'},nextCursor:{...id,nullable:true}})});
const attendancePage=obj({summary:obj(Object.fromEntries(['total','entered','inside','exited','late'].map(key=>[key,{type:'integer',minimum:0}]))),items:{type:'array',items:ref('TicketPassage')},pagination:obj({limit:{type:'integer'},nextCursor:{...id,nullable:true}})});
const json=(description,schema,example)=>({description,content:{'application/json':{schema:envelope(schema),example:{success:true,data:example,requestId:'00000000-0000-4000-8000-000000000001'}}}});
const errors={400:'BadRequest',401:'Unauthorized',403:'Forbidden',404:'NotFound',409:'Conflict',413:'PayloadTooLarge',422:'ValidationError',429:'RateLimited',500:'InternalError',503:'Unavailable'};
for(const route of ticketOperations){
    const owner=route.operationId==='list_order_tickets',session=route.operationId==='list_session_tickets',attendance=route.operationId==='list_session_attendance',validate=route.operationId==='validate_ticket',exit=route.operationId==='exit_ticket',entry=route.operationId==='reenter_ticket';
    const list=owner||session||attendance;
    const op={operationId:route.operationId,tags:['Tickets'],summary:({list_order_tickets:'Listar tickets do próprio pedido',list_session_tickets:'Ver tickets da sessão vinculada',list_session_attendance:'Histórico de entradas e saídas da sessão',validate_ticket:'Validar ticket sem consumir',consume_ticket:'Consumir ticket uma vez',exit_ticket:'Registrar saída do ingresso',reenter_ticket:'Registrar reentrada do ingresso'})[route.operationId],
        description:owner?'Somente CLIENTE dono do pedido recebe o código opaco. Ticket é emitido apenas após aprovação autenticada. Cada unidade comprada tem ticket próprio.':session?'ADMIN ou equipe ativa vinculada à sessão consulta tickets sem ver códigos.':attendance?'ADMIN ou equipe ativa vinculada à sessão consulta histórico de passagens, sem códigos de tickets ou documentos.':validate?'ADMIN ou equipe vinculada consulta validade sem mudar estado.':exit?'ADMIN ou equipe vinculada registra saída somente após entrada ativa; a passagem é append-only.':entry?'ADMIN ou equipe vinculada registra reentrada somente após saída, antes do vencimento, com nova conferência de meia; UTILIZADO permanece.':'ADMIN ou equipe vinculada consome ticket uma vez. Ingresso cria a primeira entrada no histórico; retirada de insumo não cria presença. Meia exige conferência presencial mínima. Ticket expirado ou repetido retorna 409.',
        security:[{bearerAuth:[]}],parameters:list?[{name:owner?'orderId':'sessionId',in:'path',required:true,schema:id},{name:'limit',in:'query',schema:{type:'integer',minimum:1,maximum:100,default:50}},{name:'cursor',in:'query',schema:{type:'string',pattern:'^(0|[1-9][0-9]{0,19})$'}}]:[],responses:{}};
    if(list)op.responses['200']=json(attendance?'Histórico e resumo de presença':'Página de tickets',attendance?attendancePage:page(ref(owner?'OwnerTicket':'Ticket')),{...(attendance?{summary:{total:1,entered:1,inside:0,exited:1,late:0}}:{}),items:[],pagination:{limit:50,nextCursor:null}});
    else{
        op.requestBody={required:true,content:{'application/json':{schema:obj({code,...(validate||exit?{}:{halfEvidenceType:{type:'string',enum:['CIE','PCD','ID_JOVEM','IDOSO']}})},['code']),example:{code:'mJQnV2DaK6x7B5tR8uYwQ9cE0fGhI1jKlMnOpQrStUv',...(validate||exit?{}:{halfEvidenceType:'CIE'})}}}};
        op.responses['200']=json(validate?'Validade sem consumo':exit?'Saída registrada':entry?'Reentrada registrada':'Ticket consumido',ref(validate?'TicketValidation':exit?'Ticket':entry?'TicketReentry':'TicketConsumption'),{id:'123',itemId:'456',type:'INGRESSO_SESSAO',unit:1,status:validate?'GERADO':'UTILIZADO',presence:validate?null:exit?'FORA':'DENTRO',expiresAt:'2026-10-10T22:00:00.000Z',usedAt:validate?null:'2026-10-10T20:00:00.000Z',exitedAt:exit||entry?'2026-10-10T20:30:00.000Z':null,...(validate?{valid:true,reentryAllowed:false,halfEvidenceRequired:false}:exit?{}:{halfEvidenceChecked:false})});
    }
    for(const [status,name] of Object.entries(errors))op.responses[status]={$ref:`#/components/responses/${name}`};
    (spec.paths[route.path]??={})[route.method]=op;
}
await writeFile(file,`${JSON.stringify(spec,null,2)}\n`);
console.info(`Tickets: ${ticketOperations.length} operações documentadas.`);
