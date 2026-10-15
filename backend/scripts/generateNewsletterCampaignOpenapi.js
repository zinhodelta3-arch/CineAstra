import {readFile,writeFile} from 'node:fs/promises';
import {newsletterCampaignOperations} from '../routes/newsletterCampaignRoutes.js';

const file=new URL('../docs/openapi.json',import.meta.url);
const spec=JSON.parse(await readFile(file,'utf8'));
spec.info.version='1.28.0';
spec.tags=[...spec.tags.filter(tag=>tag.name!=='NewsletterAdmin'),{name:'NewsletterAdmin',description:'Gestão administrativa de categorias, campanhas e audiência elegível.'}];
const str=(maxLength)=>({type:'string',minLength:1,maxLength});
const id={type:'string',pattern:'^[1-9][0-9]{0,9}$'};
const obj=(properties,required=Object.keys(properties))=>({type:'object',additionalProperties:false,properties,required});
const category=obj({id,code:str(50),name:str(100),description:{type:'string',nullable:true},active:{type:'boolean'}});
const campaign=obj({id,categoryId:id,name:str(150),subject:str(200),html:str(100000),text:str(100000),status:{type:'string',enum:['RASCUNHO','AGENDADA','ENVIANDO','CONCLUIDA','CANCELADA']},scheduledAt:{type:'string',nullable:true},startedAt:{type:'string',nullable:true},completedAt:{type:'string',nullable:true}});
const page=obj({items:{type:'array',items:campaign},pagination:obj({limit:{type:'integer'},nextCursor:{type:'string',nullable:true}})});
const response=data=>obj({success:{type:'boolean',enum:[true]},data,requestId:{type:'string',format:'uuid'}});
const body=(properties,required=Object.keys(properties))=>({required:true,content:{'application/json':{schema:obj(properties,required)}}});
const categoryBody={code:{type:'string',pattern:'^[A-Z][A-Z0-9_]{0,49}$'},name:str(100),description:{type:'string',maxLength:255,nullable:true}};
const campaignBody={categoryId:id,name:str(150),subject:str(200),html:str(100000),text:str(100000)};
const content=(schema)=>({description:'Resultado',content:{'application/json':{schema:response(schema)}}});
const errors={400:'BadRequest',401:'Unauthorized',403:'Forbidden',404:'NotFound',409:'Conflict',413:'PayloadTooLarge',422:'ValidationError',429:'RateLimited',500:'InternalError',503:'Unavailable'};
for(const route of newsletterCampaignOperations){
    const op={operationId:route.operationId,tags:['NewsletterAdmin'],summary:route.operationId.replaceAll('_',' '),security:[{bearerAuth:[]}],responses:{}};
    const path=route.path;
    if(path.includes('{categoryId}'))op.parameters=[{name:'categoryId',in:'path',required:true,schema:id}];
    if(path.includes('{campaignId}'))op.parameters=[{name:'campaignId',in:'path',required:true,schema:id}];
    if(route.operationId==='admin_list_newsletter_campaigns')op.parameters=[{name:'limit',in:'query',schema:{type:'integer',minimum:1,maximum:100,default:50}},{name:'cursor',in:'query',schema:{type:'string',default:'0'}}];
    if(route.operationId==='admin_create_newsletter_category')op.requestBody=body(categoryBody,['code','name']);
    if(route.operationId==='admin_update_newsletter_category')op.requestBody=body({name:categoryBody.name,description:categoryBody.description},['name']);
    if(['admin_create_newsletter_campaign','admin_update_newsletter_campaign'].includes(route.operationId))op.requestBody=body(campaignBody);
    if(route.operationId==='admin_schedule_newsletter_campaign')op.requestBody=body({at:{type:'string',format:'date-time',description:'Instante futuro em UTC, com sufixo Z.'}});
    const schema=route.operationId==='admin_list_newsletter_categories'?obj({items:{type:'array',items:category}}):route.operationId==='admin_list_newsletter_campaigns'?page:route.operationId.includes('category')?(route.operationId==='admin_archive_newsletter_category'?obj({archived:{type:'boolean',enum:[true]}}):category):route.operationId==='admin_cancel_newsletter_campaign'?obj({cancelled:{type:'boolean',enum:[true]}}):campaign;
    op.responses[route.operationId.startsWith('admin_create_')?'201':'200']=content(schema);
    for(const [code,name] of Object.entries(errors))op.responses[code]={$ref:`#/components/responses/${name}`};
    if(route.operationId==='admin_schedule_newsletter_campaign')op.description='Agenda rascunho e cria entradas únicas para inscritos ATIVOS, confirmados e com aceite na categoria ativa. Duplicatas preservam estado enviado. O envio externo pertence ao worker posterior.';
    (spec.paths[path]??={})[route.method]=op;
}
await writeFile(file,`${JSON.stringify(spec,null,2)}\n`);
console.info(`NewsletterAdmin: ${newsletterCampaignOperations.length} operações documentadas.`);
