import {readFile,writeFile} from 'node:fs/promises';
import {streamingOperations} from '../routes/streamingRoutes.js';

const file=new URL('../docs/openapi.json',import.meta.url),spec=JSON.parse(await readFile(file,'utf8'));
spec.info.version='1.25.0';
spec.tags=[...spec.tags.filter(x=>x.name!=='Streaming'),{name:'Streaming',description:'Direitos avulsos pagos ou benefício vigente de assinatura, com reprodução privada temporária.'}];
const id={type:'string',pattern:'^[1-9][0-9]{0,19}$'};
const obj=(properties,required=Object.keys(properties))=>({type:'object',additionalProperties:false,properties,required});
const ref=name=>({$ref:`#/components/schemas/${name}`});
const date={type:'string',format:'date-time',nullable:true};
spec.components.schemas.StreamingAccess=obj({id,itemId:id,filmId:id,mode:{type:'string',enum:['ALUGUEL','COMPRA']},status:{type:'string',enum:['ATIVO','EXPIRADO','REVOGADO']},available:{type:'boolean'},startsAt:date,expiresAt:date});
spec.components.schemas.StreamingPlay=obj({accessId:id,url:{type:'string',format:'uri',description:'URL HTTPS assinada, de curta duração, entregue apenas nesta resposta.'},expiresAt:{type:'string',format:'date-time'}});
spec.components.schemas.SubscriptionStreamingPlay=obj({filmId:id,subscriptionId:id,url:{type:'string',format:'uri',description:'URL HTTPS assinada, de curta duração, entregue apenas nesta resposta.'},expiresAt:{type:'string',format:'date-time'}});
const page=obj({items:{type:'array',items:ref('StreamingAccess')},pagination:obj({limit:{type:'integer'},nextCursor:{...id,nullable:true}})});
const envelope=schema=>obj({success:{type:'boolean',enum:[true]},data:schema,requestId:{type:'string',format:'uuid'}});
const errors={400:'BadRequest',401:'Unauthorized',403:'Forbidden',404:'NotFound',409:'Conflict',413:'PayloadTooLarge',422:'ValidationError',429:'RateLimited',500:'InternalError',503:'Unavailable'};
for(const route of streamingOperations){
    const list=route.method==='get';
    const plan=route.operationId==='play_streaming_with_subscription';
    if(plan){
        const example={success:true,data:{filmId:'789',subscriptionId:'123',url:'https://private-delivery.example.invalid/play?signature=example',expiresAt:'2026-10-10T20:01:00.000Z'},requestId:'00000000-0000-4000-8000-000000000001'};
        const op={operationId:route.operationId,tags:['Streaming'],summary:'Reproduzir filme pelo benefício da assinatura',description:'Exige CLIENTE titular ou participante ativo, benefício de catálogo no contrato, assinatura vigente, cota paga e ausência de suspensão aplicável. Revalida filme, classificação indicativa, idade e direito antes e depois da assinatura privada de URL. Compras avulsas são independentes desta rota. Provider ausente retorna 503.',security:[{bearerAuth:[]}],parameters:[{name:'filmId',in:'path',required:true,schema:id}],responses:{}};
        op.responses['200']={description:'URL temporária da assinatura',content:{'application/json':{schema:envelope(ref('SubscriptionStreamingPlay')),example}}};
        for(const [code,name] of Object.entries(errors))op.responses[code]={$ref:`#/components/responses/${name}`};
        (spec.paths[route.path]??={})[route.method]=op;
        continue;
    }
    const op={operationId:route.operationId,tags:['Streaming'],summary:list?'Listar direitos avulsos próprios':'Solicitar reprodução de direito próprio',description:list?'Somente CLIENTE titular. Lista não inclui origem de mídia nem URL assinada; disponibilidade considera pagamento, revogação e vencimento.':'Confere titularidade, pagamento, vigência, classificação e verificação atual de idade a cada pedido. Provider de origem privada assina URL por até 60 segundos; ausente retorna 503. A URL não é persistida nem incluída em catálogo/lista.',security:[{bearerAuth:[]}],parameters:list?[{name:'limit',in:'query',schema:{type:'integer',minimum:1,maximum:100,default:50}},{name:'cursor',in:'query',schema:{type:'string',pattern:'^(0|[1-9][0-9]{0,19})$'}}]:[{name:'accessId',in:'path',required:true,schema:id}],responses:{'200':{description:list?'Direitos próprios':'URL temporária',content:{'application/json':{schema:envelope(list?page:ref('StreamingPlay')),example:{success:true,data:list?{items:[{id:'123',itemId:'456',filmId:'789',mode:'ALUGUEL',status:'ATIVO',available:true,startsAt:'2026-10-10T20:00:00.000Z',expiresAt:'2026-10-13T20:00:00.000Z'}],pagination:{limit:50,nextCursor:null}}:{accessId:'123',url:'https://private-delivery.example.invalid/play?signature=example',expiresAt:'2026-10-10T20:01:00.000Z'},requestId:'00000000-0000-4000-8000-000000000001'}}}}}};
    for(const [code,name] of Object.entries(errors))op.responses[code]={$ref:`#/components/responses/${name}`};
    (spec.paths[route.path]??={})[route.method]=op;
}
await writeFile(file,`${JSON.stringify(spec,null,2)}\n`);
console.info(`Streaming: ${streamingOperations.length} operações documentadas.`);
