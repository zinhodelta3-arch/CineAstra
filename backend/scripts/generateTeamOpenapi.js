import { readFile, writeFile } from 'node:fs/promises';
import { teamOperations } from '../routes/teamRoutes.js';

const file = new URL('../docs/openapi.json', import.meta.url);
const spec = JSON.parse(await readFile(file, 'utf8'));
spec.info.version = '1.7.0';
spec.tags = [...spec.tags.filter(tag => tag.name !== 'Equipes'), { name: 'Equipes', description: 'Equipes por sessão, membros, solicitações e convites.' }];
const id = { type: 'string', pattern: '^[1-9][0-9]{0,9}$', description: 'INT UNSIGNED decimal.' };
const entryId = { type: 'string', pattern: '^[1-9][0-9]{0,19}$', description: 'BIGINT UNSIGNED decimal, retornado como string.' };
const str = { type: 'string', minLength: 1, maxLength: 100 };
const obj = (properties, required = Object.keys(properties)) => ({ type: 'object', additionalProperties: false, properties, ...(required.length ? { required } : {}) });
const nullable = schema => ({ ...schema, nullable: true });
const ref = name => ({ $ref: `#/components/schemas/${name}` });
const response = data => ({ description: 'Sucesso', content: { 'application/json': { schema: obj({ success: { type: 'boolean', enum: [true] }, data, requestId: { type: 'string', format: 'uuid' } }) } } });
spec.components.schemas.Team = obj({ id_equipe: id, id_supervisor: id, id_sessao: id, nome: str, status: { type: 'string', enum: ['ATIVA','FINALIZADA','CANCELADA'] } });
spec.components.schemas.TeamMember = obj({ id_equipe_membro: id, id_equipe: id, id_usuario: id, funcao: nullable(str), data_entrada: { type: 'string', format: 'date' }, status: { type: 'string', enum: ['ATIVO','INATIVO'] } });
spec.components.schemas.TeamEntry = obj({ id_entrada: entryId, id_equipe: id, id_usuario: id, id_emissor: id, tipo: { type: 'string', enum: ['SOLICITACAO','CONVITE'] }, funcao_proposta: nullable(str), status: { type: 'string', enum: ['PENDENTE','ACEITA','RECUSADA','CANCELADA'] }, criado_em: { type: 'string' }, decidido_em: nullable({ type: 'string' }) });
const bodies = {
    create: obj({ sessionId: id, nome: str, supervisorId: id }, ['sessionId','nome']),
    patch: { ...obj({ nome: str, status: { type: 'string', enum: ['FINALIZADA','CANCELADA'] }, supervisorId: id }, []), minProperties: 1 },
    changeMember: obj({ funcao: str }), request: obj({}, []), invitation: obj({ userId: id, funcao: str }),
    decision: obj({ decision: { type: 'string', enum: ['ACEITAR','RECUSAR'] }, funcao: str }, ['decision'])
};
const summaries = {
    list: 'Listar equipes visíveis', get: 'Consultar equipe', create: 'Criar equipe para sessão', patch: 'Alterar equipe', archive: 'Cancelar equipe',
    members: 'Listar membros', changeMember: 'Alterar função de membro', removeMember: 'Desativar membro', entries: 'Listar solicitações e convites',
    request: 'Solicitar entrada na equipe', invitation: 'Convidar colaborador', decision: 'Aceitar ou recusar entrada', cancelEntry: 'Cancelar entrada pendente'
};
const descriptions = {
    list: 'ADMIN vê todas; SUPERVISOR somente equipes próprias; COLABORADOR vê equipes ativas de sessões AGENDADA/EM_CARTAZ.',
    get: 'SUPERVISOR somente equipe própria. COLABORADOR vê equipe ativa de sessão vigente ou equipe na qual é membro ativo.',
    create: 'ADMIN indica supervisor ativo; SUPERVISOR só cria para si. Sessão deve estar AGENDADA/EM_CARTAZ e aceita uma equipe ativa.',
    patch: 'ADMIN ou supervisor próprio. Transferir supervisão exige ADMIN e cancela entradas pendentes. FINALIZADA/CANCELADA cancelam pendências.',
    archive: 'ADMIN ou supervisor próprio. Cancelamento lógico.',
    members: 'ADMIN, supervisor próprio ou membro ativo.',
    changeMember: 'Somente ADMIN ou supervisor próprio define função de membro ativo.',
    removeMember: 'ADMIN ou supervisor próprio desativa o vínculo; nova entrada exige solicitação ou convite.',
    entries: 'ADMIN e supervisor próprio veem todas as entradas; COLABORADOR vê somente as suas.',
    request: 'COLABORADOR ativo solicita para si; não ingressa automaticamente. Função será definida por ADMIN ou supervisor próprio ao aceitar.',
    invitation: 'ADMIN ou supervisor próprio convida COLABORADOR ativo e define função. Membro só entra após aceitar.',
    decision: 'Solicitação: ADMIN ou supervisor próprio aceita com função, ou recusa. Convite: só destinatário COLABORADOR aceita ou recusa; não redefine função.',
    cancelEntry: 'ADMIN, supervisor próprio ou emissor cancela entrada pendente.'
};
for (const r of teamOperations) {
    const op = { operationId: r.operationId, tags: ['Equipes'], summary: summaries[r.action], description: descriptions[r.action], security: [{ bearerAuth: [] }], parameters: [], responses: {} };
    if (r.path.includes('{id}')) op.parameters.push({ name: 'id', in: 'path', required: true, schema: id });
    if (r.path.includes('{memberId}')) op.parameters.push({ name: 'memberId', in: 'path', required: true, schema: id });
    if (r.path.includes('{entryId}')) op.parameters.push({ name: 'entryId', in: 'path', required: true, schema: entryId });
    if (['list','members','entries'].includes(r.action)) op.parameters.push({ name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } }, { name: 'cursor', in: 'query', schema: r.action === 'entries' ? entryId : id });
    if (bodies[r.action]) op.requestBody = { required: true, content: { 'application/json': { schema: bodies[r.action] } } };
    const data = ['list','members','entries'].includes(r.action) ? obj({ items: { type: 'array', items: ref(r.action === 'list' ? 'Team' : r.action === 'members' ? 'TeamMember' : 'TeamEntry') }, pagination: ref('Pagination') }) : ref(['members','changeMember'].includes(r.action) ? 'TeamMember' : ['request','invitation','decision'].includes(r.action) ? 'TeamEntry' : 'Team');
    if (['archive','removeMember','cancelEntry'].includes(r.action)) op.responses['204'] = { description: 'Alteração concluída sem corpo.' };
    else op.responses[['create','request','invitation'].includes(r.action) ? '201' : '200'] = response(data);
    for (const [code, name] of Object.entries({ 400:'BadRequest',401:'Unauthorized',403:'Forbidden',404:'NotFound',409:'Conflict',413:'PayloadTooLarge',422:'ValidationError',429:'RateLimited',500:'InternalError',503:'Unavailable' })) op.responses[code] = { $ref: `#/components/responses/${name}` };
    (spec.paths[r.path] ??= {})[r.method] = op;
}
await writeFile(file, `${JSON.stringify(spec, null, 2)}\n`);
console.info(`Equipes: ${teamOperations.length} operações documentadas.`);
