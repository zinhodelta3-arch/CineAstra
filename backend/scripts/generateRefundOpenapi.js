import {readFile,writeFile} from 'node:fs/promises';
import {refundOperations} from '../routes/refundRoutes.js';
const file=new URL('../docs/openapi.json',import.meta.url),spec=JSON.parse(await readFile(file,'utf8'));
spec.info.version='1.19.0';
spec.tags=[...spec.tags.filter(t=>t.name!=='Reembolsos'),{name:'Reembolsos',description:'Solicitação, revisão, estorno confirmado e cancelamento da assinatura.'}];
spec.components.schemas.PaymentStatus.properties.status.enum=['PENDENTE','APROVADO','RECUSADO','PARCIALMENTE_ESTORNADO','ESTORNADO'];
const id={type:'string',pattern:'^[1-9][0-9]{0,19}$'},money={type:'string',pattern:'^(0|[1-9][0-9]{0,7})\\.[0-9]{2}$'};
const obj=(properties,required=Object.keys(properties))=>({type:'object',additionalProperties:false,properties,...(required.length?{required}:{})});
const ref=name=>({$ref:`#/components/schemas/${name}`});
const response=data=>({description:'Sucesso',content:{'application/json':{schema:obj({success:{type:'boolean',enum:[true]},data,requestId:{type:'string',format:'uuid'}})}}});
spec.components.schemas.Refund=obj({id,paymentId:id,reason:{type:'string',enum:['ARREPENDIMENTO','DEFEITO','OUTRO','CANCELAMENTO_PLANO']},status:{type:'string',enum:['RECEBIDA','EM_ANALISE','ENVIADA','CONFIRMADA','NEGADA','FALHOU']},requestedAmount:{...money,nullable:true},confirmedAmount:{...money,nullable:true},withinSevenDays:{type:'boolean'},receivedAt:{type:'string'},responseDueAt:{type:'string'},respondedAt:{type:'string',nullable:true},compensation:{type:'string',enum:['NAO_APLICAVEL','PENDENTE','CONCLUIDA']}});
const errors={400:'BadRequest',401:'Unauthorized',403:'Forbidden',404:'NotFound',409:'Conflict',413:'PayloadTooLarge',422:'ValidationError',429:'RateLimited',500:'InternalError',503:'Unavailable'};
for(const r of refundOperations){
    const op={operationId:r.operationId,tags:['Reembolsos'],summary:r.operationId.replaceAll('_',' '),description:'Solicitação confirmada imediatamente como recebida; estorno só é confirmado pelo gateway. Direito de arrependimento elegível pede valor integral. Outros casos exigem decisão documentada conforme versão dos Termos. Compensação de direitos do checkout pode ficar pendente.',security:[{bearerAuth:[]}],parameters:[{name:'id',in:'path',required:true,schema:id}],responses:{}};
    if(r.operationId==='request_refund'){
        op.parameters.push({name:'Idempotency-Key',in:'header',required:true,schema:{type:'string',minLength:8,maxLength:120}});
        op.requestBody={required:true,content:{'application/json':{schema:obj({reason:{type:'string',enum:['ARREPENDIMENTO','DEFEITO','OUTRO','CANCELAMENTO_PLANO']},details:{type:'string',maxLength:1000}},['reason']),example:{reason:'ARREPENDIMENTO'}}}};
        op.responses['202']=response(ref('Refund'));
    }else if(r.operationId==='decide_refund'){
        op.requestBody={required:true,content:{'application/json':{schema:obj({decision:{type:'string',enum:['APPROVE','DENY']},amount:money,termsVersion:{type:'string'},basis:{type:'string',minLength:10,maxLength:1000}},['decision','termsVersion','basis'])}}};
        op.responses['200']=response(ref('Refund'));
    }else if(r.operationId==='cancel_subscription')op.responses['200']=response(obj({id,status:{type:'string',enum:['CANCELADA']},paymentId:{...id,nullable:true},refund:{...ref('Refund'),nullable:true},refundRequestRequired:{type:'boolean'}}));
    else op.responses['200']=response(ref('Refund'));
    for(const [code,name] of Object.entries(errors))op.responses[code]={$ref:`#/components/responses/${name}`};
    (spec.paths[r.path]??={})[r.method]=op;
}
await writeFile(file,`${JSON.stringify(spec,null,2)}\n`);
console.info(`Reembolsos: ${refundOperations.length} operações documentadas.`);
