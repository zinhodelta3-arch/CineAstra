import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const spec = JSON.parse(readFileSync(resolve(root, 'docs/openapi.json'), 'utf8'));
const output = resolve(root, '../docs/backend-thunder-client.md');
const methods = new Set(['get', 'post', 'put', 'patch', 'delete']);
const operations = [];
for (const [path, item] of Object.entries(spec.paths)) {
  for (const [method, operation] of Object.entries(item)) {
    if (methods.has(method)) operations.push({ path, method: method.toUpperCase(), operation });
  }
}

function deref(schema, depth = 0) {
  if (!schema || depth > 4) return schema;
  if (schema.$ref) return deref(schema.$ref.split('/').slice(1).reduce((v, key) => v?.[key], spec), depth + 1);
  return schema;
}

function escapeCell(value) {
  return String(value ?? '—').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').trim() || '—';
}

function fields(schema) {
  const s = deref(schema);
  if (!s) return '—';
  if (s.oneOf || s.anyOf) return 'variantes; consultar OpenAPI';
  if (s.type === 'array') return 'array; consultar OpenAPI';
  const names = Object.keys(s.properties ?? {});
  if (!names.length) return s.description || (s.type === 'object' ? 'JSON; consultar OpenAPI' : s.type || 'consultar OpenAPI');
  return names.map(name => `${name}${s.required?.includes(name) ? '*' : ''}`).join(', ');
}

function purpose(op) {
  const summary = op.summary || op.operationId || 'Operação';
  if (!/^(?:me|privacyStatus|authorization|(?:admin\s*)?(?:list|get|save|create|patch|update|archive|delete|set|quote|reconcile|request|send|receive|approve|cancel|resolve|start|end|add|remove)\b)/i.test(summary)) return summary;
  const description = (op.description || '').replace(/\s+/g, ' ').trim();
  if (!description) return summary;
  const detail = description.split(/(?<=[.!?])\s+/).slice(0, 2).join(' ').slice(0, 190);
  return `${summary} — ${detail}${description.length > 190 ? '…' : ''}`;
}

