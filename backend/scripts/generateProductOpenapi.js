import { readFile, writeFile } from 'node:fs/promises';
import { productOperations } from '../routes/productRoutes.js';

const file = new URL('../docs/openapi.json', import.meta.url);
const spec = JSON.parse(await readFile(file, 'utf8'));
spec.info.version = '1.11.0';
spec.tags = [...spec.tags.filter(t => !['Insumos','Equipamentos','Fornecedor locais'].includes(t.name)),
    { name: 'Insumos', description: 'Catálogo de insumos por fornecedor e local autorizado.' },
    { name: 'Equipamentos', description: 'Catálogo de equipamentos e patrimônio.' },
    { name: 'Fornecedor locais', description: 'Autorização operacional explícita por fornecedor e local.' }];
const id = { type: 'string', pattern: '^[1-9][0-9]{0,9}$', description: 'INT UNSIGNED decimal.' };
const name = { type: 'string', minLength: 1, maxLength: 150 };
const nullable = schema => ({ ...schema, nullable: true });
const status = values => ({ type: 'string', enum: values });
const obj = (properties, required = Object.keys(properties)) => ({ type: 'object', additionalProperties: false, properties, ...(required.length ? { required } : {}) });
const ref = name => ({ $ref: `#/components/schemas/${name}` });
const response = data => ({ description: 'Sucesso', content: { 'application/json': { schema: obj({ success: { type: 'boolean', enum: [true] }, data, requestId: { type: 'string', format: 'uuid' } }) } } });
const inputStatus = status(['DISPONIVEL','INDISPONIVEL']);
const equipmentStatus = status(['DISPONIVEL','MANUTENCAO','INDISPONIVEL']);
const grantStatus = status(['ATIVO','INATIVO']);
const money = { type: 'string', pattern: '^(0|[1-9][0-9]{0,7})\\.[0-9]{2}$', description: 'Preço de catálogo em decimal exato; não é custo.' };
const count = { type: 'integer', minimum: 0, maximum: 2147483647 };
const patrimony = nullable({ type: 'string', minLength: 1, maxLength: 100, description: 'Único após trim/uppercase; null é permitido.' });
const common = { nome: name, descricao: nullable({ type: 'string', maxLength: 10000 }), categoria: nullable({ type: 'string', minLength: 1, maxLength: 100 }) };
const base = { id_fornecedor: id, id_local: id, ...common, quantidade: count, status: inputStatus, data_cadastro: { type: 'string' } };
spec.components.schemas.InputProduct = obj({ id_insumo: id, ...base, quantidade_minima: count, preco: money });
spec.components.schemas.EquipmentProduct = obj({ id_equipamento: id, ...base, numero_patrimonio: patrimony, status: equipmentStatus });
spec.components.schemas.SupplierLocationGrant = obj({ id_fornecedor: id, id_local: id, status: grantStatus, criado_em: { type: 'string' } });
const inputCreate = obj({ ...common, supplierId: id, localId: id, quantidade_minima: count, preco: money }, ['nome','localId','preco']);
const equipmentCreate = obj({ ...common, supplierId: id, localId: id, numero_patrimonio: patrimony }, ['nome','localId']);
const inputPatch = { ...obj({ ...common, quantidade_minima: count, preco: money, status: inputStatus }, []), minProperties: 1 };
const equipmentPatch = { ...obj({ ...common, numero_patrimonio: patrimony, status: equipmentStatus }, []), minProperties: 1 };
const bodies = { inputs: { create: inputCreate, patch: inputPatch }, equipment: { create: equipmentCreate, patch: equipmentPatch } };
const paging = schema => obj({ items: { type: 'array', items: schema }, pagination: ref('Pagination') });
const errors = { 400:'BadRequest',401:'Unauthorized',403:'Forbidden',404:'NotFound',409:'Conflict',413:'PayloadTooLarge',422:'ValidationError',429:'RateLimited',500:'InternalError',503:'Unavailable' };
for (const r of productOperations) {
    const tag = r.type === 'inputs' ? 'Insumos' : r.type === 'equipment' ? 'Equipamentos' : 'Fornecedor locais';
    const productSchema = r.type === 'inputs' ? ref('InputProduct') : ref('EquipmentProduct');
    const op = { operationId: r.operationId, tags: [tag], summary: `${r.action} ${r.type ?? 'fornecedor-local'}`, security: [{ bearerAuth: [] }], parameters: [], responses: {} };
    if (r.type) op.description = 'ADMIN acessa todos; FORNECEDOR acessa apenas itens próprios. Escrita exige vínculo fornecedor-local ativo. Quantidade inicia em zero e não é editável nesta API; estoque usa movimentos. DELETE arquiva sem apagar referências.';
    else op.description = r.admin ? 'Somente ADMIN gerencia o vínculo operacional fornecedor-local.' : 'FORNECEDOR consulta os próprios locais autorizados.';
    for (const param of ['id','supplierId','localId']) if (r.path.includes(`{${param}}`)) op.parameters.push({ name: param, in: 'path', required: true, schema: id });
    if (['list','grants','myGrants'].includes(r.action)) {
        op.parameters.push({ name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } }, { name: 'cursor', in: 'query', schema: id });
        if (r.type) op.parameters.push({ name: 'supplierId', in: 'query', schema: id, description: 'Filtro ADMIN; FORNECEDOR usa escopo da conta.' }, { name: 'localId', in: 'query', schema: id }, { name: 'status', in: 'query', schema: r.type === 'inputs' ? inputStatus : equipmentStatus });
        else op.parameters.push({ name: 'status', in: 'query', schema: grantStatus });
    }
    const body = r.type ? bodies[r.type]?.[r.action] : r.action === 'grant' ? obj({ localId: id }) : null;
    if (body) op.requestBody = { required: true, content: { 'application/json': { schema: body } } };
    if (r.action === 'archive' || r.action === 'revokeGrant') op.responses['204'] = { description: 'Arquivado logicamente.' };
    else if (r.action === 'list') op.responses['200'] = response(paging(productSchema));
    else if (r.action === 'grants' || r.action === 'myGrants') op.responses['200'] = response(paging(ref('SupplierLocationGrant')));
    else op.responses[r.action === 'create' || r.action === 'grant' ? '201' : '200'] = response(r.type ? productSchema : ref('SupplierLocationGrant'));
    for (const [code, name] of Object.entries(errors)) op.responses[code] = { $ref: `#/components/responses/${name}` };
    (spec.paths[r.path] ??= {})[r.method] = op;
}
await writeFile(file, `${JSON.stringify(spec, null, 2)}\n`);
console.info(`Insumos e equipamentos: ${productOperations.length} operações documentadas.`);
