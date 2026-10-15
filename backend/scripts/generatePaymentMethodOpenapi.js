import { readFile,writeFile } from 'node:fs/promises';
import { paymentMethodOperations } from '../routes/paymentMethodRoutes.js';

const file=new URL('../docs/openapi.json',import.meta.url);
const spec=JSON.parse(await readFile(file,'utf8'));
spec.info.version='1.17.0';
spec.tags=[...spec.tags.filter(t=>t.name!=='Métodos de pagamento'),{name:'Métodos de pagamento',description:'Métodos próprios tokenizados por gateway externo.'}];
const ref=name=>({$ref:`#/components/schemas/${name}`});
const id={type:'string',pattern:'^[1-9][0-9]{0,9}$'};
const obj=(properties,required=Object.keys(properties))=>({type:'object',additionalProperties:false,properties,...(required.length?{required}:{})});
const response=data=>({description:'Sucesso',content:{'application/json':{schema:obj({success:{type:'boolean',enum:[true]},data,requestId:{type:'string',format:'uuid'}})}}});
spec.components.schemas.PaymentMethod=obj({id,type:{type:'string',enum:['CREDITO','DEBITO','PIX','BOLETO']},identification:{type:'string',maxLength:100,description:'Descrição mascarada produzida pelo gateway; nunca contém PAN/CVV.'},principal:{type:'boolean'},provider:{type:'string'}});
const errors={401:'Unauthorized',403:'Forbidden',404:'NotFound',409:'Conflict',422:'ValidationError',429:'RateLimited',500:'InternalError',503:'Unavailable'};
for(const r of paymentMethodOperations){
    const op={operationId:r.operationId,tags:['Métodos de pagamento'],summary:r.operationId.replaceAll('_',' '),description:'Somente CLIENTE autenticado, proprietário do método. Cadastro exige referência opaca de fluxo hospedado do gateway; provider ausente retorna 503. Métodos legados sem token não servem para cobrança.',security:[{bearerAuth:[]}],parameters:[],responses:{}};
    if(r.path.includes('{id}'))op.parameters.push({name:'id',in:'path',required:true,schema:id});
    if(r.action==='create')op.requestBody={required:true,content:{'application/json':{schema:obj({type:{type:'string',enum:['CREDITO','DEBITO','PIX','BOLETO']},setupReference:{type:'string',minLength:8,maxLength:255,pattern:'^[A-Za-z][A-Za-z0-9._:-]+$'},principal:{type:'boolean'}},['type','setupReference']),example:{type:'CREDITO',setupReference:'setup_ref_12345',principal:true}}}};
    if(r.action==='patch')op.requestBody={required:true,content:{'application/json':{schema:obj({principal:{type:'boolean',enum:[true]}})}}};
    if(r.method==='delete')op.responses['204']={description:'Método arquivado; histórico financeiro preservado'};
    else op.responses[r.method==='post'?'201':'200']=response(r.action==='list'?{type:'array',items:ref('PaymentMethod')}:ref('PaymentMethod'));
    for(const [code,name] of Object.entries(errors))op.responses[code]={$ref:`#/components/responses/${name}`};
    (spec.paths[r.path]??={})[r.method]=op;
}
await writeFile(file,`${JSON.stringify(spec,null,2)}\n`);
console.info(`Métodos de pagamento: ${paymentMethodOperations.length} operações documentadas.`);
