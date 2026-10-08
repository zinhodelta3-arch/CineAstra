# Prompt 02 — identidade, acesso e privacidade

Atualizado em 08/10/2026. **CONCLUÍDO COM PENDÊNCIAS externas e de validação MySQL; não pronto para produção.** Somente Prompt 02. Código integrado à arquitetura ESM existente; nenhuma alteração no frontend. Fontes integrais copiadas sem modificação de `agents/` para os quatro caminhos de `docs/` exigidos pelo AGENTS.md.

## Contratos implementados

- JWT bearer HS256, issuer/audience e duração configurada até 900s. `sessoes_autenticacao` registra JTI em SHA-256, expiração, revogação e prova 2FA. Cada acesso consulta sessão e usuário atual. Não há refresh token nem autenticação por cookie.
- Login não entrega JWT a ADMIN/SUPERVISOR antes da prova obrigatória; todos os demais usuários com fator ativo também completam 2FA. Sem fator obrigatório configurado, retorna desafio restrito de enrollment, nunca token de acesso.
- TOTP APP via OTPAuth 9.5.2, seis dígitos/30s/janela de um passo. `ultimo_passo` crescente impede replay. Segredo AES-256-GCM com AAD vinculada ao ID e chave dedicada de 32 bytes em base64; não reutilizar JWT_SECRET. URI de provisionamento somente na inscrição/rotação autorizada; não aparece em DTO, log ou export.
- Desafios opacos aleatórios de 32 bytes; somente hash no banco, 5 minutos, máximo 5 tentativas persistidas. Tentativa inválida é commitada antes do 401. Novo desafio invalida os anteriores. Rotação exige senha + fator atual, preserva fator anterior até prova do novo. Ativação/rotação revoga sessões. ADMIN/SUPERVISOR não desativam fator obrigatório.
- **SMS/EMAIL ainda indisponíveis:** ENUMs/contratos de providers estão preservados, porém enrollment retorna 503. Necessário selecionar fornecedor, definir verificação de destino, protocolo de desafio, entrega/validação e integrar adapter real. Apenas preencher uma variável de ambiente não habilita esses métodos. Nenhum envio simulado em runtime.
- Senha nova: mínimo 12 caracteres, maiúscula/minúscula/número/símbolo, confirmação idêntica, máximo 72 bytes UTF-8. bcryptjs assíncrono, custo padrão 12 (10–14 configurável). Medição local de três hashes custo 12: 185/181/180ms; recalibrar sob carga no ambiente de destino.
- Reset: resposta genérica para conta inexistente/inativa, token 32 bytes/hash hexadecimal na tabela existente, prazo 30min, consumo único sob lock, revogação de todas as sessões/desafios. E-mail enviado fora de transação. Falha de entrega mantém mensagem genérica, invalida token e registra evento técnico sem endereço/segredo. Provider global ausente retorna 503 para qualquer e-mail. Recuperação de senha não remove 2FA.
- Perfil próprio; alteração de senha/e-mail exige reautenticação e fator atual quando ativo. E-mail adicionalmente exige `emailProof` verificada pelo provider. Alteração sensível revoga sessões/resets/desafios. CPF, data de nascimento, papel e status não são campos editáveis por autoatribuição.
- Endereços/contatos têm CRUD completo próprio, principal único (contato por tipo), SQL parametrizado e whitelist de colunas. Todas as escritas bloqueiam primeiro o usuário. Paginação por ID crescente, padrão 20/máximo 100, cursor decimal. Preferências usam PATCH; `aparencia` permanece separada de CLARO/ESCURO/SISTEMA.
- Administração cria contas internas, consulta DTO mínimo e altera perfil/status com revogação. Último ADMIN ativo preservado por uma linha estável de lock. Reativação de conta inativa/bloqueada não é automática; exige revisão de identidade/privacidade. Primeiro ADMIN somente pelo CLI de bootstrap controlado.

## Cadastro, idade e supervisão

Cadastro público cria apenas CLIENTE. Normaliza e-mail e CPF, valida CPF/data, exige versões exatas de termos/privacidade configuradas e base legal aprovada. Não inventa texto institucional ou enquadramento jurídico. Provas externas são verificadas antes da transação; evidência mínima e aceites são gravados junto ao usuário e à auditoria.

`age.verify({proof,email,cpf,dateOfBirth,signal})` deve verificar autenticidade e vínculo da prova à identidade completa, não apenas confiar no conteúdo recebido. Retorna `{verified:true,dateOfBirth,ageBand:'ATE_16'|'MAIOR_16',reference,verifiedAt,expiresAt}`. Datas ISO reais; referência interna opaca de até 150 caracteres. Sem esse provider não há cadastro com idade falsamente verificada. Documentos brutos não são armazenados nem usados em marketing.

