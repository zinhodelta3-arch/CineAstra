import {readFile,writeFile} from 'node:fs/promises';
import {planOperations} from '../routes/planRoutes.js';

const file=new URL('../docs/openapi.json',import.meta.url),spec=JSON.parse(await readFile(file,'utf8'));
spec.info.version='1.25.0';
spec.tags=[...spec.tags.filter(x=>x.name!=='Plans'),{name:'Plans',description:'Planos, contratos de assinatura e solicitação de combo mensal.'}];
const id={type:'string',pattern:'^[1-9][0-9]{0,19}$'};
const money={type:'string',pattern:'^[0-9]{1,8}\\.[0-9]{2}$',nullable:true};
const obj=(properties,required=Object.keys(properties))=>({type:'object',additionalProperties:false,properties,...(required.length?{required}:{})});
const ref=name=>({$ref:`#/components/schemas/${name}`});
const envelope=schema=>obj({success:{type:'boolean',enum:[true]},data:schema,requestId:{type:'string',format:'uuid'}});
const page=schema=>obj({items:{type:'array',items:schema},pagination:obj({limit:{type:'integer'},nextCursor:{...id,nullable:true}})});
const planInput={name:{type:'string',maxLength:100},description:{type:'string',nullable:true,maxLength:5000},maxMembers:{type:'integer',minimum:1,maximum:100},catalogAccess:{type:'boolean'},freeComboId:{...id,nullable:true},freeCombosPerMonth:{type:'integer',enum:[0,1]}};
spec.components.schemas.Plan=obj({id:id,...planInput,monthlyPrice:money,annualPrice:money,discounts:{type:'object',additionalProperties:{type:'integer',minimum:0,maximum:10000}},active:{type:'boolean'}});
spec.components.schemas.PlanAdmin=obj({...spec.components.schemas.Plan.properties,monthlyBenefitCost:money,annualBenefitCost:money});
spec.components.schemas.PlanContract=obj({id:id,planId:id,period:{type:'string',enum:['MENSAL','ANUAL']},divisionMode:{type:'string',enum:['TITULAR_PAGA','DIVISAO_IGUAL']},status:{type:'string',enum:['PENDENTE','ATIVA','CANCELADA','EXPIRADA']},autoRenew:{type:'boolean'},startsOn:{type:'string',format:'date',nullable:true},endsOn:{type:'string',format:'date',nullable:true},contractPrice:money,contract:{...ref('Plan'),nullable:true},chargeId:id,chargeStatus:{type:'string',enum:['PENDENTE','PAGO','ATRASADO','ISENTO']},paymentPath:{type:'string'}},['id','planId','period','divisionMode','status','autoRenew','startsOn','endsOn','contractPrice','contract']);
spec.components.schemas.PlanComboRequest=obj({id,subscriptionId:id,comboId:id,competence:{type:'string',format:'date'},status:{type:'string',enum:['SOLICITADO']}});
const body=schema=>({required:true,content:{'application/json':{schema}}});
const pathId=name=>({name,in:'path',required:true,schema:id});
const pagination=[{name:'limit',in:'query',schema:{type:'integer',minimum:1,maximum:100,default:50}},{name:'cursor',in:'query',schema:{type:'string',pattern:'^(0|[1-9][0-9]{0,19})$'}}];
const errors={400:'BadRequest',401:'Unauthorized',403:'Forbidden',404:'NotFound',409:'Conflict',413:'PayloadTooLarge',422:'ValidationError',429:'RateLimited',500:'InternalError',503:'Unavailable'};
const descriptions={list_public_plans:'Listar ofertas publicadas',get_public_plan:'Consultar oferta publicada',list_admin_plans:'Listar planos administrativos',get_admin_plan:'Consultar plano administrativo',create_plan:'Criar plano inativo',update_plan:'Atualizar plano e ativar oferta validada',archive_plan:'Arquivar oferta para novas contratações',list_my_subscriptions:'Listar contratos próprios',get_my_subscription:'Consultar contrato próprio',create_subscription_contract:'Contratar plano com cobrança pendente',request_monthly_combo:'Solicitar combo mensal contratado'};
for(const route of planOperations){
  const op={operationId:route.operationId,tags:['Plans'],summary:descriptions[route.operationId],security:route.path.startsWith('/api/plans')?[]:[{bearerAuth:[]}],responses:{}};
  const isAdmin=route.path.startsWith('/api/admin');
  if(route.path.includes('{planId}'))op.parameters=[pathId('planId')];
  if(route.path.includes('{subscriptionId}'))op.parameters=[pathId('subscriptionId')];
  if(['list_public_plans','list_admin_plans','list_my_subscriptions'].includes(route.operationId))op.parameters=pagination;
  if(route.operationId==='create_plan')op.requestBody=body(obj(planInput,['name','maxMembers']));
  if(route.operationId==='update_plan')op.requestBody=body(obj({...planInput,active:{type:'boolean'}},[]));
  if(route.operationId==='create_subscription_contract'){
    op.parameters=[{name:'Idempotency-Key',in:'header',required:true,schema:{type:'string',minLength:8,maxLength:120}}];
    op.requestBody=body(obj({planId:id,period:{type:'string',enum:['MENSAL','ANUAL']},autoRenew:{type:'boolean'},divisionMode:{type:'string',enum:['TITULAR_PAGA','DIVISAO_IGUAL']}},['planId','period']));
    op.description='Cria snapshot imutável da oferta e cobrança PENDENTE. Use o chargeId retornado em POST /api/payments com outro Idempotency-Key. A assinatura só ativa após confirmação autenticada do gateway.';
  }
  if(route.operationId==='request_monthly_combo')op.description='Exige contrato ATIVA, cobrança paga e combo incluído no snapshot. Reserva uma única solicitação por competência; SOLICITADO não equivale a entrega.';
  const responseSchema=route.operationId.includes('plan')&&!route.operationId.includes('subscription')?ref(isAdmin?'PlanAdmin':'Plan'):
    route.operationId==='request_monthly_combo'?ref('PlanComboRequest'):ref('PlanContract');
  const data=['list_public_plans','list_admin_plans','list_my_subscriptions'].includes(route.operationId)?page(responseSchema):responseSchema;
  const code=route.method==='delete'?'204':route.method==='post'?'201':'200';
  op.responses[code]=code==='204'?{description:'Plano arquivado'}:{description:'Sucesso',content:{'application/json':{schema:envelope(data)}}};
  for(const [status,name] of Object.entries(errors))op.responses[status]={$ref:`#/components/responses/${name}`};
  (spec.paths[route.path]??={})[route.method]=op;
}
await writeFile(file,`${JSON.stringify(spec,null,2)}\n`);
console.info(`Planos: ${planOperations.length} operações documentadas.`);
