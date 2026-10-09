import { readFile, writeFile } from 'node:fs/promises';
import { inventoryOperations } from '../routes/inventoryRoutes.js';

const file = new URL('../docs/openapi.json', import.meta.url);
const spec = JSON.parse(await readFile(file,'utf8'));
spec.info.version = '1.14.0';
spec.tags = [...spec.tags.filter(t => t.name !== 'Estoque'), { name: 'Estoque', description: 'Saldo físico, reservado, movimentos e alerta de reposição por local.' }];
const id = { type:'string',pattern:'^[1-9][0-9]{0,19}$' };
const intId = { type:'string',pattern:'^[1-9][0-9]{0,9}$' };
const count = { type:'integer',minimum:0,maximum:2147483647 };
const obj = (properties,required=Object.keys(properties)) => ({ type:'object',additionalProperties:false,properties,...(required.length ? {required} : {}) });
const ref = name => ({ $ref:`#/components/schemas/${name}` });
const response = data => ({ description:'Sucesso',content:{'application/json':{schema:obj({success:{type:'boolean',enum:[true]},data,requestId:{type:'string',format:'uuid'}})}} });
spec.components.schemas.InventoryBalance = obj({ id_insumo:{...intId,nullable:true},id_equipamento:{...intId,nullable:true},id_fornecedor:intId,id_local:intId,quantidade:count,quantidade_reservada:count,disponivel:count,quantidade_minima:count,alerta_reposicao:{type:'boolean'},status:{type:'string'} },['id_fornecedor','id_local','quantidade','quantidade_reservada','disponivel','status']);
spec.components.schemas.InventoryMovement = obj({ id_movimentacao:id,id_insumo:{...intId,nullable:true},id_equipamento:{...intId,nullable:true},id_reserva:{...id,nullable:true},id_usuario:intId,tipo:{type:'string',enum:['ENTRADA','SAIDA','AJUSTE','PERDA','DEVOLUCAO']},quantidade:{type:'integer',minimum:-2147483647,maximum:2147483647},motivo:{type:'string',nullable:true},data_movimentacao:{type:'string'} });
const list = schema => obj({ items:{type:'array',items:schema},pagination:ref('Pagination') });
const errors = {400:'BadRequest',401:'Unauthorized',403:'Forbidden',404:'NotFound',409:'Conflict',413:'PayloadTooLarge',422:'ValidationError',429:'RateLimited',500:'InternalError',503:'Unavailable'};
for (const r of inventoryOperations) {
    const op = {operationId:r.operationId,tags:['Estoque'],summary:r.operationId.replaceAll('_',' '),description:'ADMIN ou FORNECEDOR próprio. Saldo físico e reservado são separados. Movimentos são atômicos com histórico; reserva/consumo do checkout são operações internas na mesma transação, sem endpoint público.',security:[{bearerAuth:[]}],parameters:[],responses:{}};
    if (r.path.includes('{id}')) op.parameters.push({name:'id',in:'path',required:true,schema:intId});
    if (r.action === 'list' || r.action === 'alerts') {
        if (r.action === 'alerts') op.parameters.push({name:'localId',in:'query',required:true,schema:intId});
        else for (const name of ['inputId','equipmentId','localId']) op.parameters.push({name,in:'query',schema:intId});
        op.parameters.push({name:'limit',in:'query',schema:{type:'integer',minimum:1,maximum:100,default:20}},{name:'cursor',in:'query',schema:r.action === 'alerts' ? intId : id});
        op.responses['200'] = response(list(r.action === 'alerts' ? ref('InventoryBalance') : ref('InventoryMovement')));
    } else if (r.action === 'move') {
        op.requestBody = {required:true,content:{'application/json':{schema:obj({inputId:intId,equipmentId:intId,tipo:spec.components.schemas.InventoryMovement.properties.tipo,quantidade:{type:'integer',minimum:-2147483647,maximum:2147483647},motivo:{type:'string',minLength:1,maxLength:255}},['tipo','quantidade'])}}};
        op.responses['201'] = response(obj({movement:ref('InventoryMovement'),balance:ref('InventoryBalance')}));
    } else op.responses['200'] = response(ref('InventoryBalance'));
    for (const [code,name] of Object.entries(errors)) op.responses[code] = {$ref:`#/components/responses/${name}`};
    (spec.paths[r.path] ??= {})[r.method] = op;
}
await writeFile(file,`${JSON.stringify(spec,null,2)}\n`);
console.info(`Estoque: ${inventoryOperations.length} operações documentadas.`);
