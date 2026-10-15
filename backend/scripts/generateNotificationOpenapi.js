import { readFile, writeFile } from 'node:fs/promises';
import { notificationOperations } from '../routes/notificationRoutes.js';

const file = new URL('../docs/openapi.json', import.meta.url);
const spec = JSON.parse(await readFile(file, 'utf8'));
spec.info.version = '1.9.0';
spec.tags = [...spec.tags.filter(t => t.name !== 'Notificações'), { name: 'Notificações', description: 'Consulta e leitura de notificações próprias; emissão somente por serviço interno.' }];
const id = { type: 'string', pattern: '^[1-9][0-9]{0,19}$', description: 'BIGINT UNSIGNED decimal retornado como string.' };
const obj = (properties, required = Object.keys(properties)) => ({ type: 'object', additionalProperties: false, properties, required });
const ref = name => ({ $ref: `#/components/schemas/${name}` });
const response = data => ({ description: 'Sucesso', content: { 'application/json': { schema: obj({ success: { type: 'boolean', enum: [true] }, data, requestId: { type: 'string', format: 'uuid' } }) } } });
spec.components.schemas.Notification = obj({ id_notificacao: id, titulo: { type: 'string', maxLength: 200 }, mensagem: { type: 'string', nullable: true }, tipo: { type: 'string', maxLength: 50, nullable: true }, lida: { type: 'boolean' }, data_envio: { type: 'string' } });
for (const r of notificationOperations) {
    const list = r.action === 'list';
    const op = { operationId: r.operationId, tags: ['Notificações'], summary: list ? 'Listar minhas notificações' : 'Marcar minha notificação como lida',
        description: list ? 'Usa o usuário da sessão autenticada; não aceita id_usuario. Cursor BIGINT, filtro unread=true/false e tipo. A chave interna de deduplicação não é exposta.' : 'Atualização idempotente restrita ao destinatário autenticado; notificação alheia retorna 404. Não existe endpoint público de emissão.',
        security: [{ bearerAuth: [] }], parameters: list ? [
            { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
            { name: 'cursor', in: 'query', schema: id },
            { name: 'unread', in: 'query', schema: { type: 'boolean' } },
            { name: 'type', in: 'query', schema: { type: 'string', minLength: 1, maxLength: 50 } }
        ] : [{ name: 'id', in: 'path', required: true, schema: id }], responses: {} };
    op.responses['200'] = response(list ? obj({ items: { type: 'array', items: ref('Notification') }, pagination: ref('Pagination') }) : ref('Notification'));
    for (const [code, name] of Object.entries({ 400:'BadRequest',401:'Unauthorized',403:'Forbidden',404:'NotFound',409:'Conflict',413:'PayloadTooLarge',422:'ValidationError',429:'RateLimited',500:'InternalError',503:'Unavailable' })) op.responses[code] = { $ref: `#/components/responses/${name}` };
    (spec.paths[r.path] ??= {})[r.method] = op;
}
await writeFile(file, `${JSON.stringify(spec, null, 2)}\n`);
console.info(`Notificações: ${notificationOperations.length} operações documentadas.`);
