import { readFile, writeFile } from 'node:fs/promises';
import { filmGalleryOperations } from '../routes/filmGalleryRoutes.js';
const file = new URL('../docs/openapi.json', import.meta.url);
const spec = JSON.parse(await readFile(file, 'utf8'));
spec.info.version = '1.4.0';
spec.tags = [...spec.tags.filter(t => t.name !== 'Galeria de filmes'), { name: 'Galeria de filmes', description: 'Imagens públicas de filmes ativos e gestão ADMIN.' }];
const ref = name => ({ $ref: `#/components/schemas/${name}` });
const response = schema => ({ description: 'Sucesso', content: { 'application/json': { schema: { type: 'object', required: ['success', 'data', 'requestId'], properties: { success: { type: 'boolean', enum: [true] }, data: schema, requestId: { type: 'string', format: 'uuid' } } } } } });
const id = { type: 'string', pattern: '^[1-9][0-9]{0,19}$' };
const key = { type: 'string', pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\\.webp$' };
const image = { type: 'object', required: ['id_imagem', 'id_filme', 'tipo', 'url', 'texto_alternativo', 'ordem', 'principal'], properties: { id_imagem: id, id_filme: ref('Id'), tipo: { type: 'string', enum: ['CAPA', 'BANNER', 'ALTERNATIVA'] }, url: { type: 'string', description: 'URL relativa pública somente para filme ativo; nunca uma URL privada de staging/reprodução.' }, texto_alternativo: { type: 'string', nullable: true, maxLength: 255 }, ordem: { type: 'integer', minimum: 0, maximum: 4294967295 }, principal: { type: 'boolean' } } };
spec.components.schemas.FilmImage = image;
const fields = { tipo: image.properties.tipo, texto_alternativo: image.properties.texto_alternativo, ordem: image.properties.ordem, principal: image.properties.principal };
spec.components.schemas.FilmImageCreate = { type: 'object', additionalProperties: false, required: ['stagingKey'], properties: { stagingKey: key, ...fields }, example: { stagingKey: '00000000-0000-4000-8000-000000000001.webp', tipo: 'CAPA', texto_alternativo: 'Cartaz do filme', ordem: 0, principal: true } };
spec.components.schemas.FilmImagePatch = { type: 'object', additionalProperties: false, minProperties: 1, properties: fields, example: { ordem: 1, principal: true } };
const list = { type: 'object', required: ['items', 'pagination'], properties: { items: { type: 'array', items: ref('FilmImage') }, pagination: { type: 'object', required: ['limit', 'nextCursor'], properties: { limit: { type: 'integer' }, nextCursor: { type: 'string', nullable: true, description: 'ordem:id_imagem' } } } } };
for (const r of filmGalleryOperations) {
    const admin = r.path.startsWith('/api/admin/');
    const params = [...r.path.matchAll(/\{(\w+)\}/g)].map(m => ({ name: m[1], in: 'path', required: true, schema: m[1] === 'key' ? key : id }));
    const op = { operationId: r.operationId, tags: ['Galeria de filmes'], summary: r.operationId.replaceAll('_', ' '), security: admin ? [{ bearerAuth: [] }] : [], parameters: params, description: admin ? 'ADMIN com sessão ativa e 2FA. Escritas bloqueiam o filme; promoção de staging para storage durável é compensada fora da transação SQL. Cache-Control: no-store.' : 'Público somente para filme ATIVO; staging e URL de reprodução não são expostos. Cache-Control: no-store.', responses: {} };
    if (r.operationId.includes('list_')) {
        op.parameters.push({ name: 'tipo', in: 'query', schema: image.properties.tipo }, { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } }, { name: 'cursor', in: 'query', schema: { type: 'string', pattern: '^(0|[0-9]{1,10}:[1-9][0-9]{0,19})$' } });
        op.responses['200'] = response(list);
    } else if (r.method === 'post' && r.operationId !== 'reconcile_film_images') {
        op.requestBody = { required: true, content: { 'application/json': { schema: ref('FilmImageCreate') } } };
        op.responses['201'] = { ...response(ref('FilmImage')), headers: { Location: { schema: { type: 'string' } } } };
    } else if (r.method === 'patch') {
        op.requestBody = { required: true, content: { 'application/json': { schema: ref('FilmImagePatch') } } };
        op.responses['200'] = response(ref('FilmImage'));
    } else if (r.method === 'delete') op.responses['204'] = { description: 'Imagem desvinculada; remoção do arquivo compensada por journal.' };
    else if (r.operationId === 'reconcile_film_images') op.responses['200'] = response({ type: 'object', required: ['examined', 'completed', 'pending'], properties: { examined: { type: 'integer' }, completed: { type: 'integer' }, pending: { type: 'integer' } } });
    else op.responses['200'] = { description: 'Imagem WebP de um filme ATIVO', content: { 'image/webp': { schema: { type: 'string', format: 'binary' } } } };
    for (const [code, name] of Object.entries({ 400: 'BadRequest', 401: 'Unauthorized', 403: 'Forbidden', 404: 'NotFound', 409: 'Conflict', 413: 'PayloadTooLarge', 422: 'ValidationError', 429: 'RateLimited', 500: 'InternalError', 503: 'Unavailable' })) op.responses[code] = { $ref: `#/components/responses/${name}` };
    (spec.paths[r.path] ??= {})[r.method] = op;
}
await writeFile(file, `${JSON.stringify(spec, null, 2)}\n`);
console.info('Galeria: 7 operações documentadas.');
