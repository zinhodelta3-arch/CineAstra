import {readFile,writeFile} from 'node:fs/promises';
import {paymentOperations} from '../routes/paymentRoutes.js';
const file=new URL('../docs/openapi.json',import.meta.url),spec=JSON.parse(await readFile(file,'utf8'));
spec.info.version='1.18.0';
spec.tags=[...spec.tags.filter(t=>t.name!=='Pagamentos'),{name:'Pagamentos',description:'Intenções, consulta e webhook de gateway verificado.'}];
const id={type:'string',pattern:'^[1-9][0-9]{0,19}$'},small={type:'string',pattern:'^[1-9][0-9]{0,9}$'};
const obj=(properties,required=Object.keys(properties))=>({type:'object',additionalProperties:false,properties,...(required.length?{required}:{})});
const ref=name=>({$ref:`#/components/schemas/${name}`});
const response=data=>({description:'Sucesso',content:{'application/json':{schema:obj({success:{type:'boolean',enum:[true]},data,requestId:{type:'string',format:'uuid'}})}}});
spec.components.schemas.PaymentStatus=obj({id,intentionId:id,status:{type:'string',enum:['PENDENTE','APROVADO','RECUSADO','ESTORNADO']},amount:{type:'string',pattern:'^(0|[1-9][0-9]{0,7})\\.[0-9]{2}$'},currency:{type:'string',enum:['BRL']},orderId:{...id,nullable:true},chargeId:{...id,nullable:true}});
const errors={400:'BadRequest',401:'Unauthorized',403:'Forbidden',404:'NotFound',409:'Conflict',413:'PayloadTooLarge',422:'ValidationError',429:'RateLimited',500:'InternalError',503:'Unavailable'};
for(const r of paymentOperations){
    const webhook=r.operationId==='payment_webhook';
    const op={operationId:r.operationId,tags:['Pagamentos'],summary:r.operationId.replaceAll('_',' '),description:webhook?'Corpo JSON bruto antes do parser. Assinatura e timestamp exigidos; provider verifica criptograficamente e normaliza o evento. Repetições são deduplicadas no banco.':'CLIENTE próprio. POST prepara intenção idempotente e reserva um único despacho; resposta 202 permanece PENDENTE até conciliação verificada. Retry consulta sem recriar cobrança.',security:webhook?[]:[{bearerAuth:[]}],parameters:[],responses:{}};
    if(r.path.includes('{id}'))op.parameters.push({name:'id',in:'path',required:true,schema:id});
    if(webhook){op.parameters.push({name:'provider',in:'path',required:true,schema:{type:'string',pattern:'^[A-Za-z0-9_-]{2,40}$'}},{name:'x-payment-signature',in:'header',required:true,schema:{type:'string'}},{name:'x-payment-timestamp',in:'header',required:true,schema:{type:'string'}});op.requestBody={required:true,content:{'application/json':{schema:{type:'object',description:'Payload bruto específico do gateway; nunca registrar conteúdo sensível.'}}}};op.responses['204']={description:'Evento verificado ou repetido recebido'};}
    else if(r.operationId==='create_payment_intention'){
        op.parameters.push({name:'Idempotency-Key',in:'header',required:true,schema:{type:'string',minLength:8,maxLength:120}});
        op.requestBody={required:true,content:{'application/json':{schema:obj({orderId:id,chargeId:id,methodId:small},['methodId']),example:{orderId:'123',methodId:'4'}}}};
        op.responses['202']=response(ref('PaymentStatus'));
    }else op.responses['200']=response(ref('PaymentStatus'));
    for(const [code,name] of Object.entries(errors))op.responses[code]={$ref:`#/components/responses/${name}`};
    (spec.paths[r.path]??={})[r.method]=op;
}
await writeFile(file,`${JSON.stringify(spec,null,2)}\n`);
console.info(`Pagamentos: ${paymentOperations.length} operações documentadas.`);