const lines = [`# CineAstra — roteiro de API e banco para Thunder Client`,
  '',
  `Atualizado em 13/10/2026. Fonte: \`backend/docs/openapi.json\` e rotas registradas. **${operations.length} operações HTTP**, em ${Object.keys(spec.paths).length} caminhos. Este arquivo documenta o contrato atual; não é registro de execução manual de todas as rotas.`,
  '',
  '## 1. Preparar ambiente de desenvolvimento',
  '',
  '1. Use Node.js 24, npm 11 e MySQL 8.0. Na pasta `backend`, execute `npm ci` e configure `.env` a partir de `.env.example` com **credenciais de desenvolvimento**. Gere `JWT_SECRET` e `TWO_FACTOR_ENCRYPTION_KEY`; informe versões jurídicas reais quando necessárias. Nunca coloque `.env` no Thunder Client ou no Git.',
  '2. Use um schema vazio e não produtivo. Antes de qualquer DDL, confira host/schema e rode `npm run migrate -- --plan`. Para aplicar nesse schema confirmado, defina `MIGRATION_CONFIRMED_NON_PRODUCTION=true` e `MIGRATION_TARGET` igual a `DB_NAME`, então execute `npm run migrate -- --apply`. Banco legado com dados exige inspeção e baseline manual; o runner recusa ledger ausente/divergente.',
  '3. Execute `npm start`. O padrão é `http://127.0.0.1:3001`; confirme `PORT` e `PUBLIC_ORIGIN` do `.env`. `GET /health` verifica o processo; `GET /ready` verifica banco e serviços internos de logs/retenção. Em desenvolvimento, `/openapi.json` e `/api-docs/` expõem o contrato; em produção, as rotas de documentação são desativadas.',
  '4. Crie no Thunder Client um ambiente `CineAstra Dev` com `baseUrl=http://127.0.0.1:3001`, `tokenCliente`, `tokenAdmin`, `tokenStaff` e IDs capturados das respostas. Envie `Authorization: Bearer <token>` só nas rotas que exigem bearer. Para JSON, use `Content-Type: application/json`; para upload, escolha **Form** e arquivo no campo `image` (o cliente define o boundary).',
  '',
  '### Convenções de teste',
  '',
  '- Substitua `{id}`, `{orderId}` e demais parâmetros de caminho pelo ID real, sem chaves. IDs `BIGINT` e valores monetários `DECIMAL` são strings nas respostas; mantenha IDs como strings no JSON.',
  '- `*` marca campo obrigatório no corpo **segundo a OpenAPI**. Campos aninhados, enums, limites, regras de negócio e casos de autorização devem ser conferidos na operação correspondente em `/api-docs/` ou `backend/docs/openapi.json`. Parâmetros de query e headers obrigatórios aparecem explicitamente abaixo.',
  '- Resposta comum: `{"success":true,"data":...,"requestId":"..."}`; erro: `{"success":false,"code":"...","message":"...","requestId":"...","details":...}`. `204` não tem corpo. Para cada teste, confira status, `requestId`, corpo, propriedade, perfil e efeitos no banco. Erros usuais: 400/422 entrada, 401 autenticação, 403 autorização, 404 recurso invisível/inexistente, 409 conflito, 429 limite e 503 dependência indisponível.',
  '- Rotas públicas não exigem JWT, mas podem exigir CAPTCHA, token de confirmação ou assinatura externa. O prefixo `/api/admin` indica gestão, mas o acesso correto é definido por operação e vínculo; não infira permissão apenas pela URL.',
  '- Para requisições com `Idempotency-Key`, envie uma chave única estável na repetição **da mesma operação**; repetir com corpo diferente deve ser tratado como conflito. Não reutilize chaves entre cenários diferentes.',
  '',
  '## 2. Preparar identidade, autenticador e 2FA',
  '',
  '### Antes de pedir o primeiro código',
  '',
  '1. Confirme que as migrations de identidade estão aplicadas no banco **não produtivo** e que `GET /ready` responde 200. No `.env`, configure `JWT_SECRET` aleatório de pelo menos 32 bytes, `TWO_FACTOR_ENCRYPTION_KEY` aleatória de **32 bytes codificados em Base64**, `JWT_ISSUER`, `JWT_AUDIENCE` e `JWT_TTL_SECONDS` (máximo 900). As duas chaves devem ser diferentes. Reinicie a API após alterar `.env`.',
  '2. Configure um `captchaProvider.verify` real ou um adaptador restrito ao ambiente de teste por meio de `startServer(config, overrides)`/`createApp`. O `server.js` padrão **não** ativa CAPTCHA com uma variável: `CAPTCHA_PROVIDER` aceita somente `unavailable`. Cadastro, login, esqueci a senha e reset exigem `captchaToken` válido; sem provider, retornam 503.',
  '3. Para cadastro público de CLIENTE, configure também `TERMS_VERSION`, `PRIVACY_VERSION`, `IDENTITY_LEGAL_BASIS` aprovados e `identityProviders.age.verify` que valide uma prova real vinculada a e-mail, CPF e data de nascimento. Até 16 anos, é obrigatório `identityProviders.guardian.verify` e um responsável com vínculo válido. O provider padrão desses recursos retorna 503. O cadastro não devolve JWT; faça login depois.',
  '4. O primeiro ADMIN é criado pelo CLI `npm run bootstrap:admin -- --apply`, que lê JSON do **stdin** com `name`, `email`, `cpf`, `dateOfBirth`, `password`, `passwordConfirmation` e `role: "ADMIN"`; exige `BOOTSTRAP_ADMIN_CONFIRMED=true` e um schema de desenvolvimento já migrado. Forneça a senha por entrada local protegida, sem salvar credenciais em coleção ou arquivo versionado. A senha nova exige pelo menos 12 caracteres, maiúscula, minúscula, número e símbolo, até 72 bytes UTF-8. O bootstrap só funciona quando ainda não existe ADMIN.',
  '',
  '### ADMIN/SUPERVISOR: ativação obrigatória do aplicativo autenticador',
  '',
  '1. No Thunder Client, faça `POST {{baseUrl}}/api/auth/login` com `Content-Type: application/json` e `{"email":"<email-admin>","password":"<senha>","captchaToken":"<captcha-válido>"}`. A resposta 200 contém `data.challengeToken`, `data.expiresIn: 300`, `data.next: "ENROLL_2FA"` e `data.method: null`. **Esse challengeToken não é bearer JWT.**',
  '2. Antes dos cinco minutos, faça `POST {{baseUrl}}/api/auth/2fa/enroll`, sem bearer, com `{"challengeToken":"<challengeToken-do-login>","method":"APP"}`. A resposta 200 traz **outro** `data.challengeToken` e `data.provisioningUri`. Use apenas o novo desafio na etapa seguinte.',
  '3. Adicione uma conta no aplicativo autenticador que aceite URI `otpauth://`/TOTP. Importe a `provisioningUri` de forma local e privada; se o aplicativo exigir QR, gere-o apenas em um meio confiável que não envie a URI a serviços externos. O fator implementado é `APP`: SHA-1, 6 dígitos, período de 30 segundos. Mantenha o relógio do telefone sincronizado. Nunca cole a URI, segredo, códigos ou tokens em prints, issues ou coleções compartilhadas.',
  '4. Leia o código atual no aplicativo e faça `POST {{baseUrl}}/api/auth/2fa/verify` com `{"challengeToken":"<challengeToken-do-enroll>","code":"123456"}` (substitua pelo código real). Resposta 200: `data.accessToken`, `data.tokenType: "Bearer"`, `data.expiresIn` e `data.user`. Guarde **somente** o JWT vigente em `tokenAdmin` local e use `Authorization: Bearer {{tokenAdmin}}` nas rotas administrativas.',
  '5. Nos próximos logins, `POST /api/auth/login` devolve `data.next: "VERIFY_2FA"`, `method: "APP"` e um desafio novo. Faça `POST /api/auth/2fa/verify` com esse desafio e um **novo** código do aplicativo; atualize `tokenAdmin`. Cada desafio expira em cinco minutos e admite no máximo cinco tentativas. Um código TOTP usado não pode ser repetido; se acabou de validar, espere o próximo período de 30 segundos.',
  '',
  '### CLIENTE e manutenção do fator',
  '',
  '- CLIENTE sem fator ativo recebe `data.accessToken` diretamente no login. Para habilitar 2FA opcional, use esse JWT em `Authorization: Bearer {{tokenCliente}}` e chame `POST /api/auth/2fa/enroll` com `{"password":"<senha-atual>","method":"APP"}`. Importe a `provisioningUri` e valide o **novo** `challengeToken` em `/api/auth/2fa/verify`. A ativação revoga sessões anteriores: substitua o JWT pelo `accessToken` retornado na verificação.',
  '- Para trocar o autenticador, com sessão ativa faça `POST /api/auth/2fa/enroll` com `{"password":"<senha-atual>","code":"<código-do-fator-atual>","method":"APP"}`; importe a nova URI e verifique o novo desafio. O fator anterior permanece válido até a prova do novo. Para CLIENTE com fator opcional, `POST /api/auth/2fa/disable` exige `password` e `code` atuais; ADMIN/SUPERVISOR não podem desativar o fator obrigatório.',
  '- `POST /api/auth/logout` revoga a sessão atual e responde 204; descarte o JWT local. Não há refresh token ou cookie de sessão. Expiração do JWT exige novo login e, se houver fator, novo desafio. SMS e EMAIL estão previstos no contrato, mas `enroll` retorna 503 até existir provider real de destino e entrega; use `APP` nos testes atuais.',
  '',
  '### Dependências para testar os demais módulos',
  '',
  '| Fluxo | Preparação necessária | Sem a dependência |',
  '| --- | --- | --- |',
  '| Catálogo, locais, sessões, equipes e operações ADMIN | ADMIN com 2FA ativo, dados de referência e vínculo de equipe quando a rota exigir | 401/403/404 ou dados vazios conforme o caso. |',
  '| Perfil, menores e privacidade | CLIENTE autenticado, prova de idade vigente, aceites/documentos e responsável real quando aplicável | 403/409/422/503; o ID do responsável no corpo não substitui comprovação. |',
  '| Preço, pedido e checkout | Catálogo/local/sessão/assento publicados, preço/custo configurado, conteúdo contratual publicado, `offerHash` vigente, aceite e chave idempotente | 409/422/503; cotação não reserva nem cobra. |',
  '| Pagamento, reembolso e método tokenizado | Provider de pagamento sandbox/real integrado em `startServer`, tokenização, consulta e assinatura de webhook válidas | 503 ou estado `PENDENTE`; não assuma aprovação por resposta 202. |',
  '| Imagens | Diretórios privados de staging/galeria separados e graváveis; arquivo JPEG/PNG/WebP no campo `image`; papel/propriedade corretos | 403/413/415/503 ou falha de armazenamento. |',
  '| Newsletter, recuperação e confirmação por e-mail | Provider de e-mail real/de teste integrado, tokens entregues e, para webhook, assinatura verificada | 503 ou resposta genérica sem prova de entrega. |',
  '| Streaming e IA | Provider de assinatura de mídia/IA integrado e direitos/contrato válidos | 503; não há reprodução ou resposta externa fictícia. |',
  '',
  'Os providers são passados por código em `startServer(config, overrides)`/`createApp`; `npm start` usa defaults indisponíveis. Os testes automatizados possuem fixtures próprias, mas elas não configuram o servidor iniciado manualmente. Para teste manual de ponta a ponta, use uma composição de desenvolvimento com adaptadores sandbox explícitos e nunca aponte esse ambiente para produção.',
  '',
  '## 3. Sequência sugerida no Thunder Client',
  '',
  '1. `GET {{baseUrl}}/health` → 200. `GET {{baseUrl}}/ready` → 200 somente com MySQL e serviços internos prontos; 503 pede inspeção do ambiente.',
  '2. Obtenha usuários de teste por cadastro real ou bootstrap administrativo documentado. O cadastro/login público exige CAPTCHA e provedores de identidade confiáveis. O provider padrão indisponível pode devolver 503; não marque o fluxo como aprovado nesse caso.',
  '3. `POST /api/auth/login` com `email`, `password`, `captchaToken`. Se a resposta trouxer desafio, conclua `POST /api/auth/2fa/verify` antes de usar bearer. ADMIN/SUPERVISOR exigem 2FA. Guarde o token retornado apenas no ambiente local do Thunder Client.',
  '4. Teste leituras públicas (catálogo, locais, sessões, planos), depois operações próprias com token CLIENTE e gestão com token ADMIN. Para cada escrita, faça leitura posterior e teste 401 sem token, 403/404 com usuário sem vínculo, 422 inválido e 409 quando houver conflito legítimo.',
  '5. Fluxo comercial: publique dados e preços necessários; `POST /api/orders/quote` → obtenha `offerHash`; `POST /api/orders/checkout` com aceite e `Idempotency-Key` → guarde `orderId`; `POST /api/payments` com método tokenizado e outra chave → acompanhe `GET /api/payments/{id}` e `GET /api/orders/{orderId}`. O estado `PENDENTE` não significa pagamento aprovado.',
  '6. Somente após evento autenticado de provider configurado, confira ticket, streaming, cobrança ou reembolso. Webhooks não devem ser forjados manualmente como prova de integração: exigem assinatura válida do provedor e corpo bruto. O provider padrão de pagamento/e-mail/streaming/IA falha explicitamente quando indisponível.',
  '',
  '### Corpos de referência',
  '',
  '`POST /api/auth/login` (o `captchaToken` deve vir do provedor de teste configurado):',
  '',
  '```json',
  '{"email":"cliente@exemplo.test","password":"senha-de-teste","captchaToken":"token-valido-do-provedor"}',
  '```',
  '',
  '`POST /api/orders/quote`:',
  '',
  '```json',
  '{"localId":"2","lines":[{"kind":"SESSION","id":"3","seatId":"4","quantity":1}]}',
  '```',
  '',
  '`POST /api/orders/checkout`, com header `Idempotency-Key: checkout-cenario-001` e hash **recebido da cotação atual**:',
  '',
  '```json',
  '{"localId":"2","lines":[{"kind":"SESSION","id":"3","seatId":"4","quantity":1}],"acceptance":{"offerHash":"<hash-real-da-cotacao>","accepted":true}}',
  '```',
  '',
  '`POST /api/payments`, com header `Idempotency-Key: pagamento-cenario-001`:',
  '',
  '```json',
  '{"orderId":"<orderId-real>","methodId":"<methodId-tokenizado-real>"}',
  '```',
  '',
  '## 4. Catálogo completo de operações HTTP',
  '',
  'A coluna **Acesso** indica apenas bearer obrigatório no contrato. Leia a descrição da operação na OpenAPI para perfil, propriedade, vínculo operacional e provedor. **Entrada** lista query (`?`), headers (`H:`), MIME e campos de primeiro nível do corpo; `*` indica obrigatório. **Sucesso** lista somente códigos 2xx/3xx declarados, não substitui a verificação da resposta.',
  ''
];

