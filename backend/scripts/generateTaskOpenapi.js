import { readFile, writeFile } from 'node:fs/promises';
import { taskOperations } from '../routes/taskRoutes.js';

const file = new URL('../docs/openapi.json', import.meta.url);
const spec = JSON.parse(await readFile(file, 'utf8'));
spec.info.version = '1.8.0';
spec.tags = [...spec.tags.filter(t => t.name !== 'Chamados internos'), { name: 'Chamados internos', description: 'Chamados vinculados a equipe e sessão; separados de suporte ao cliente.' }];
const id = { type: 'string', pattern: '^[1-9][0-9]{0,9}$', description: 'INT UNSIGNED decimal.' };
const eventId = { type: 'string', pattern: '^[1-9][0-9]{0,19}$', description: 'BIGINT UNSIGNED decimal.' };
const text = (max = 200) => ({ type: 'string', minLength: 1, maxLength: max });
const nullable = schema => ({ ...schema, nullable: true });
const obj = (properties, required = Object.keys(properties)) => ({ type: 'object', additionalProperties: false, properties, ...(required.length ? { required } : {}) });
const ref = name => ({ $ref: `#/components/schemas/${name}` });
const response = data => ({ description: 'Sucesso', content: { 'application/json': { schema: obj({ success: { type: 'boolean', enum: [true] }, data, requestId: { type: 'string', format: 'uuid' } }) } } });
const status = { type: 'string', enum: ['ABERTO','EM_ANDAMENTO','RESOLVIDO','FECHADO','CANCELADO'] };
const priority = { type: 'string', enum: ['BAIXA','MEDIA','ALTA','URGENTE'] };
const description = nullable({ type: 'string', maxLength: 10000 });
spec.components.schemas.InternalTask = obj({ id_chamado: id, id_criador: id, id_responsavel: nullable(id), id_sessao: id, id_equipe: id, titulo: text(), descricao: description, prioridade: priority, status, data_abertura: { type: 'string' }, data_fechamento: nullable({ type: 'string' }) });
spec.components.schemas.InternalTaskEvent = obj({ id_evento: eventId, id_chamado: id, id_ator: id, acao: { type: 'string', enum: ['CRIADO','EDITADO','ATRIBUIDO','ACEITO','RESOLVIDO','FECHADO','CANCELADO'] }, status_anterior: nullable(status), status_novo: status, id_responsavel: nullable(id), criado_em: { type: 'string' } });
const bodies = {
    create: obj({ titulo: text(), descricao: description, prioridade: priority }, ['titulo']),
    edit: { ...obj({ titulo: text(), descricao: description, prioridade: priority }, []), minProperties: 1 },
    assign: obj({ userId: id })
};
const summaries = { list: 'Listar chamados da equipe', get: 'Consultar chamado interno', create: 'Abrir chamado interno', edit: 'Editar chamado aberto', cancel: 'Cancelar chamado não atribuído', assign: 'Atribuir colaborador', accept: 'Aceitar chamado', resolve: 'Resolver chamado', close: 'Fechar chamado resolvido', history: 'Consultar histórico de transições' };
const descriptions = {
    list: 'ADMIN, supervisor próprio ou membro ativo. assigned=me filtra tarefas atribuídas ao ator.',
    get: 'A equipe e a sessão do chamado são verificadas em toda consulta.',
    create: 'ADMIN, supervisor próprio ou colaborador membro ativo. Sessão AGENDADA/EM_CARTAZ e equipe ATIVA; criador vem da sessão autenticada.',
    edit: 'Somente ADMIN, supervisor próprio ou criador, enquanto ABERTO. Não altera equipe, sessão, responsável nem status.',
    cancel: 'Cancelamento lógico somente em ABERTO sem responsável, por gestor ou criador; histórico permanece.',
    assign: 'ADMIN ou supervisor próprio atribui apenas colaborador ativo da mesma equipe; mantém ABERTO até aceite.',
    accept: 'Colaborador ativo da equipe aceita chamado ABERTO livre ou atribuído a si; lock transacional permite um único vencedor.',
    resolve: 'Responsável ativo resolve EM_ANDAMENTO.',
    close: 'ADMIN, supervisor próprio ou responsável fecha RESOLVIDO.',
    history: 'Histórico durável das transições, visível somente a gestor ou membro ativo da equipe.'
};
for (const r of taskOperations) {
    const op = { operationId: r.operationId, tags: ['Chamados internos'], summary: summaries[r.action], description: descriptions[r.action], security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: id }], responses: {} };
    if (r.path.includes('{taskId}')) op.parameters.push({ name: 'taskId', in: 'path', required: true, schema: id });
    if (['list','history'].includes(r.action)) {
        op.parameters.push({ name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } }, { name: 'cursor', in: 'query', schema: r.action === 'history' ? eventId : id });
        if (r.action === 'list') op.parameters.push({ name: 'status', in: 'query', schema: status }, { name: 'assigned', in: 'query', schema: { type: 'string', enum: ['me'] } });
    }
    if (bodies[r.action]) op.requestBody = { required: true, content: { 'application/json': { schema: bodies[r.action] } } };
    if (r.action === 'cancel') op.responses['204'] = { description: 'Chamado marcado CANCELADO; histórico preservado.' };
    else if (['list','history'].includes(r.action)) op.responses['200'] = response(obj({ items: { type: 'array', items: ref(r.action === 'history' ? 'InternalTaskEvent' : 'InternalTask') }, pagination: ref('Pagination') }));
    else op.responses[r.action === 'create' ? '201' : '200'] = response(ref('InternalTask'));
    for (const [code, name] of Object.entries({ 400:'BadRequest',401:'Unauthorized',403:'Forbidden',404:'NotFound',409:'Conflict',413:'PayloadTooLarge',422:'ValidationError',429:'RateLimited',500:'InternalError',503:'Unavailable' })) op.responses[code] = { $ref: `#/components/responses/${name}` };
    (spec.paths[r.path] ??= {})[r.method] = op;
}
await writeFile(file, `${JSON.stringify(spec, null, 2)}\n`);
console.info(`Chamados internos: ${taskOperations.length} operações documentadas.`);
