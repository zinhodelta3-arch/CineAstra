import {readFile,writeFile} from 'node:fs/promises';
import {newsletterDeliveryOperations} from '../routes/newsletterDeliveryRoutes.js';
const file=new URL('../docs/openapi.json',import.meta.url);
const spec=JSON.parse(await readFile(file,'utf8'));
spec.info.version='1.29.0';
spec.tags=[...spec.tags.filter(x=>x.name!=='NewsletterDelivery'),{name:'NewsletterDelivery',description:'Notificações autenticadas de falha de entrega e reclamação do provedor.'}];
for(const route of newsletterDeliveryOperations){
    (spec.paths[route.path]??={})[route.method]={operationId:route.operationId,tags:['NewsletterDelivery'],summary:'Receber bounce ou reclamação autenticados',description:'O corpo bruto de até 64 KiB é verificado pelo adaptador do provedor antes de qualquer bloqueio. Evento verificado bloqueia novas entregas e cancela pendências; o endpoint não confirma entrega de campanha. A autenticação é uma assinatura específica do provedor, fora de bearer JWT.',security:[],parameters:[{name:'provider',in:'path',required:true,schema:{type:'string',pattern:'^[a-z0-9_-]{2,40}$'}}],requestBody:{required:true,content:{'application/json':{schema:{type:'object',description:'Payload opaco, assinado pelo provedor configurado.'},example:{type:'bounce',eventId:'evt_123',email:'destinatario@example.com'}}}},responses:{204:{description:'Evento autenticado processado; sem corpo.'},400:{$ref:'#/components/responses/BadRequest'},401:{$ref:'#/components/responses/Unauthorized'},404:{$ref:'#/components/responses/NotFound'},413:{$ref:'#/components/responses/PayloadTooLarge'},422:{$ref:'#/components/responses/ValidationError'},500:{$ref:'#/components/responses/InternalError'},503:{$ref:'#/components/responses/Unavailable'}}};
}
await writeFile(file,`${JSON.stringify(spec,null,2)}\n`);
console.info('NewsletterDelivery: webhook documentado.');