const groups = new Map();
for (const entry of operations) {
  const tag = entry.operation.tags?.[0] ?? 'Outros';
  if (!groups.has(tag)) groups.set(tag, []);
  groups.get(tag).push(entry);
}
for (const [tag, entries] of groups) {
  lines.push(`### ${tag} (${entries.length})`, '', '| Método | URL | Finalidade | Acesso | Entrada | Sucesso |', '| --- | --- | --- | --- | --- | --- |');
  for (const { path, method, operation: op } of entries) {
    const params = (op.parameters ?? []).filter(p => p.in !== 'path').map(p => `${p.in === 'header' ? 'H:' : '?'}${p.name}${p.required ? '*' : ''}`);
    const content = op.requestBody && Object.entries(op.requestBody.content ?? {})[0];
    if (content) params.push(`${content[0]}: ${fields(content[1].schema)}`);
    const access = op.security?.length === 0 ? 'Sem bearer' : 'Bearer';
    const success = Object.keys(op.responses ?? {}).filter(code => /^[23]/.test(code)).join(', ') || '—';
    lines.push(`| ${method} | \`${path}\` | ${escapeCell(purpose(op))} | ${access} | ${escapeCell(params.join('; ') || '—')} | ${success} |`);
  }
  lines.push('');
}

lines.push('## 5. Banco de dados: o que conferir após HTTP', '',
  'Thunder Client testa HTTP; a persistência deve ser verificada em **MySQL de desenvolvimento ou teste** com consultas somente leitura. O schema de referência, as tabelas e ENUMs estão em `docs/banco-referencia-cineastra.txt`; DDL executável em `backend/migrations/`. A fonte de verdade para o estado aplicado é `schema_migrations` no próprio schema alvo.',
  '',
  '| Fluxo | Entidades principais a observar | Verificação |',
  '| --- | --- | --- |',
  '| Identidade, sessão, consentimento | `usuarios`, `autenticacao_2fa`, `sessoes_autenticacao`, `consentimentos_usuario`, `desafios_2fa` | Cadastro autorizado, fator APP ativo, sessão com `two_factor_verified`, revogação e ausência de token em logs. |',
  '| Catálogo, cinema e equipe | `filmes`, `generos`, `filme_generos`, `locais`, `salas`, `assentos`, `sessoes`, `equipes`, `equipe_membros` | Relações, estados ativos e vínculo operacional. |',
  '| Mídia, fornecedores e estoque | `filmes_imagens`, `insumos_imagens`, `combos_imagens`, `fornecedores`, `insumos`, `equipamentos`, `movimentacoes_estoque`, `solicitacoes_estoque`, `logistica` | Associação de imagem, propriedade, saldo e histórico de movimentações. |',
  '| Pedido e pagamento | `pedidos`, `itens_pedido`, `assento_ocupacoes`, `pagamentos`, `tickets` | Reserva, expiração, intenção, evento verificado e emissão única do direito. |',
  '| Assinatura e compensação | `planos`, `assinaturas`, `assinatura_cobrancas`, `reembolso_solicitacoes` | Contrato, competência, status de cobrança e compensação pendente/concluída. |',
  '| Newsletter, suporte e auditoria | `newsletter_inscritos`, `newsletter_campanhas`, `newsletter_envios`, `suporte`, `logs` | Consentimento, entrega/supressão, histórico e trilha redigida. |',
  '',
  'Consultas seguras para um schema **não produtivo confirmado** (substitua IDs e nomes conforme o schema aplicado):',
  '',
  '```sql',
  'SELECT DATABASE() AS schema_atual, VERSION() AS versao_mysql;',
  'SELECT name, status, applied_at FROM schema_migrations ORDER BY name;',
  "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() ORDER BY TABLE_NAME;",
  "SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pedidos' ORDER BY ORDINAL_POSITION;",
  'SELECT id_pedido, status FROM pedidos WHERE id_pedido = ?;',
  'SELECT id_pagamento, status FROM pagamentos WHERE id_pedido = ?;',
  'SELECT id_usuario, metodo, ativo FROM autenticacao_2fa WHERE id_usuario = ?;',
  'SELECT id_usuario, two_factor_verified, revogada_em, expiracao FROM sessoes_autenticacao WHERE id_usuario = ? ORDER BY id_sessao_auth DESC LIMIT 5;',
  '```',
  '',
  'Use parâmetros na ferramenta SQL para os `?`. Não consulte `chave`, `chave_pendente`, `token_hash` ou `jti_hash` em relatórios/prints. Não rode `DELETE`, `UPDATE`, seeds ou migrations em produção para “conferir” um teste. A API deve ser validada também por `node --test tests/identity.test.js` (fluxo de 2FA com fixtures), `npm test`, `npm run validate:openapi` e, no Windows com MySQL 8 instalado, `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/runIsolatedMysqlTests.ps1` na pasta `backend`. Esse runner cria um schema temporário `_test` e executa a suíte de integração; não demonstra upgrade de um banco legado real.',
  '',
  '## 6. Limites de aceite', '',
  '- A OpenAPI descreve rotas e formatos, mas um 2xx isolado não valida a transação nem efeitos externos. Verifique banco, concorrência, repetição idempotente e usuário sem permissão onde fizer sentido.',
  '- Gateway de pagamento, assinatura de webhook, CAPTCHA, identidade, e-mail, streaming e IA requerem adaptadores reais ou um ambiente sandbox explicitamente configurado. Resposta 503 do adaptador padrão é uma indisponibilidade esperada, não sucesso.',
  '- Antes de cada rodada manual, compare `npm run validate:openapi` com o código atual. Esta lista foi gerada da spec nesta data; qualquer rota nova exige regenerar a spec e este guia.',
  '',
  '## Fontes', '',
  '- `backend/docs/openapi.json`: operações, parâmetros, MIME, esquemas, códigos e autenticação.',
  '- `backend/routes/*.js` e `backend/app.js`: registro HTTP.',
  '- `backend/migrations/*.sql` e `backend/scripts/migrate.js`: DDL e proteção de aplicação.',
  '- `backend/README.md` e `docs/backend-*.md`: preparação, regras e limites por módulo.',
  '');

writeFileSync(output, lines.join('\n'), 'utf8');
console.log(`Guia criado: ${output} (${operations.length} operações)`);
