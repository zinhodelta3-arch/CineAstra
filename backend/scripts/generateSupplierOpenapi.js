import { readFile, writeFile } from 'node:fs/promises';
import { supplierOperations } from '../routes/supplierRoutes.js';

const file = new URL('../docs/openapi.json', import.meta.url);
const spec = JSON.parse(await readFile(file, 'utf8'));
spec.info.version = '1.10.0';
spec.tags = [...spec.tags.filter(t => t.name !== 'Fornecedores'), { name: 'Fornecedores', description: 'Cadastro administrativo e consulta da própria conta de fornecedor.' }];
const id = { type: 'string', pattern: '^[1-9][0-9]{0,9}$', description: 'INT UNSIGNED decimal.' };
const cnpj = { type: 'string', pattern: '^(?:[A-Za-z0-9]{12}[0-9]{2}|[A-Za-z0-9]{2}\\.[A-Za-z0-9]{3}\\.[A-Za-z0-9]{3}/[A-Za-z0-9]{4}-[0-9]{2})$', description: 'CNPJ numérico ou alfanumérico com DVs válidos; armazenado em 14 caracteres maiúsculos.' };
const name = { type: 'string', minLength: 1, maxLength: 150 };
const obj = (properties, required = Object.keys(properties)) => ({ type: 'object', additionalProperties: false, properties, ...(required.length ? { required } : {}) });
const ref = name => ({ $ref: `#/components/schemas/${name}` });
const response = data => ({ description: 'Sucesso', content: { 'application/json': { schema: obj({ success: { type: 'boolean', enum: [true] }, data, requestId: { type: 'string', format: 'uuid' } }) } } });
const status = { type: 'string', enum: ['ATIVO','INATIVO'] };
spec.components.schemas.SupplierAdmin = obj({ id_fornecedor: id, id_usuario: id, razao_social: name, nome_cine: { ...name, nullable: true }, cnpj: { type: 'string', maxLength: 18, description: 'Novos registros em 14 caracteres; legados podem conservar pontuação.' }, status, data_cadastro: { type: 'string' } });
spec.components.schemas.SupplierSelf = obj({ id_fornecedor: id, razao_social: name, nome_cine: { ...name, nullable: true }, cnpj_ultimos4: { type: 'string', pattern: '^[A-Z0-9]{2}[0-9]{2}$' }, status });
const bodies = { create: obj({ userId: id, razao_social: name, nome_cine: { ...name, nullable: true }, cnpj }, ['userId','razao_social','cnpj']), patch: { ...obj({ razao_social: name, nome_cine: { ...name, nullable: true }, cnpj, status }, []), minProperties: 1 } };
const summaries = { list: 'Listar fornecedores', create: 'Cadastrar fornecedor', get: 'Consultar fornecedor', patch: 'Alterar fornecedor', archive: 'Arquivar fornecedor', me: 'Consultar meu cadastro de fornecedor' };
const descriptions = {
    list: 'ADMIN vê cadastro e CNPJ; paginação por ID e filtro de status.',
    create: 'ADMIN vincula conta FORNECEDOR ativa; id_usuario é único. CNPJ alfanumérico/numérico normalizado e único.',
    get: 'ADMIN consulta cadastro sem dados pessoais da conta de usuário.',
    patch: 'ADMIN altera apenas razão social, nome_cine, CNPJ ou status. Não transfere a conta de acesso.',
    archive: 'ADMIN marca INATIVO; mantém produtos, logística e histórico.',
    me: 'FORNECEDOR obtém cadastro vinculado ao próprio usuário autenticado, com CNPJ redigido e sem id_usuario.'
};
for (const r of supplierOperations) {
    const op = { operationId: r.operationId, tags: ['Fornecedores'], summary: summaries[r.action], description: descriptions[r.action], security: [{ bearerAuth: [] }], parameters: [], responses: {} };
    if (r.path.includes('{id}')) op.parameters.push({ name: 'id', in: 'path', required: true, schema: id });
    if (r.action === 'list') op.parameters.push({ name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } }, { name: 'cursor', in: 'query', schema: id }, { name: 'status', in: 'query', schema: status });
    if (bodies[r.action]) op.requestBody = { required: true, content: { 'application/json': { schema: bodies[r.action] } } };
    if (r.action === 'archive') op.responses['204'] = { description: 'Fornecedor marcado INATIVO.' };
    else if (r.action === 'list') op.responses['200'] = response(obj({ items: { type: 'array', items: ref('SupplierAdmin') }, pagination: ref('Pagination') }));
    else op.responses[r.action === 'create' ? '201' : '200'] = response(ref(r.action === 'me' ? 'SupplierSelf' : 'SupplierAdmin'));
    for (const [code, name] of Object.entries({ 400:'BadRequest',401:'Unauthorized',403:'Forbidden',404:'NotFound',409:'Conflict',413:'PayloadTooLarge',422:'ValidationError',429:'RateLimited',500:'InternalError',503:'Unavailable' })) op.responses[code] = { $ref: `#/components/responses/${name}` };
    (spec.paths[r.path] ??= {})[r.method] = op;
}
await writeFile(file, `${JSON.stringify(spec, null, 2)}\n`);
console.info(`Fornecedores: ${supplierOperations.length} operações documentadas.`);