Até 16 anos exige `guardian.verify({proof,minorReference,signal})` com comprovação efetiva do vínculo legal e capacidade do responsável, retornando `{verified:true,guardianId,reference}`. O responsável deve ter conta ativa e verificação vigente; ID fornecido pelo cliente não cria vínculo. Controles iniciais negam compras e assinaturas. Responsável acessa somente menor vinculado, com prova vigente ATE_16; terceiros e ADMIN sem vínculo não têm bypass. Autorizações têm finalidade COMPRA/ASSINATURA, referência de operação, expiração máxima 24h e unicidade.

`identity.requireAge(connection,userId,purpose,operationReference)` é contrato para checkout/assinaturas futuros: verifica usuário, prova vigente, vínculo/controles e autorização da operação quando menor. Estes callers ainda não existem nesta etapa; não declarar compras ou supervisão de reprodução implementadas. Renovação da prova própria reconsulta provider e registra novo histórico/aceites; troca de responsável exige revisão separada e retorna 409.

## Privacidade e retenção

Exportação própria exige senha e fator atual se ativo; retorna uma seção por requisição/página: profile, addresses, contacts, preferences, consents, age, privacy, guardians, authorizations, sessions, factors, recoveries, controls. Sem hashes, JTI, tokens, chaves ou referências internas de provas. CPF é incluído apenas no export privado, não no DTO de perfil/admin. Novos módulos precisam acrescentar suas informações; escopo retornado é `IDENTITY_MODULE`. Requisições e respostas sensíveis são `Cache-Control: no-store`, sem conteúdo nos logs HTTP.

DELETE próprio desativa conta, revoga autenticação e cria solicitação durável; 202 significa recebimento e não anonimização concluída. Retorna ID e Location de acompanhamento ADMIN. Último ADMIN não pode ser desativado sem substituição. Não remove usuário, FKs, pagamentos ou histórico. **Política de finalidade/prazos/base legal/anonimização e operação de conclusão da solicitação dependem de aprovação do responsável por privacidade.** Não há job de exclusão automática nem status CONCLUIDA fictício.

Expiração impede uso mesmo sem job. Tokens/sessões expirados, consentimentos e provas não herdam expurgo de logs de 90 dias. Limpeza física e retenção por classe ainda exigem política aprovada; registros sensíveis não são expurgados arbitrariamente.

## Providers e configuração

`createApp` e `startServer(config, overrides)` permitem composição explícita de `identityProviders`, `captchaProvider` e store compartilhado. Defaults falham fechado. `server.js` padrão não carrega adapters inexistentes a partir de nomes fictícios.

- `email.assertAvailable()` verifica configuração global sem consultar conta; `sendRecovery({email,token,expiresIn,signal})` entrega por serviço real. `verifyAddress({userId,email,proof,signal})` comprova controle do novo endereço e retorna true somente com prova válida, expirável e vinculada.
- `captchaProvider.verify({token,ip,signal})`: valida no servidor conforme protocolo do fornecedor, retorna true ou falha. Obrigatório em cadastro/login/forgot/reset. Não confundir CORS com antiabuso.
- Providers devem respeitar AbortSignal e timeouts HTTP reais; nunca registrar os argumentos sensíveis. SQL e efeitos externos não compartilham locks.
- Novos parâmetros: `TWO_FACTOR_ENCRYPTION_KEY`, `BCRYPT_COST`, `TERMS_VERSION`, `PRIVACY_VERSION`, `IDENTITY_LEGAL_BASIS`; todos documentados em `.env.example`, sem valores secretos. Conteúdo/versionamento/base legal devem ser aprovados, não usar fixtures.

## Migrations e concorrência

`20261008_01_identity.sql` já existia parcialmente no checkout e foi aproveitada sem reescrever seu DDL: cinco ALTERs (normalização, replay/UNIQUE 2FA, principal de endereço/contato, aparência) e oito tabelas (`sessoes_autenticacao`, `desafios_2fa`, `consentimentos_usuario`, `verificacoes_idade`, `responsaveis_usuario`, `controles_parentais`, `autorizacoes_responsavel`, `solicitacoes_privacidade`). Nova `20261008_02_identity_guard.sql`: tabela/linha `identity_admin_guard`, serialização de bootstrap e mudanças administrativas. Plano total: 88 statements, 15 de identidade. Alvo documental: 59 tabelas incluindo ledger. **Nenhuma migration executada nesta rodada.**

Antes do upgrade: conferir SHOW CREATE/ledger/checksums, duplicatas de CPF/e-mail normalizados, fatores repetidos e múltiplos principais. Constraints falham fechado; não deduplicar apagando dados silenciosamente. Fatores antigos com chave em texto não são aceitos como segredo cifrado; exigem procedimento de recuperação/reinscrição aprovado. Credenciais/perfis não são criados pelos seeds legados.

