import { readFile, writeFile } from 'node:fs/promises';
import { venueOperations } from '../routes/venueRoutes.js';

const file = new URL('../docs/openapi.json', import.meta.url);
const spec = JSON.parse(await readFile(file, 'utf8'));
spec.info.version = '1.5.0';
spec.tags = [...spec.tags.filter(t => t.name !== 'Locais'), { name: 'Locais', description: 'Locais, salas e assentos; estrutura de sessões presenciais.' }];
const ref = name => ({ $ref: `#/components/schemas/${name}` });
const id = { type: 'string', pattern: '^[1-9][0-9]{0,9}$', description: 'INT UNSIGNED decimal, máximo 4294967295.' };
const str = max => ({ type: 'string', minLength: 1, maxLength: max });
const status = { local: ['ATIVO', 'INATIVO', 'MANUTENCAO'], room: ['ATIVA', 'INATIVA', 'MANUTENCAO'], seat: ['ATIVA', 'INATIVA'] };
const properties = {
    local: { nome: str(150), cep: { type: 'string', maxLength: 10, nullable: true }, logradouro: { ...str(150), nullable: true }, numero: { ...str(20), nullable: true }, complemento: { ...str(100), nullable: true }, bairro: { ...str(100), nullable: true }, cidade: str(100), estado: { type: 'string', pattern: '^[A-Z]{2}$' }, telefone: { ...str(20), nullable: true }, status: { type: 'string', enum: status.local } },
    room: { nome: str(100), capacidade: { type: 'integer', minimum: 1, maximum: 2147483647 }, tipo: { type: 'string', enum: ['2D', '3D', '4DX', 'VIP', 'IMAX'] }, status: { type: 'string', enum: status.room } },
    seat: { fileira: { type: 'string', pattern: '^[A-Za-z0-9]{1,5}$' }, numero: { type: 'integer', minimum: 1, maximum: 2147483647 }, tipo: { type: 'string', enum: ['COMUM', 'PCD', 'OBESO', 'IDOSO', 'CASAL'] }, status: { type: 'string', enum: status.seat } }
};
const examples = {
    local: { id_local: '1', nome: 'Cine Centro', cidade: 'São Paulo', estado: 'SP', cep: null, logradouro: null, numero: null, complemento: null, bairro: null, telefone: null, status: 'ATIVO' },
    room: { id_sala: '2', id_local: '1', nome: 'Sala 1', capacidade: 2, tipo: '2D', status: 'INATIVA' },
    seat: { id_assento: '3', id_sala: '2', fileira: 'A', numero: 1, tipo: 'PCD', status: 'ATIVA', acessivel: true }
};
const object = (props, required = Object.keys(props)) => ({ type: 'object', additionalProperties: false, properties: props, required });
for (const kind of ['local', 'room', 'seat']) {
    const title = kind[0].toUpperCase() + kind.slice(1);
    const required = kind === 'local' ? ['nome', 'cidade', 'estado'] : kind === 'room' ? ['nome', 'capacidade'] : ['fileira', 'numero'];
    spec.components.schemas[`Venue${title}Input`] = object(properties[kind], required);
    spec.components.schemas[`Venue${title}Input`].example = Object.fromEntries(Object.entries(examples[kind]).filter(([k]) => required.includes(k)));
    spec.components.schemas[`Venue${title}Patch`] = { type: 'object', additionalProperties: false, minProperties: 1, properties: properties[kind] };
    spec.components.schemas[`Venue${title}Patch`].example = kind === 'local' ? { telefone: '1133334444' } : kind === 'room' ? { status: 'ATIVA' } : { tipo: 'PCD' };
    const row = { [kind === 'local' ? 'id_local' : kind === 'room' ? 'id_sala' : 'id_assento']: id,
        ...(kind === 'room' ? { id_local: id } : kind === 'seat' ? { id_sala: id } : {}), ...properties[kind], ...(kind === 'seat' ? { acessivel: { type: 'boolean', description: 'Derivado do tipo PCD, OBESO ou IDOSO.' } } : {}) };
    spec.components.schemas[`Venue${title}`] = object(row);
    spec.components.schemas[`Venue${title}`].example = examples[kind];
}
const response = data => ({ description: 'Sucesso', content: { 'application/json': { schema: object({ success: { type: 'boolean', enum: [true] }, data, requestId: { type: 'string', format: 'uuid' } }) } } });
for (const r of venueOperations) {
    const title = r.kind[0].toUpperCase() + r.kind.slice(1);
    const op = { operationId: r.operationId, tags: ['Locais'], summary: r.operationId.replaceAll('_', ' '), security: r.admin ? [{ bearerAuth: [] }] : [],
        description: r.admin ? 'ADMIN autenticado com sessão ativa e 2FA; mutações revalidam perfil na transação. DELETE arquiva. Estrutura de sala fica imutável depois de vinculada a qualquer sessão; locais com sessão só aceitam telefone. Cache-Control: no-store.' : 'Consulta pública somente de locais, salas e assentos ativos dentro do contexto pai ativo. Nenhuma disponibilidade de ingresso é inferida aqui. Cache-Control: no-store.',
        parameters: [...r.path.matchAll(/\{(\w+)\}/g)].map(m => ({ name: m[1], in: 'path', required: true, schema: id })), responses: {} };
    if (r.action === 'list') {
        op.parameters.push({ name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } }, { name: 'cursor', in: 'query', schema: id });
        if (r.kind === 'seat') op.parameters.push({ name: 'accessible', in: 'query', schema: { type: 'boolean' } });
        if (r.admin) op.parameters.push({ name: 'status', in: 'query', schema: { type: 'string', enum: status[r.kind] } });
        op.responses['200'] = response(object({ items: { type: 'array', items: ref(`Venue${title}`) }, pagination: ref('Pagination') }));
    } else if (r.action === 'get') op.responses['200'] = response(ref(`Venue${title}`));
    else if (r.action === 'archive') op.responses['204'] = { description: 'Arquivado sem remover o registro e os vínculos históricos.' };
    else {
        op.requestBody = { required: true, content: { 'application/json': { schema: ref(`Venue${title}${r.method === 'patch' ? 'Patch' : 'Input'}`) } } };
        const code = r.method === 'post' ? '201' : '200';
        op.responses[code] = { ...response(ref(`Venue${title}`)), ...(code === '201' ? { headers: { Location: { schema: { type: 'string' }, description: 'URL administrativa do recurso criado' } } } : {}) };
    }
    for (const [code, name] of Object.entries({ 400: 'BadRequest', 401: 'Unauthorized', 403: 'Forbidden', 404: 'NotFound', 409: 'Conflict', 413: 'PayloadTooLarge', 422: 'ValidationError', 429: 'RateLimited', 500: 'InternalError', 503: 'Unavailable' })) op.responses[code] = { $ref: `#/components/responses/${name}` };
    (spec.paths[r.path] ??= {})[r.method] = op;
}
await writeFile(file, `${JSON.stringify(spec, null, 2)}\n`);
console.info(`Locais: ${venueOperations.length} operações documentadas.`);
