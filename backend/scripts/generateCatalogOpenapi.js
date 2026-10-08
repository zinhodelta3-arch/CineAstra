import { readFile, writeFile } from 'node:fs/promises';
import { z } from 'zod';
import { catalogSchemas } from '../validators/catalogValidators.js';
import { catalogOperations } from '../routes/catalogRoutes.js';

const file = new URL('../docs/openapi.json', import.meta.url);
const spec = JSON.parse(await readFile(file, 'utf8'));
spec.tags = [...spec.tags.filter(t => t.name !== 'Catálogo'), { name: 'Catálogo' }];
spec.info.version = '1.2.0';
spec.info.description += spec.info.description.includes('Tarefa14') ? '' : ' Tarefa14: catálogo administrativo e consultas públicas de filmes/gêneros ativos; uploads/galerias ficam15/16.';
const ref = name => ({ $ref: `#/components/schemas/${name}` });
const object = (properties, required = Object.keys(properties)) => ({ type: 'object', additionalProperties: false, properties, required });
for (const [name, schema] of Object.entries(catalogSchemas)) {
    const converted = z.toJSONSchema(schema, { io: 'input', target: 'openapi-3.0', unrepresentable: 'any' });
    // O default numérico é resultado de coerção; query HTTP recebe string.
    if (converted.properties?.limit) converted.properties.limit.default = '20';
    spec.components.schemas[`CatalogInput_${name}`] = converted;
}
const nullable = schema => ({ ...schema, nullable: true });
spec.components.schemas.CatalogFilm = object({
    id_filme: ref('Id'), titulo: { type: 'string', maxLength: 200 }, descricao: nullable({ type: 'string' }),
    duracao: nullable({ type: 'integer', minimum: 1 }), classificacao: { type: 'string', enum: ['L', '10', '12', '14', '16', '18'] },
    data_lancamento: nullable({ type: 'string', format: 'date' }), diretor: nullable({ type: 'string' }), imagem: nullable({ type: 'string' }), trailer: nullable({ type: 'string' }),
    disponivel_cinema: { type: 'boolean' }, disponivel_streaming: { type: 'boolean' },
    preco_aluguel: nullable({ type: 'string', pattern: '^(0|[1-9][0-9]{0,7})\\.[0-9]{2}$' }), preco_compra: nullable({ type: 'string', pattern: '^(0|[1-9][0-9]{0,7})\\.[0-9]{2}$' }),
    dias_acesso_aluguel: nullable({ type: 'integer', minimum: 1 }), status: { type: 'string', enum: ['ATIVO', 'INATIVO'] }
});
spec.components.schemas.CatalogAdminFilm = structuredClone(spec.components.schemas.CatalogFilm);
spec.components.schemas.CatalogAdminFilm.properties.url_reproducao = nullable({ type: 'string', description: 'Somente ADMIN; nunca presente no catálogo público.' });
spec.components.schemas.CatalogAdminFilm.required.push('url_reproducao');
spec.components.schemas.CatalogGenre = object({ id_genero: ref('Id'), nome: { type: 'string', maxLength: 100 }, status: { type: 'string', enum: ['ATIVO', 'INATIVO'] } });
spec.components.schemas.CatalogInput_film.example = { titulo: 'Filme de demonstração', duracao: 100, classificacao: 'L', disponivel_cinema: true, disponivel_streaming: true, preco_aluguel: '12.00', dias_acesso_aluguel: 3 };
spec.components.schemas.CatalogInput_filmPatch.example = { titulo: 'Título atualizado' };
spec.components.schemas.CatalogInput_genre.example = { nome: 'Aventura' };
spec.components.schemas.CatalogInput_link.example = { genreId: '1' };
for (const r of catalogOperations) {
    const [action, kind] = r.action;
    const entity = kind === 'films' ? ref(r.admin ? 'CatalogAdminFilm' : 'CatalogFilm') : ref('CatalogGenre');
    const data = action === 'list' ? object({ items: { type: 'array', maxItems: 100, items: entity }, pagination: ref('Pagination') }) : action === 'link' ? object({ id_filme: ref('Id'), id_genero: ref('Id') }) : entity;
    const operation = { operationId: r.operationId, tags: ['Catálogo'], summary: `${action} ${kind ?? 'associação filme/gênero'}${r.admin ? ' (ADMIN)' : ' (público)'}`,
        description: `${r.admin ? 'ADMIN autenticado com 2FA; mutações revalidam sessão/perfil na transação.' : 'Público: somente registros ATIVO; nenhum url_reproducao ou informação privada.'} ${action === 'archive' ? 'DELETE arquiva como INATIVO, inclusive sem referências; preserva vínculos, sessões e histórico. Pode reativar com PATCH status.' : ''} ${action === 'save' ? 'Campos estritos. PATCH não aplica defaults aos campos omitidos. Valores monetários são strings decimais exatas. Streaming exige preço de aluguel ou compra; aluguel exige prazo positivo. Filme ativo exige duração. URLs HTTPS limitadas a CATALOG_MEDIA_HOSTS, sem download no servidor. imagem legada é apenas leitura; galerias são tarefa16.' : ''} ${action === 'link' ? 'Associação idempotente exige filme e gênero ativos. Relação não permite campos adicionais.' : ''} ${r.query ? 'Ordenação fixa por ID crescente; limit 1–100 (padrão20), cursor último ID. Título é busca literal parcial; gênero público ignora associações arquivadas.' : ''} Cache-Control no-store.`,
        security: r.admin ? [{ bearerAuth: [] }] : [], parameters: [...r.path.matchAll(/\{(\w+)\}/g)].map(m => ({ name: m[1], in: 'path', required: true, schema: { type: 'string', pattern: '^[1-9][0-9]{0,9}$', description: 'INT unsigned decimal string, máximo4294967295.' } })), responses: {} };
    if (r.query) {
        const props = spec.components.schemas[`CatalogInput_${r.query}`].properties;
        for (const [name, schema] of Object.entries(props)) operation.parameters.push({ name, in: 'query', schema, description: name === 'limit' ? '1–100' : name });
    }
    if (r.schema) operation.requestBody = { required: true, content: { 'application/json': { schema: ref(`CatalogInput_${r.schema}`) } } };
    operation.responses[r.status] = { description: r.status === 204 ? 'Concluído sem corpo; DELETE de entidade arquiva' : 'Sucesso', ...(r.status === 201 && { headers: { Location: { schema: { type: 'string' }, description: 'Detalhe administrativo do recurso criado' } } }), ...(r.status !== 204 && { content: { 'application/json': { schema: object({ success: { type: 'boolean', enum: [true] }, data, requestId: { type: 'string', format: 'uuid' } }) } } }) };
    for (const [code, name] of Object.entries({ 400: 'BadRequest', 401: 'Unauthorized', 403: 'Forbidden', 404: 'NotFound', 409: 'Conflict', 413: 'PayloadTooLarge', 415: 'UnsupportedMedia', 422: 'ValidationError', 429: 'RateLimited', 500: 'InternalError', 503: 'Unavailable' })) operation.responses[code] = { $ref: `#/components/responses/${name}` };
    spec.paths[r.path] ??= {}; spec.paths[r.path][r.method] = operation;
}
await writeFile(file, JSON.stringify(spec, null, 2) + '\n');
console.info(`Catálogo: ${catalogOperations.length} operações documentadas.`);
