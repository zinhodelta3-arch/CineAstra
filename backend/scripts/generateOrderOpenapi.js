import {readFile,writeFile} from 'node:fs/promises';
import {orderOperations} from '../routes/orderRoutes.js';
const file=new URL('../docs/openapi.json',import.meta.url),spec=JSON.parse(await readFile(file,'utf8'));
spec.info.version='1.21.0';
spec.info.description=spec.info.description.replace('Tarefa32: ocupação de assentos é serviço interno transacional; ainda não há rota pública de reserva ou disponibilidade.','Tarefa34: checkout transacional com TTL de 15 minutos, pagamento separado e aprovação autenticada; tickets seguem na tarefa35.');
spec.tags=[...spec.tags.filter(x=>x.name!=='Carrinho'),{name:'Carrinho',description:'Cotação e checkout de pedidos avulsos.'}];
const id={type:'string',pattern:'^[1-9][0-9]{0,19}$'};
const money={type:'string',pattern:'^(0|[1-9][0-9]{0,7})\\.[0-9]{2}$'};
const obj=(properties,required=Object.keys(properties))=>({type:'object',additionalProperties:false,properties,required});
const ref=name=>({$ref:`#/components/schemas/${name}`});
const qty={type:'integer',minimum:1,maximum:100};
const kind=value=>({type:'string',enum:[value]});
const line={oneOf:[
    obj({kind:kind('SESSION'),id,seatId:id,quantity:{type:'integer',enum:[1]},halfPreview:{type:'boolean'}},['kind','id','seatId','quantity']),
    obj({kind:kind('INPUT'),id,quantity:qty}),obj({kind:kind('COMBO'),id,quantity:qty,sessionId:id},['kind','id','quantity']),
    obj({kind:kind('STREAMING'),id,mode:{type:'string',enum:['ALUGUEL','COMPRA']},quantity:{type:'integer',enum:[1]}})
]};
spec.components.schemas.OrderCartInput=obj({localId:id,lines:{type:'array',minItems:1,maxItems:50,items:line},couponCode:{type:'string',pattern:'^[A-Z0-9_-]{1,50}$'}},['lines']);
spec.components.schemas.OrderCartQuote=structuredClone(spec.components.schemas.PricingQuote);
spec.components.schemas.OrderCartQuote.properties.fees=money;
spec.components.schemas.OrderCartQuote.properties.guardianAuthorizationRequired={type:'boolean'};
spec.components.schemas.OrderCartQuote.required.push('fees','guardianAuthorizationRequired');
const response={description:'Cotação informativa',content:{'application/json':{schema:obj({success:{type:'boolean',enum:[true]},data:ref('OrderCartQuote'),requestId:{type:'string',format:'uuid'}})}}};
spec.components.schemas.CheckoutOrder=obj({orderId:id,status:{type:'string',enum:['AGUARDANDO_PAGAMENTO','PAGO','CANCELADO']},total:money,currency:{type:'string',enum:['BRL']},expiresAt:{type:'string',format:'date-time'},paymentPath:{type:'string',enum:['/api/payments']}});
const checkoutResponse={description:'Pedido reservado por 15 minutos; pague usando POST /api/payments',content:{'application/json':{schema:obj({success:{type:'boolean',enum:[true]},data:ref('CheckoutOrder'),requestId:{type:'string',format:'uuid'}}),example:{success:true,data:{orderId:'123',status:'AGUARDANDO_PAGAMENTO',total:'25.00',currency:'BRL',expiresAt:'2026-10-10T15:15:00.000Z',paymentPath:'/api/payments'},requestId:'00000000-0000-4000-8000-000000000001'}}}};
const errors={400:'BadRequest',401:'Unauthorized',403:'Forbidden',404:'NotFound',409:'Conflict',413:'PayloadTooLarge',422:'ValidationError',429:'RateLimited',500:'InternalError',503:'Unavailable'};
for(const r of orderOperations){
    if(r.action==='cancel'){
        const cancelled=obj({orderId:id,status:{type:'string',enum:['CANCELADO']}});
        const op={operationId:r.operationId,tags:['Carrinho'],summary:'Cancelar pedido pendente próprio',description:'Somente CLIENTE titular, pedido AGUARDANDO_PAGAMENTO sem ticket nem cobrança despachada/incerta. Intenções PREPARADA são neutralizadas na transação que cancela o pedido e libera reservas. Pedido já CANCELADO retorna 200 sem repetir efeitos. Não chama gateway nem cria reembolso. Estados incompatíveis retornam ORDER_CANCEL_CONFLICT (409).',security:[{bearerAuth:[]}],parameters:[{name:'orderId',in:'path',required:true,schema:id},{name:'Idempotency-Key',in:'header',required:true,schema:{type:'string',minLength:8,maxLength:120}}],responses:{'200':{description:'Pedido cancelado',content:{'application/json':{schema:obj({success:{type:'boolean',enum:[true]},data:cancelled,requestId:{type:'string',format:'uuid'}})}}}}};
        for(const [code,name] of Object.entries(errors))op.responses[code]={$ref:`#/components/responses/${name}`};
        (spec.paths[r.path]??={})[r.method]=op;
        continue;
    }
    if(r.action==='status'){
        const item=obj({itemId:id,ticketId:{...id,nullable:true},type:{type:'string',enum:['INGRESSO_SESSAO','RETIRADA_INSUMO','ACESSO_STREAMING']},status:{type:'string',enum:['AGENDADO','EM_REALIZACAO','ATRASADO','PARTICIPANDO','FINALIZADO'],nullable:true}},['itemId','type','status']);
        spec.components.schemas.OrderOperationalStatus=obj({orderId:id,financialStatus:{type:'string',enum:['EM_ANDAMENTO','AGUARDANDO_PAGAMENTO','PAGO','CANCELADO','FINALIZADO']},operationalStatus:{type:'string',enum:['AGENDADO','EM_REALIZACAO','ATRASADO','PARTICIPANDO','FINALIZADO'],nullable:true},items:{type:'array',items:item}});
        const op={operationId:r.operationId,tags:['Carrinho'],summary:'Consultar estados do próprio pedido',description:'Estado financeiro vem de pedidos.status; estado operacional é calculado de cada ticket, horário da sessão e última passagem. Pedidos não pagos e acesso streaming sem fluxo operacional retornam null. Cada item pode ter tickets por unidade; a projeção não altera estado financeiro.',security:[{bearerAuth:[]}],parameters:[{name:'orderId',in:'path',required:true,schema:id}],responses:{'200':{description:'Estados do pedido',content:{'application/json':{schema:obj({success:{type:'boolean',enum:[true]},data:ref('OrderOperationalStatus'),requestId:{type:'string',format:'uuid'}}),example:{success:true,data:{orderId:'123',financialStatus:'PAGO',operationalStatus:'PARTICIPANDO',items:[{itemId:'456',ticketId:'789',type:'INGRESSO_SESSAO',status:'PARTICIPANDO'}]},requestId:'00000000-0000-4000-8000-000000000001'}}}}}};
        for(const [code,name] of Object.entries(errors))op.responses[code]={$ref:`#/components/responses/${name}`};
        (spec.paths[r.path]??={})[r.method]=op;
        continue;
    }
    if(r.action==='checkout'){
        const op={operationId:r.operationId,tags:['Carrinho'],summary:'Finalizar checkout avulso',description:'CLIENTE cria pedido, itens, snapshot, reserva de cupom/estoque/assento numa transação. Combo exige sessionId do mesmo local e gera retirada vinculada à sessão. Máximo de 500 unidades por checkout. Idempotency-Key é única por usuário e entrada; repetição idêntica devolve o mesmo pedido, alteração retorna 409. Reserva dura 15 minutos; não pago é cancelado sem ticket. O gateway é chamado depois via POST /api/payments com orderId e methodId. Aprovação autenticada dentro do prazo consome reservas e emite tickets por unidade; aprovação tardia requer revisão. Meia sem comprovação e menor sem autorização não finalizam. Taxa deste fluxo: 0.00; encargos RN12 aplicam-se a assinaturas vencidas, não a pedido avulso que expira.',security:[{bearerAuth:[]}],parameters:[{name:'Idempotency-Key',in:'header',required:true,schema:{type:'string',minLength:8,maxLength:120},example:'checkout:pedido-123'}],requestBody:{required:true,content:{'application/json':{schema:ref('OrderCartInput'),example:{localId:'2',lines:[{kind:'SESSION',id:'3',seatId:'4',quantity:1}]}}}},responses:{'201':checkoutResponse}};
        for(const [code,name] of Object.entries(errors))op.responses[code]={$ref:`#/components/responses/${name}`};
        (spec.paths[r.path]??={})[r.method]=op;
        continue;
    }
    const op={operationId:r.operationId,tags:['Carrinho'],summary:'Cotar carrinho',description:'Recebe somente IDs, quantidades e prévia de meia. Valida perfil CLIENTE, idade, local, sessão, assento e estoque disponível; preço, descontos e total são calculados no servidor. Não cria pedido, não reserva estoque/assento, não cobra e não gera ticket. A cotação é revalidada no checkout.',security:[{bearerAuth:[]}],parameters:[],requestBody:{required:true,content:{'application/json':{schema:ref('OrderCartInput'),example:{localId:'2',lines:[{kind:'SESSION',id:'3',seatId:'4',quantity:1}]}}}},responses:{'200':response}};
    for(const [code,name] of Object.entries(errors))op.responses[code]={$ref:`#/components/responses/${name}`};
    (spec.paths[r.path]??={})[r.method]=op;
}
for(const path of ['/api/orders','/api/orders/{id}'])delete spec.paths[path];
for(const name of ['Order','OrderItem'])delete spec.components.schemas[name];
await writeFile(file,`${JSON.stringify(spec,null,2)}\n`);
console.info(`Carrinho: ${orderOperations.length} operação documentada.`);
