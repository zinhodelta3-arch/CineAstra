import { readFile, writeFile } from 'node:fs/promises';
import { z } from 'zod';
import { schemas } from '../validators/identityValidators.js';
import { identityOperations } from '../routes/identityRoutes.js';

const file = new URL('../docs/openapi.json', import.meta.url);
const spec = JSON.parse(await readFile(file, 'utf8'));
spec.info.title = 'CineAstra API';
spec.info.version = '1.1.0';
spec.info.description = 'Fundação e Prompt 02: identidade, sessões revogáveis, TOTP, perfil e privacidade. /api preservado. Bearer JWT; cookies não usados. Banco/migrations e provedores reais são dependências de implantação. Cadastro requer CAPTCHA, termos aprovados e prova de idade; recuperação exige e-mail real. Sem integrações configuradas, 503. Não certifica conformidade legal nem prontidão produtiva.';
spec.tags = [{ name: 'Infraestrutura' }, { name: 'Documentação' }, { name: 'Identidade' }];
spec.components.securitySchemes.bearerAuth.description = 'JWT HS256 curto com sub/sid/jti, issuer/audience. Sessão persistida, não revogada, usuário ativo e perfil atual. ADMIN/SUPERVISOR e usuários com fator ativo completam 2FA antes de receber acesso.';
spec.paths['/api-docs'].get.description = 'UI e assets locais. Login e desafio 2FA retornam accessToken somente após autenticação completa; informar token em Authorize. Não persistir autorização. Produção desativada.';
const ref = name => ({ $ref: `#/components/schemas/${name}` });
const obj = (properties, required = Object.keys(properties)) => ({ type: 'object', additionalProperties: false, required, properties });
for (const [name, schema] of Object.entries(schemas)) {
    const json = z.toJSONSchema(schema, { target: 'openapi-3.0', io: 'input', unrepresentable: 'any' });
    for (const field of ['password', 'passwordConfirmation', 'currentPassword']) if (json.properties?.[field]) {
        json.properties[field].format = 'password'; json.properties[field].writeOnly = true;
        json.properties[field].description = 'Máximo 72 bytes UTF-8; senha nova mínimo 12 caracteres, maiúscula, minúscula, número e símbolo. Confirmação idêntica. Sem truncamento bcrypt.';
    }
    if (json.properties?.cpf) json.properties.cpf.description = 'CPF normalizado para 11 dígitos e dígitos verificadores válidos; UNIQUE também no banco.';
    if (json.properties?.dateOfBirth) json.properties.dateOfBirth.description = 'Data civil real, não futura. Cadastro exige prova do provider vinculada a CPF/e-mail/data; autodeclaração não comprova idade.';
    if (name === 'enroll') json.description = 'Exatamente um: challengeToken restrito recebido no login OU password com Bearer. Rotação exige code atual. APP implementado. SMS/EMAIL retornam 503 até integração real de destino verificado e entrega.';
    spec.components.schemas[`IdentityInput_${name}`] = json;
}
const str = { type: 'string' }, bool = { type: 'boolean' };
spec.components.schemas.IdentityUser = obj({ id: ref('Id'), name: str, email: { type: 'string', format: 'email' }, phone: { type: 'string', nullable: true }, dateOfBirth: { type: 'string', format: 'date', nullable: true }, role: { type: 'string', enum: ['CLIENTE', 'FORNECEDOR', 'SUPERVISOR', 'COLABORADOR', 'ADMIN'] }, status: { type: 'string', enum: ['ATIVO', 'INATIVO', 'BLOQUEADO', 'PENDENTE_VERIFICACAO'] } });
spec.components.schemas.IdentityAccess = obj({ accessToken: { type: 'string', description: 'JWT emitido em runtime, nunca valor fixo de exemplo' }, tokenType: { type: 'string', enum: ['Bearer'] }, expiresIn: { type: 'integer', maximum: 900 }, user: ref('IdentityUser') });
spec.components.schemas.IdentityChallenge = obj({ challengeToken: { type: 'string', pattern: '^[a-f0-9]{64}$', description: 'Token opaco restrito; não é bearer de acesso. Nunca enviar em URL.' }, expiresIn: { type: 'integer', enum: [300] }, next: { type: 'string', enum: ['VERIFY_2FA', 'ENROLL_2FA'] }, method: { type: 'string', nullable: true, enum: ['APP', 'SMS', 'EMAIL', null] }, provisioningUri: { type: 'string', description: 'Segredo TOTP somente na inscrição/rotação autorizada; usar em aplicativo autenticador, não registrar.' } }, ['challengeToken', 'expiresIn', 'next', 'method']);
spec.components.schemas.IdentityPreferences = { ...spec.components.schemas.IdentityInput_preferences, required: ['tema', 'tamanho_fonte', 'alto_contraste', 'modo_acessibilidade', 'idioma', 'aparencia'] };
spec.components.schemas.IdentityDeletion = obj({ id: ref('Id'), status: { type: 'string', enum: ['RECEBIDA', 'EM_ANALISE'] }, accountStatus: { type: 'string', enum: ['INATIVO'] }, message: str });
spec.components.schemas.IdentityControls = obj({ compras_permitidas: bool, assinaturas_permitidas: bool, limite_minutos_diarios: { type: 'integer', minimum: 1, maximum: 1440 } });
spec.components.schemas.IdentityAuthorization = obj({ id: ref('Id'), purpose: { type: 'string', enum: ['COMPRA', 'ASSINATURA'] }, operationReference: str, expiresAt: { type: 'string', format: 'date-time' } });
spec.components.schemas.IdentityPrivacyStatus = obj({ id_solicitacao: ref('Id'), id_usuario: ref('Id'), tipo: { type: 'string', enum: ['EXCLUSAO'] }, status: { type: 'string', enum: ['RECEBIDA', 'EM_ANALISE', 'CONCLUIDA', 'RECUSADA'] }, motivo_decisao: { type: 'string', nullable: true }, criada_em: str, encerrada_em: { type: 'string', nullable: true } });
for (const [kind, pk, schema] of [['addresses', 'id_endereco', 'address'], ['contacts', 'id_contato', 'contact']]) {
    const fields = structuredClone(spec.components.schemas[`IdentityInput_${schema}`].properties);
    // Colunas opcionais legadas podem ser NULL; respostas sempre têm principal booleano.
    if (kind === 'addresses') for (const k of Object.keys(fields).filter(k => k !== 'principal')) fields[k] = { ...fields[k], nullable: true };
    spec.components.schemas[`Identity_${kind}`] = obj({ [pk]: ref('Id'), ...fields });
    spec.components.schemas[`IdentityList_${kind}`] = obj({ items: { type: 'array', maxItems: 100, items: ref(`Identity_${kind}`) }, pagination: ref('Pagination') });
}
const descriptions = {
    register: 'Cadastro público somente CLIENTE. Exige CAPTCHA, termos/privacidade atuais e provider confiável de idade; até 16 anos exige prova de responsável. Nenhum JWT emitido no cadastro.',
    registerAlias: 'Alias compatível de POST /api/auth/register.',
    renewAge: 'Renova prova de idade pelo provider real, vinculada aos dados já persistidos; atualiza histórico e aceite dos documentos vigentes. Sem autodeclaração. Troca de responsável exige revisão separada do vínculo (409).',
    login: 'Credenciais inválidas/inativas retornam mesma resposta 401. Conta com fator ativo exige prova; ADMIN/SUPERVISOR sem fator recebem somente desafio restrito para enrollment. Desafio: 5 minutos, máximo 5 tentativas persistidas. Fator APP usa TOTP com proteção contra replay.',
    enroll: 'Ativa somente após verify. Informar challengeToken de enrollment obrigatório, OU Bearer + password. Rotação exige também code do fator atual; antigo permanece ativo até confirmação. Chave AES separada obrigatória. SMS/e-mail indisponíveis sem provider integrado.',
    verify: 'Verifica desafio de login ou enrollment, expiração, 5 tentativas, consumo único e passo TOTP crescente. Concluído, emite JWT. GET não consome tokens.',
    logout: 'Revoga a sessão atual persistentemente.',
    forgot: 'Resposta genérica para e-mail existente/ausente/inativo. Token aleatório armazenado somente como hash, expira em 30 minutos. E-mail fora da transação. Falha de entrega não informa existência. Provider global ausente retorna 503.',
    reset: 'Token de uso único. Invalida todos os resets/desafios e revoga todas as sessões. 2FA permanece ativo; reset de senha não recupera fator perdido.',
    disableFactor: 'Reautenticação com senha e TOTP atual. ADMIN/SUPERVISOR não podem desativar 2FA obrigatório. Revoga sessões e desafios.',
    patch: 'Campos permitidos apenas. E-mail exige currentPassword, code se 2FA ativo e emailProof verificada pelo provider. Senha exige confirmação, currentPassword e code se aplicável. Alterações sensíveis revogam todas as sessões. CPF, idade, role e status não são autoatribuíveis.',
    deleteAccount: 'Desativa conta e revoga autenticação; registra solicitação durável. 202 confirma recebimento, NÃO exclusão/anonimização concluída. Retenção financeira e política de anonimização exigem decisão de privacidade. Location aponta consulta administrativa; guardar id para atendimento. Último ADMIN ativo não é desativado.',
    export: 'Portabilidade paginada do módulo identidade, própria conta, senha e fator se ativo. Seções explícitas; sem hash, segredo, token ou referência interna de prova. CPF só aparece nesta exportação privada. Outros módulos devem acrescentar seus exports. Novo TOTP necessário em cada página sensível.',
    adminCreate: 'Somente ADMIN com 2FA. Cria contas internas; CPF/e-mail únicos. Novo ADMIN/SUPERVISOR passa por enrollment obrigatório. Primeiro ADMIN via CLI seguro bootstrap:admin.',
    adminAccess: 'Somente ADMIN com 2FA. Revoga sessões/desafios/resets ao alterar perfil/status. Preserva último ADMIN ativo. Reativação de conta inativa/bloqueada exige revisão, retorna 409.',
    authorizeMinor: 'Somente responsável com vínculo legal comprovado e ativo. Controle parental deve permitir finalidade; prova de idade vigente. Autorização por operação, prazo de até 24 horas e UNIQUE. Checkout/assinaturas futuros devem consultar requireAge na sua transação.'
};
const params = [{ name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } }, { name: 'cursor', in: 'query', schema: { type: 'string', pattern: '^[1-9][0-9]{0,19}$' }, description: 'Último ID da página anterior, ordenação crescente estável.' }];
for (const r of identityOperations) {
    const schema = r.operationId === 'login' ? { oneOf: [ref('IdentityAccess'), ref('IdentityChallenge')] }
        : r.operationId === 'verify' ? ref('IdentityAccess')
        : r.operationId === 'enroll' ? ref('IdentityChallenge')
        : ['register', 'registerAlias', 'me', 'patch', 'adminCreate', 'adminAccess', 'adminGet'].includes(r.operationId) ? ref('IdentityUser')
        : r.operationId === 'deleteAccount' ? ref('IdentityDeletion')
        : r.operationId === 'forgot' ? obj({ message: str })
        : r.operationId === 'privacyStatus' ? ref('IdentityPrivacyStatus')
        : ['authorizeMinor', 'authorization'].includes(r.operationId) ? ref('IdentityAuthorization')
        : r.operationId === 'renewAge' ? obj({ ageBand: { type: 'string', enum: ['ATE_16', 'MAIOR_16'] }, expiresAt: { type: 'string', format: 'date-time' } })
        : r.action === 'preferences' ? ref('IdentityPreferences')
        : r.action === 'parental' ? ref('IdentityControls')
        : Array.isArray(r.action) ? ref(`${r.action[0] === 'list' ? 'IdentityList' : 'Identity'}_${r.action[1]}`)
        : obj({ section: str, data: { type: 'object', nullable: true, additionalProperties: true }, scope: { type: 'string', enum: ['IDENTITY_MODULE'] } });
    const scope = r.access === 'admin' ? 'ADMIN autenticado e 2FA completo.' : r.access === 'private' ? 'Todos os perfis autenticados; apenas dados próprios e vínculos comprovados, sem bypass ADMIN.' : r.access === 'enrollment' ? 'Bearer+senha OU desafio restrito de enrollment.' : 'Público; sem bearer obrigatório.';
    const op = { operationId: r.operationId, tags: ['Identidade'], summary: descriptions[r.operationId]?.split('. ')[0] ?? r.operationId.replaceAll('_', ' '), description: `${scope} ${descriptions[r.operationId] ?? 'Campos estritos; propriedade validada em toda operação. Principais alterados atomicamente sob lock do usuário, constraints UNIQUE preservadas.'} Cache-Control: no-store. IDs em strings. Limites geral e de fluxo podem retornar 429.`, security: r.access === 'enrollment' ? [{}, { bearerAuth: [] }] : ['public'].includes(r.access) ? [] : [{ bearerAuth: [] }], responses: {} };
    if (r.path.includes('{id}')) op.parameters = [...r.path.matchAll(/\{(\w+)\}/g)].map(m => ({ name: m[1], in: 'path', required: true, schema: ref('Id') }));
    if (r.operationId.startsWith('list_') || r.operationId === 'export') op.parameters = [...(op.parameters ?? []), ...params];
    if (r.operationId === 'export') op.parameters.push({ name: 'section', in: 'query', schema: { type: 'string', enum: ['profile', 'addresses', 'contacts', 'preferences', 'consents', 'age', 'privacy', 'guardians', 'authorizations', 'sessions', 'factors', 'recoveries', 'controls'], default: 'profile' } });
    if (r.schema) op.requestBody = { required: true, content: { 'application/json': { schema: ref(`IdentityInput_${r.schema}`) } } };
    op.responses[r.status] = { description: r.status === 204 ? 'Concluído; sem corpo' : r.status === 202 ? 'Solicitação registrada; processamento de privacidade pendente' : 'Operação concluída', headers: { 'Cache-Control': { schema: { type: 'string', enum: ['no-store'] } }, 'X-Request-Id': { $ref: '#/components/headers/RequestId' }, ...([201, 202].includes(r.status) && { Location: { schema: { type: 'string' }, description: 'Caminho do recurso ou acompanhamento conforme descrição da operação' } }) }, ...(r.status !== 204 && { content: { 'application/json': { schema: obj({ success: { type: 'boolean', enum: [true] }, data: schema, requestId: { type: 'string', format: 'uuid' } }) } } }) };
    for (const [code, name] of Object.entries({ 400: 'BadRequest', 401: 'Unauthorized', 403: 'Forbidden', 404: 'NotFound', 409: 'Conflict', 413: 'PayloadTooLarge', 415: 'UnsupportedMedia', 422: 'ValidationError', 429: 'RateLimited', 500: 'InternalError', 503: 'Unavailable' })) op.responses[code] = { $ref: `#/components/responses/${name}` };
    spec.paths[r.path] ??= {}; spec.paths[r.path][r.method] = op;
}
// Exemplos seguros sem credenciais, tokens ou provas fictícias de sucesso.
spec.components.schemas.IdentityUser.example = { id: '1', name: 'Pessoa de teste', email: 'pessoa@example.invalid', phone: null, dateOfBirth: '2000-01-01', role: 'CLIENTE', status: 'ATIVO' };
spec.components.schemas.IdentityInput_preferences.example = { tema: 'ESCURO', tamanho_fonte: 'GRANDE', alto_contraste: true, aparencia: 'cineastra' };
spec.components.schemas.IdentityInput_address.example = { logradouro: 'Rua de teste', numero: '10', cidade: 'Cidade de teste', estado: 'SP', principal: true };
await writeFile(file, `${JSON.stringify(spec, null, 2)}\n`);
console.info(`OpenAPI atualizado: ${identityOperations.length} operações de identidade.`);
