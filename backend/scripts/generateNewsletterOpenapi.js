import {readFile,writeFile} from 'node:fs/promises';
import {newsletterOperations} from '../routes/newsletterRoutes.js';
import {newsletterTerms} from '../services/newsletterService.js';

const file=new URL('../docs/openapi.json',import.meta.url),spec=JSON.parse(await readFile(file,'utf8'));
spec.info.version='1.27.0';
spec.tags=[...spec.tags.filter(x=>x.name!=='Newsletter'),{name:'Newsletter',description:'Consentimento específico, double opt-in e categorias independentes.'}];
const obj=(properties,required=Object.keys(properties))=>({type:'object',additionalProperties:false,properties,required});
const schema={type:'string'};
const category=obj({code:schema,name:schema,description:{type:'string',nullable:true}});
const options=obj({terms:obj({version:{type:'string',enum:[newsletterTerms.version]},text:schema}),categories:{type:'array',items:category}});
const pending=obj({accepted:{type:'boolean',enum:[true]},message:schema});
const confirmed=obj({confirmed:{type:'boolean',enum:[true]}});
const envelope=data=>obj({success:{type:'boolean',enum:[true]},data,requestId:{type:'string',format:'uuid'}});
const body=(properties,required=Object.keys(properties))=>({required:true,content:{'application/json':{schema:obj(properties,required)}}});
const errors={400:'BadRequest',403:'Forbidden',413:'PayloadTooLarge',422:'ValidationError',429:'RateLimited',500:'InternalError',503:'Unavailable'};
for(const route of newsletterOperations){
    const opts=route.operationId==='newsletter_options',subscribe=route.operationId==='newsletter_subscribe';
    if(!['newsletter_options','newsletter_subscribe','newsletter_confirm'].includes(route.operationId)){
        const token={type:'string',pattern:'^[a-f0-9]{64}$'},categories={type:'array',maxItems:20,uniqueItems:true,items:{type:'string'}};
        const request=route.operationId==='newsletter_authorization'?body({email:{type:'string',format:'email'},purpose:{type:'string',enum:['GESTAO','DESCADASTRO']}}):route.operationId==='newsletter_preferences_change'?body({token,categories}):route.operationId==='newsletter_resubscribe'?body({token,accepted:{type:'boolean',enum:[true]},termsVersion:{type:'string',enum:[newsletterTerms.version]},categories:{...categories,minItems:1}}):body({token});
        const response=route.operationId==='newsletter_authorization'?pending:route.operationId==='newsletter_preferences_view'?obj({status:{type:'string',enum:['ATIVO','DESCADASTRADO']},categories:{type:'array',items:obj({code:schema,name:schema,accepted:{type:'boolean'}})}}):route.operationId==='newsletter_preferences_change'?obj({updated:{type:'boolean',enum:[true]}}):route.operationId==='newsletter_unsubscribe'?obj({unsubscribed:{type:'boolean',enum:[true]}}):obj({pending:{type:'boolean',enum:[true]}});
        const summary={newsletter_authorization:'Solicitar autorização por e-mail',newsletter_preferences_view:'Consultar preferências com token de gestão',newsletter_preferences_change:'Alterar preferências com token de gestão',newsletter_unsubscribe:'Descadastrar com token exclusivo',newsletter_resubscribe:'Reinscrever com novo aceite e confirmação'}[route.operationId];
        const op={operationId:route.operationId,tags:['Newsletter'],summary,description:'Token de gestão e token de descadastro têm finalidades separadas. Leitura não consome token. Mudanças usam transação e, após descadastro, envio pendente/falho é cancelado. Token é enviado por e-mail e nunca retorna na API.',security:[],requestBody:request,responses:{}};
        const status=['newsletter_authorization','newsletter_resubscribe'].includes(route.operationId)?'202':'200';
        const exampleData=route.operationId==='newsletter_authorization'?{accepted:true,message:'Se houver uma inscrição elegível, enviaremos um link para o e-mail informado.'}:route.operationId==='newsletter_preferences_view'?{status:'ATIVO',categories:[{code:'PROMOCOES',name:'Promoções',accepted:true}]}:route.operationId==='newsletter_preferences_change'?{updated:true}:route.operationId==='newsletter_unsubscribe'?{unsubscribed:true}:{pending:true};
        op.responses[status]={description:summary,content:{'application/json':{schema:envelope(response),example:{success:true,data:exampleData,requestId:'00000000-0000-4000-8000-000000000001'}}}};
        for(const [code,name] of Object.entries(errors))op.responses[code]={$ref:`#/components/responses/${name}`};
        (spec.paths[route.path]??={})[route.method]=op;
        continue;
    }
    const op={operationId:route.operationId,tags:['Newsletter'],summary:opts?'Consultar consentimento e categorias':subscribe?'Solicitar inscrição':'Confirmar inscrição',description:opts?'Retorna o texto e a versão atual do aceite expresso, além das categorias disponíveis.':subscribe?'Exige aceite expresso da versão atual e seleção individual de categorias. Resposta uniforme para e-mail novo ou existente; inscrição fica pendente até confirmação. Sem provider de e-mail, retorna 503.':'Token opaco de 32 bytes, uso único e prazo de 24 horas. Token inválido, expirado ou repetido retorna erro uniforme.',security:[],responses:{}};
    if(!opts)op.requestBody=subscribe?body({email:{type:'string',format:'email',maxLength:254},name:{type:'string',maxLength:100},termsVersion:{type:'string',enum:[newsletterTerms.version]},accepted:{type:'boolean',enum:[true]},categories:{type:'array',minItems:1,maxItems:20,uniqueItems:true,items:{type:'string'}}},['email','termsVersion','accepted','categories']):body({token:{type:'string',pattern:'^[a-f0-9]{64}$'}});
    const data=opts?options:subscribe?pending:confirmed;
    const example={success:true,data:opts?{terms:newsletterTerms,categories:[{code:'PROMOCOES',name:'Promoções',description:null}]}:subscribe?{accepted:true,message:'Se a inscrição puder ser iniciada, enviaremos um link de confirmação para o e-mail informado.'}:{confirmed:true},requestId:'00000000-0000-4000-8000-000000000001'};
    op.responses[subscribe?'202':'200']={description:opts?'Opções públicas':subscribe?'Solicitação recebida':'Inscrição confirmada',content:{'application/json':{schema:envelope(data),example}}};
    for(const [code,name] of Object.entries(errors))op.responses[code]={$ref:`#/components/responses/${name}`};
    (spec.paths[route.path]??={})[route.method]=op;
}
await writeFile(file,`${JSON.stringify(spec,null,2)}\n`);
console.info(`Newsletter: ${newsletterOperations.length} operações documentadas.`);