Ordem de locks: guard administrativo quando necessário → usuários em ordem numérica de ID → desafio/reset/fator/filhos. Login bloqueia usuário antes de ler fatores; verificação/reset primeiro localizam dono sem lock e revalidam após bloquear usuário. Escritas revalidam sessão/status dentro da transação, cobrindo revogação entre middleware e service. Auditoria+outbox são atômicas com alterações. Consumidor outbox futuro não é necessário para revogação; eventos já ficam duráveis. Nenhuma chamada de e-mail/idade/CAPTCHA ocorre dentro de transação.

## Testes e evidências

- `npm test`: **54 aprovados, 0 falhas, 0 skips**; 34 de fundação + 20 de identidade. Exercitam HTTP, validação, mass assignment, sessão/JTI/logout, obrigatoriedade/inscrição/rotação/replay/limite de tentativas TOTP, reset único, IDOR, principal/paginação, privacidade, vínculo parental, renovação e ausência de segredos em logs. Repository de identidade e providers explicitamente simulados nos testes isolados; não provam SQL/locks reais.
- `npm run generate:openapi:identity` e `npm run validate:openapi`: spec 3.0.3 válida, **34 operações de identidade + 5 de infraestrutura**, registry compartilhado com rotas; schemas de entrada derivados dos validadores, respostas/limites/erros/permissões documentados. UI/assets/CSP também exercitados na suíte HTTP, sem teste visual de navegador.
- `npm run test:integration`: **2 testes pulados explicitamente**, nenhum aprovado de MySQL, porque opt-ins/TEST_DB_* não foram fornecidos. Nova suíte cobre baseline vazio, upgrade com dados legados, reexecução por ledger, CPF normalizado, principal concorrente, reset/2FA concorrentes, rollback de auditoria, bootstrap único e BIGINT >2^53 na sessão.
- Plano offline: 88 statements revisados; nenhuma conexão ao banco. `npm audit --json`: 0 vulnerabilidades reportadas, sem equivaler a certificação. `npm ls --depth=0`: dependências instaladas coerentes; nenhum pacote novo instalado e lockfile preservado. `node --check`: 47 arquivos JS aprovados. `git diff --check`: sem erros.
- Runner Node foi bloqueado por `spawn EPERM` no sandbox; reexecutado com permissão fora dele. Comandos npm de teste/audit inicialmente na raiz falharam por ausência de manifest/lock nessa pasta; as evidências acima são das execuções corretas em `backend/`.

## Dependências exatas e aceite restante

1. **MySQL dev/test:** fornecer configuração segura e alvo não produtivo; revisar baseline e aplicar migrations com runner autorizado. `RUN_IDENTITY_MYSQL_TESTS=true`, `TEST_DB_CONFIRMED_NON_PRODUCTION=true` e TEST_DB_* apontam para schema `_test` vazio, diferente de DB_NAME. Suíte cria schema de domínio, não apaga banco/tabelas existentes e deixa evidências para operador. `RUN_MYSQL_TESTS=true` habilita teste de precisão/transação da fundação. Aprovar DDL novo/upgrade e concorrência real antes de declarar esta etapa validada em banco.
2. **Cadastro/recuperação/troca de e-mail:** definir e integrar CAPTCHA, idade, prova legal de responsável, e-mail e confirmação de endereço. Fornecer textos/versões e base legal aprovada. Defaults permanecem 503; fixtures não são adapters de produção.
3. **SMS/EMAIL e recuperação de fator perdido/legado:** escolher fornecedor/protocolo, implementar entrega e comprovação do destino, testar replay/expiração/rate limit. APP está integrado; métodos externos não foram anunciados como implementados.
4. **Privacidade:** aprovar retenção/anonimização e procedimento de resolução das solicitações, reativação e mudança de responsável. Conta permanece desativada e solicitação RECEBIDA; não afirmar eliminação concluída ou conformidade integral.
5. **Infra já pendente no 01:** store compartilhado se múltiplas instâncias, TLS/WAF, retenção HTTP confirmada, backups/monitoramento. `/ready` da fundação não certifica configuração de todos os providers de identidade.

Fontes oficiais consultadas: [OTPAuth](https://github.com/hectorm/otpauth), [avisos Multer](https://github.com/expressjs/multer/security/advisories), [LGPD, arts. 16/18](https://planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm), [Lei 15.211, incluindo art. 39](https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/l15211.htm). Mantida RN24 como política do projeto; aplicabilidade/modulação jurídica continua dependente de avaliação responsável, sem certificação legal.
