import { readFile, writeFile } from 'node:fs/promises';
import { sessionOperations } from '../routes/sessionRoutes.js';

const file = new URL('../docs/openapi.json', import.meta.url);
const spec = JSON.parse(await readFile(file, 'utf8'));
spec.info.version = '1.6.0';
spec.tags = [...spec.tags.filter(t => t.name !== 'Sessões'), { name: 'Sessões', description: 'Agendamento, consulta e cancelamento de sessões presenciais.' }];
const id = { type: 'string', pattern: '^[1-9][0-9]{0,9}$', description: 'INT UNSIGNED decimal, máximo 4294967295.' };
const date = { type: 'string', format: 'date' };
const time = { type: 'string', pattern: '^([01][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$' };
const money = { type: 'string', pattern: '^(0|[1-9][0-9]{0,7})\\.[0-9]{2}$' };
const language = { type: 'string', enum: ['DUBLADO', 'LEGENDADO', 'ORIGINAL'] };
const status = { type: 'string', enum: ['AGENDADA', 'EM_CARTAZ', 'ENCERRADA', 'CANCELADA'] };
const fields = { id_filme: id, id_sala: id, data: date, horario_inicio: time, horario_fim: time, idioma: language, preco_inteira: money };
const object = (properties, required = Object.keys(properties)) => ({ type: 'object', additionalProperties: false, properties, required });
const example = { id_sessao: '1', id_filme: '1', id_sala: '2', id_local: '1', data: '2026-10-10', data_fim: '2026-10-11', horario_inicio: '23:30:00', horario_fim: '01:00:00', idioma: 'DUBLADO', preco_inteira: '20.00', status: 'AGENDADA' };
spec.components.schemas.Session = { ...object({ id_sessao: id, ...fields, id_local: id, data_fim: date, status }), example };
spec.components.schemas.SessionCreate = { ...object(fields, ['id_filme','id_sala','data','horario_inicio','horario_fim','preco_inteira']), example: Object.fromEntries(Object.entries(example).filter(([key]) => key in fields)) };
const patchFields = { ...fields, status }; delete patchFields.id_sala;
spec.components.schemas.SessionPatch = { type: 'object', additionalProperties: false, minProperties: 1, properties: patchFields, example: { horario_inicio: '23:45', horario_fim: '01:15' } };
const ref = name => ({ $ref: `#/components/schemas/${name}` });
const response = data => ({ description: 'Sucesso', content: { 'application/json': { schema: object({ success: { type: 'boolean', enum: [true] }, data, requestId: { type: 'string', format: 'uuid' } }) } } });
for (const r of sessionOperations) {
    const op = { operationId: r.operationId, tags: ['Sessões'], summary: r.operationId.replaceAll('_', ' '), security: r.admin ? [{ bearerAuth: [] }] : [],
        description: r.admin ? 'ADMIN com sessão ativa/2FA. Escrita serializada pelo lock do local, depois sala e sessão. Intervalo mínimo de 1h entre sessões no mesmo local, inclusive salas distintas e meia-noite. Fim anterior ao início significa dia seguinte. Sessão com item de pedido não pode alterar direitos nem ser cancelada. DELETE marca CANCELADA. RN20 de até 5h vale somente para reserva de usuário, não oferecida nesta rota administrativa.' : 'Consulta apenas AGENDADA/EM_CARTAZ com local, sala e filme ativos e filme disponível para cinema. Filtros de data/horário usam dia e hora de início local. Não representa disponibilidade de assentos ou direito de compra.',
        parameters: r.path.includes('{id}') ? [{ name: 'id', in: 'path', required: true, schema: id }] : [], responses: {} };
    if (r.action === 'list') {
        op.parameters.push({ name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
            { name: 'cursor', in: 'query', schema: id }, { name: 'localId', in: 'query', schema: id }, { name: 'date', in: 'query', schema: date },
            { name: 'startFrom', in: 'query', schema: time }, { name: 'startUntil', in: 'query', schema: time });
        if (r.admin) op.parameters.push({ name: 'status', in: 'query', schema: status });
        op.responses['200'] = response(object({ items: { type: 'array', items: ref('Session') }, pagination: ref('Pagination') }));
    } else if (r.action === 'get') op.responses['200'] = response(ref('Session'));
    else if (r.action === 'cancel') op.responses['204'] = { description: 'Sessão marcada CANCELADA; registro e histórico preservados.' };
    else {
        op.requestBody = { required: true, content: { 'application/json': { schema: ref(r.action === 'create' ? 'SessionCreate' : 'SessionPatch') } } };
        const code = r.action === 'create' ? '201' : '200';
        op.responses[code] = { ...response(ref('Session')), ...(code === '201' ? { headers: { Location: { schema: { type: 'string' }, description: 'Detalhe administrativo da sessão' } } } : {}) };
    }
    for (const [code, name] of Object.entries({ 400: 'BadRequest', 401: 'Unauthorized', 403: 'Forbidden', 404: 'NotFound', 409: 'Conflict', 413: 'PayloadTooLarge', 422: 'ValidationError', 429: 'RateLimited', 500: 'InternalError', 503: 'Unavailable' })) op.responses[code] = { $ref: `#/components/responses/${name}` };
    (spec.paths[r.path] ??= {})[r.method] = op;
}
await writeFile(file, `${JSON.stringify(spec, null, 2)}\n`);
console.info(`Sessões: ${sessionOperations.length} operações documentadas.`);
