import { readFile, writeFile } from 'node:fs/promises';
import { commerceGalleryOperations } from '../routes/commerceGalleryRoutes.js';

const file = new URL('../docs/openapi.json', import.meta.url);
const spec = JSON.parse(await readFile(file, 'utf8'));
spec.info.version = '1.13.0';
spec.tags = [...spec.tags.filter(t => t.name !== 'Galerias comerciais'), { name: 'Galerias comerciais', description: 'Imagens de insumos e combos; PRINCIPAL única e alternativas de apresentação.' }];
const id = { type: 'string', pattern: '^[1-9][0-9]{0,19}$' };
const productId = { type: 'string', pattern: '^[1-9][0-9]{0,9}$' };
const key = { type: 'string', pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\\.webp$' };
const tipo = { type: 'string', enum: ['PRINCIPAL','ALTERNATIVA'] };
const alt = { type: 'string', nullable: true, maxLength: 255 };
const ordem = { type: 'integer', minimum: 0, maximum: 4294967295 };
const obj = (properties, required = Object.keys(properties)) => ({ type: 'object', additionalProperties: false, properties, ...(required.length ? { required } : {}) });
const ref = name => ({ $ref: `#/components/schemas/${name}` });
const response = data => ({ description: 'Sucesso', content: { 'application/json': { schema: obj({ success: { type: 'boolean', enum: [true] }, data, requestId: { type: 'string', format: 'uuid' } }) } } });
for (const type of ['inputs','combos']) {
    const name = type === 'inputs' ? 'InputImage' : 'ComboImage', parent = type === 'inputs' ? 'id_insumo' : 'id_combo';
    spec.components.schemas[name] = obj({ id_imagem: id, [parent]: productId, tipo, url: { type: 'string', description: 'URL pública relativa de WebP promovido.' }, texto_alternativo: alt, ordem });
}
const create = obj({ stagingKey: key, tipo, texto_alternativo: alt, ordem }, ['stagingKey']);
const patch = { ...obj({ tipo, texto_alternativo: alt, ordem }, []), minProperties: 1 };
const errors = { 400:'BadRequest',401:'Unauthorized',403:'Forbidden',404:'NotFound',409:'Conflict',413:'PayloadTooLarge',422:'ValidationError',429:'RateLimited',500:'InternalError',503:'Unavailable' };
for (const r of commerceGalleryOperations) {
    const image = ref(r.type === 'inputs' ? 'InputImage' : 'ComboImage');
    const protectedRoute = !['list','content'].includes(r.action);
    const op = { operationId: r.operationId, tags: ['Galerias comerciais'], summary: r.operationId.replaceAll('_',' '), description: protectedRoute ? (r.type === 'inputs' && r.action !== 'adminList' ? 'ADMIN ou FORNECEDOR proprietário com vínculo operacional ativo. Staging vinculado à própria conta; escritas serializadas pelo pai e arquivo compensado por journal.' : 'ADMIN com sessão ativa e 2FA; escritas serializadas pelo pai e arquivo compensado por journal.') : 'Público apenas se o insumo/combo estiver operacionalmente disponível; imagem WebP sem acesso a staging.', security: protectedRoute ? [{ bearerAuth: [] }] : [], parameters: [], responses: {} };
    for (const param of ['id','imageId','key']) if (r.path.includes(`{${param}}`)) op.parameters.push({ name: param, in: 'path', required: true, schema: param === 'key' ? key : param === 'imageId' ? id : productId });
    if (['list','adminList'].includes(r.action)) {
        op.parameters.push({ name: 'tipo', in: 'query', schema: tipo }, { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } }, { name: 'cursor', in: 'query', schema: { type: 'string', pattern: '^(0|[0-9]{1,10}:[1-9][0-9]{0,19})$' } });
        op.responses['200'] = response(obj({ items: { type: 'array', items: image }, pagination: ref('Pagination') }));
    } else if (r.action === 'create') { op.requestBody = { required: true, content: { 'application/json': { schema: create } } }; op.responses['201'] = response(image); }
    else if (r.action === 'patch') { op.requestBody = { required: true, content: { 'application/json': { schema: patch } } }; op.responses['200'] = response(image); }
    else if (r.action === 'remove') op.responses['204'] = { description: 'Imagem desvinculada; arquivo removido ou marcado para conciliação.' };
    else if (r.action === 'reconcile') op.responses['200'] = response(obj({ examined: { type: 'integer' }, completed: { type: 'integer' }, pending: { type: 'integer' } }));
    else op.responses['200'] = { description: 'Imagem WebP pública', content: { 'image/webp': { schema: { type: 'string', format: 'binary' } } } };
    for (const [code, name] of Object.entries(errors)) op.responses[code] = { $ref: `#/components/responses/${name}` };
    (spec.paths[r.path] ??= {})[r.method] = op;
}
await writeFile(file, `${JSON.stringify(spec, null, 2)}\n`);
console.info(`Galerias comerciais: ${commerceGalleryOperations.length} operações documentadas.`);
