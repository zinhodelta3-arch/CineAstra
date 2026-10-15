import { readFile,writeFile } from 'node:fs/promises';
import { supplyOperations } from '../routes/supplyRoutes.js';

const file=new URL('../docs/openapi.json',import.meta.url),spec=JSON.parse(await readFile(file,'utf8'));
spec.info.version='1.15.0';
spec.tags=[...spec.tags.filter(x=>x.name!=='Suprimentos'),{name:'Suprimentos',description:'Solicitações, envio, trânsito e recebimento de materiais.'}];
const id={type:'string',pattern:'^[1-9][0-9]{0,9}$'};
const object=(properties,required=Object.keys(properties))=>({type:'object',additionalProperties:false,properties,required});
const ref=name=>({$ref:`#/components/schemas/${name}`});
const response=data=>({description:'Sucesso',content:{'application/json':{schema:object({success:{type:'boolean',enum:[true]},data,requestId:{type:'string',format:'uuid'}})}}});
const nullableId={...id,nullable:true};
const statusReq={type:'string',enum:['PENDENTE','APROVADA','RECUSADA','FINALIZADA']};
const statusShip={type:'string',enum:['PENDENTE','ENVIADO','EM_TRANSITO','RECEBIDO','CANCELADO','DEVOLVIDO']};
spec.components.schemas.StockRequest=object({id_solicitacao:id,id_usuario:id,id_local:id,id_sessao:nullableId,id_insumo:nullableId,id_equipamento:nullableId,quantidade:{type:'integer',minimum:1},status:statusReq,observacao:{type:'string',nullable:true},data_solicitacao:{type:'string'}});
spec.components.schemas.Logistics=object({id_logistica:id,id_fornecedor:id,id_local_origem:nullableId,id_local_destino:id,id_solicitacao:nullableId,id_insumo_origem:nullableId,id_equipamento_origem:nullableId,id_insumo_destino:nullableId,quantidade:{type:'integer',nullable:true},status:statusShip,data_envio:{type:'string',nullable:true},data_prevista:{type:'string',nullable:true},data_recebimento:{type:'string',nullable:true},data_devolucao:{type:'string',nullable:true},id_usuario_recebimento:nullableId,id_usuario_devolucao:nullableId,observacao:{type:'string',nullable:true}});
spec.components.schemas.LocalStock=object({id_local:id,inputs:{type:'array',items:object({id_insumo:id,id_fornecedor:id,nome:{type:'string'},quantidade:{type:'integer'},disponivel:{type:'integer'},status:{type:'string',enum:['EM_ESTOQUE','SEM_ESTOQUE']}})},equipment:{type:'array',items:object({id_equipamento:id,id_fornecedor:id,nome:{type:'string'},quantidade:{type:'integer'},status:{type:'string',enum:['EM_ESTOQUE','SEM_ESTOQUE']}})},a_chegar:{type:'array',items:object({id_logistica:id,id_insumo:nullableId,id_equipamento:nullableId,nome:{type:'string'},quantidade:{type:'integer'},status:statusShip})}});
const list=schema=>object({items:{type:'array',items:ref(schema)},pagination:ref('Pagination')});
const errors={400:'BadRequest',401:'Unauthorized',403:'Forbidden',404:'NotFound',409:'Conflict',413:'PayloadTooLarge',422:'ValidationError',429:'RateLimited',500:'InternalError',503:'Unavailable'};
for(const r of supplyOperations){
    const isRequest=r.path.includes('/stock/'),name=isRequest?'StockRequest':'Logistics';
    const op={operationId:r.operationId,tags:['Suprimentos'],summary:r.operationId.replaceAll('_',' '),description:'Escopo por ADMIN, fornecedor proprietário ou equipe ativa da sessão. Recebimento é único e gera histórico transacional. ETA não é calculado sem dados de distância/provider.',security:[{bearerAuth:[]}],parameters:[],responses:{}};
    if(r.path.includes('{id}'))op.parameters.push({name:'id',in:'path',required:true,schema:id});
    if(r.action==='stock'){
        op.parameters.push({name:'localId',in:'query',required:true,schema:id},{name:'sessionId',in:'query',schema:id});
        op.responses['200']=response(ref('LocalStock'));
    }else if(['requests','shipments'].includes(r.action)){
        op.parameters.push({name:'localId',in:'query',schema:id},{name:'limit',in:'query',schema:{type:'integer',minimum:1,maximum:100,default:20}},{name:'cursor',in:'query',schema:id});
        op.parameters.push({name:'sessionId',in:'query',schema:id});
        op.responses['200']=response(list(name));
    }else if(r.action==='createRequest'){
        op.requestBody={required:true,content:{'application/json':{schema:object({localId:id,sessionId:id,inputId:id,equipmentId:id,quantity:{type:'integer',minimum:1,maximum:2147483647},note:{type:'string',maxLength:2000}},['localId','quantity'])}}};
        op.responses['201']=response(ref(name));
    }else op.responses['200']=response(ref(name));
    for(const [code,error] of Object.entries(errors))op.responses[code]={$ref:`#/components/responses/${error}`};
    (spec.paths[r.path]??={})[r.method]=op;
}
await writeFile(file,`${JSON.stringify(spec,null,2)}\n`);
console.info(`Suprimentos: ${supplyOperations.length} operações documentadas.`);
