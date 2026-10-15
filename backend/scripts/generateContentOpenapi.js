import {readFile,writeFile} from 'node:fs/promises';
import {contentOperations} from '../routes/contentRoutes.js';
const file=new URL('../docs/openapi.json',import.meta.url),spec=JSON.parse(await readFile(file,'utf8'));
spec.info.version='1.31.0';
spec.tags=[...spec.tags.filter(t=>t.name!=='Conteúdo e IA'),{name:'Conteúdo e IA',description:'Conteúdo aprovado, comprovante próprio e assistente com suporte humano.'}];
const id={type:'string',pattern:'^[1-9][0-9]{0,19}$'},str={type:'string'},obj=(properties,required=Object.keys(properties))=>({type:'object',additionalProperties:false,properties,required});
const json={type:'object',additionalProperties:true};
const published=obj({slug:str,version:str,title:str,body:json,source:{type:'string',format:'uri'},publishedAt:{type:'string',format:'date-time'}});
const contract=obj({business:published,terms:published,privacy:published,offer:obj({lines:{type:'array',items:json},total:str,fees:str,currency:{type:'string',enum:['BRL']},paymentPath:str,paymentMethodsPath:str,conditions:str}),offerHash:{type:'string',pattern:'^[a-f0-9]{64}$'}});
spec.components.schemas.OrderCartInput.properties.acceptance=obj({offerHash:{type:'string',pattern:'^[a-f0-9]{64}$'},accepted:{type:'boolean',enum:[true]}});
spec.components.schemas.OrderCartQuote.properties.contract=contract;
spec.components.schemas.OrderCartQuote.required=[...new Set([...spec.components.schemas.OrderCartQuote.required,'contract'])];
spec.paths['/api/orders/quote'].post.description+=' Retorna conteúdo empresarial, termos, privacidade e sumário versionados com offerHash; conteúdo oficial ausente retorna 503.';
spec.paths['/api/orders/checkout'].post.description+=' Exige acceptance.accepted=true e offerHash vigente da cotação. O contrato é gravado em snapshot na mesma transação e pode ser conservado via GET /api/orders/{orderId}/receipt.';
spec.paths['/api/orders/checkout'].post.requestBody.content['application/json'].example.acceptance={offerHash:'a'.repeat(64),accepted:true};
spec.components.schemas.PlanLegalContract=structuredClone(spec.components.schemas.Plan);
spec.components.schemas.PlanLegalContract.properties.legal=contract;
spec.components.schemas.PlanContract.properties.contract={$ref:'#/components/schemas/PlanLegalContract',nullable:true};
const subscriptionBody=spec.paths['/api/subscriptions'].post.requestBody.content['application/json'].schema;
subscriptionBody.properties.acceptance=obj({offerHash:{type:'string',pattern:'^[a-f0-9]{64}$'},accepted:{type:'boolean',enum:[true]}});
spec.paths['/api/subscriptions'].post.description+=' Contratação exige hash e aceite do sumário vigente; o snapshot da assinatura contém as versões empresariais, termos e privacidade e fica acessível ao titular.';
const response=(data,status=200)=>({description:status===201?'Criado':'OK',content:{'application/json':{schema:obj({success:{type:'boolean',enum:[true]},data,requestId:{type:'string',format:'uuid'}})}}});
const errors={400:'BadRequest',401:'Unauthorized',403:'Forbidden',404:'NotFound',409:'Conflict',413:'PayloadTooLarge',422:'ValidationError',429:'RateLimited',500:'InternalError',503:'Unavailable'};
const planSummary={operationId:'subscription_contract_summary',tags:['Conteúdo e IA'],summary:'Obter sumário do contrato de assinatura',description:'Calcula preço, plano e conteúdo oficial vigente antes do aceite; sem publicação retorna 503. O offerHash deve ser enviado em POST /api/subscriptions.',security:[{bearerAuth:[]}],parameters:[],requestBody:{required:true,content:{'application/json':{schema:subscriptionBody}}},responses:{'200':response(contract)}};
for(const [code,name] of Object.entries(errors))planSummary.responses[code]={$ref:`#/components/responses/${name}`};
(spec.paths['/api/subscriptions/summary']??={}).post=planSummary;
for(const route of contentOperations){
    const op={operationId:route.operationId,tags:['Conteúdo e IA'],security:route.operationId==='get_published_content'?[]:[{bearerAuth:[]}],parameters:[],responses:{}};
    if(route.operationId==='get_published_content'){
        op.summary='Ler versão publicada de conteúdo institucional';op.description='Sem publicação oficial, retorna 404. Nenhum dado empresarial ou reputação é gerado automaticamente.';op.parameters=[{name:'slug',in:'path',required:true,schema:{type:'string',enum:['business','team','history','reputation','partners','social-campaigns','terms','privacy','faq']}}];op.responses['200']=response(published);
    }else if(route.operationId==='publish_content'){
        op.summary='Publicar versão imutável aprovada';op.description='ADMIN informa fonte verificável e conteúdo real. Cada slug/versão é único; nova publicação preserva histórico.';
        op.requestBody={required:true,content:{'application/json':{schema:obj({slug:str,version:str,title:str,body:json,source:{type:'string',format:'uri'}})}}};op.responses['201']=response(obj({id:id,slug:str,version:str}),201);
    }else if(route.operationId==='get_order_receipt'){
        op.summary='Conservar cópia do contrato próprio';op.description='CLIENTE proprietário obtém snapshot aceito, hash e data, inclusive após novas publicações.';op.parameters=[{name:'orderId',in:'path',required:true,schema:id}];op.responses['200']=response(obj({orderId:id,offerHash:str,acceptedAt:{type:'string',format:'date-time'},contract}));
    }else if(route.operationId==='ask_assistant'){
        op.summary='Perguntar à IA';op.description='Identifica IA e oferece encaminhamento humano. Provider ausente devolve available=false; somente a dúvida textual é transmitida ao adaptador, sem ferramentas, SQL ou ações financeiras.';op.requestBody={required:true,content:{'application/json':{schema:obj({message:{type:'string',minLength:1,maxLength:1000}})}}};op.responses['200']=response(obj({identity:{type:'string',enum:['IA']},available:{type:'boolean'},message:str,handoffPath:{type:'string',enum:['/api/assistant/handoff']}}));
    }else{
        op.summary='Encaminhar dúvida ao suporte humano';op.description='Cria solicitação própria no fluxo de suporte com confirmação e prazo da tarefa 46.';op.requestBody={required:true,content:{'application/json':{schema:obj({message:{type:'string',minLength:1,maxLength:4000}})}}};op.responses['201']=response(json,201);
    }
    for(const [code,name] of Object.entries(errors))op.responses[code]={$ref:`#/components/responses/${name}`};
    (spec.paths[route.path]??={})[route.method]=op;
}
await writeFile(file,`${JSON.stringify(spec,null,2)}\n`);
console.info(`Conteúdo e IA: ${contentOperations.length} operações documentadas.`);
