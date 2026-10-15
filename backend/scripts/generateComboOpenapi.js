import { readFile, writeFile } from 'node:fs/promises';
import { comboOperations } from '../routes/comboRoutes.js';

const file = new URL('../docs/openapi.json', import.meta.url);
const spec = JSON.parse(await readFile(file, 'utf8'));
spec.info.version = '1.12.0';
spec.tags = [...spec.tags.filter(t => t.name !== 'Combos'), { name: 'Combos', description: 'Composição de insumos por local; preço/desconto final pertence ao serviço comercial.' }];
const id = { type: 'string', pattern: '^[1-9][0-9]{0,9}$' };
const money = { type: 'string', pattern: '^(0|[1-9][0-9]{0,7})\\.[0-9]{2}$' };
const obj = (properties, required = Object.keys(properties)) => ({ type: 'object', additionalProperties: false, properties, ...(required.length ? { required } : {}) });
const ref = name => ({ $ref: `#/components/schemas/${name}` });
const response = data => ({ description: 'Sucesso', content: { 'application/json': { schema: obj({ success: { type: 'boolean', enum: [true] }, data, requestId: { type: 'string', format: 'uuid' } }) } } });
const item = obj({ id_insumo: id, nome: { type: 'string' }, quantidade: { type: 'integer', minimum: 1 } });
const inputItem = obj({ inputId: id, quantidade: { type: 'integer', minimum: 1, maximum: 2147483647 } });
const items = { type: 'array', minItems: 1, maxItems: 100, uniqueItems: true, items: inputItem };
const name = { type: 'string', minLength: 1, maxLength: 150 };
const description = { type: 'string', maxLength: 10000, nullable: true };
spec.components.schemas.Combo = obj({ id_combo: id, id_local: { ...id, nullable: true }, nome: name, descricao: description, preco: money, ativo: { type: 'boolean' }, data_cadastro: { type: 'string' }, items: { type: 'array', items: item } });
const bodies = {
    create: obj({ localId: id, nome: name, descricao: description, preco: money, items }, ['localId','nome','preco','items']),
    patch: { ...obj({ nome: name, descricao: description, preco: money }, []), minProperties: 1 },
    replace: obj({ items })
};
const errors = { 400:'BadRequest',401:'Unauthorized',403:'Forbidden',404:'NotFound',409:'Conflict',413:'PayloadTooLarge',422:'ValidationError',429:'RateLimited',500:'InternalError',503:'Unavailable' };
for (const r of comboOperations) {
    const op = { operationId: r.operationId, tags: ['Combos'], summary: `${r.action} combo`, description: r.admin ? 'ADMIN gerencia catálogo e composição. Combo referenciado em pedido não admite alteração; DELETE arquiva.' : 'Público vê apenas combos ativos com local e insumos disponíveis. Estoque, preço final e desconto pertencem a módulos posteriores.', security: r.admin ? [{ bearerAuth: [] }] : [], parameters: [], responses: {} };
    if (r.path.includes('{id}')) op.parameters.push({ name: 'id', in: 'path', required: true, schema: id });
    if (r.action === 'list') op.parameters.push({ name: 'localId', in: 'query', required: true, schema: id }, { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } }, { name: 'cursor', in: 'query', schema: id });
    if (bodies[r.action]) op.requestBody = { required: true, content: { 'application/json': { schema: bodies[r.action] } } };
    if (r.action === 'archive') op.responses['204'] = { description: 'Arquivado logicamente.' };
    else if (r.action === 'list') op.responses['200'] = response(obj({ items: { type: 'array', items: ref('Combo') }, pagination: ref('Pagination') }));
    else op.responses[r.action === 'create' ? '201' : '200'] = response(ref('Combo'));
    for (const [code, name] of Object.entries(errors)) op.responses[code] = { $ref: `#/components/responses/${name}` };
    (spec.paths[r.path] ??= {})[r.method] = op;
}
await writeFile(file, `${JSON.stringify(spec, null, 2)}\n`);
console.info(`Combos: ${comboOperations.length} operações documentadas.`);
