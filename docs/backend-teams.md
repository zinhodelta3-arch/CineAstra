# Equipes e membros — tarefa 19

## Contrato

Treze operações autenticadas em `/api/teams`: listagem, detalhe, criação, edição e cancelamento; membros em `/:id/members`; solicitações e convites em `/:id/entries`. IDs `INT UNSIGNED` e `BIGINT UNSIGNED` são strings decimais nos DTOs. Respostas preservam `success`, `data` e `requestId`; listas usam `items` e `pagination`.

ADMIN cria equipe com `supervisorId` de usuário SUPERVISOR ativo; SUPERVISOR só cria e administra equipe própria. Equipe exige sessão `AGENDADA` ou `EM_CARTAZ` e há somente uma equipe `ATIVA` por sessão. A criação serializa pela linha da sessão. Colaborador autenticado vê equipes ativas em sessões vigentes; membros ativos podem consultar a própria equipe e lista de membros. O supervisor alheio não vê nem altera a equipe.

O COLABORADOR ativo solicita entrada em `POST /api/teams/:id/entries/requests` com `{}`. ADMIN ou supervisor da equipe aceita com `{ "decision": "ACEITAR", "funcao": "..." }` ou recusa. ADMIN ou supervisor convida COLABORADOR ativo em `POST /api/teams/:id/entries/invitations` com `{ "userId": "...", "funcao": "..." }`; só o destinatário aceita ou recusa. Nenhum desses POST cria membro automaticamente. Uma pendência por usuário/equipe é protegida por UNIQUE; histórico de decisões permanece. Membro inativo precisa de nova solicitação ou convite para reativar. Função só é atribuída ou alterada por ADMIN/supervisor próprio.

`PATCH /api/teams/:id` permite transferir supervisão somente a ADMIN; transferência, encerramento e cancelamento cancelam entradas pendentes. DELETE cancela logicamente a equipe. Entradas aceitas/recusadas permanecem para auditoria. O vínculo operacional disponível neste schema é supervisor da equipe, membro ativo ou destinatário/emissor da entrada. Não existe vínculo persistido entre equipe e local no schema de referência; a equipe está vinculada à sessão. Chamados e atribuições de tarefas concretas pertencem ao módulo 20.

## Persistência e implantação

`backend/migrations/20261008_04_team_entries.sql` cria `equipe_entradas` com FKs para equipe/usuário/emissor, estados explícitos e UNIQUE de pendência por coluna gerada. Não altera `equipes` nem `equipe_membros` existentes. O runner inclui a migration por checksum. Antes de aplicar, conferir schema real/baseline e usar exclusivamente banco de desenvolvimento/teste não produtivo. Sem `TEST_DB_*` e schema `_test` vazio, a migration e o teste de FK/UNIQUE/locks não foram executados.

## Validação

`backend/tests/team.test.js` cobre HTTP de perfil/propriedade, contexto da sessão, solicitação, convite, ausência de entrada automática, autoatribuição, concorrência, SQL parametrizado e IDs BIGINT. `backend/tests/integration/identity.mysql.test.js` contém cenário opt-in de equipe/convite/UNIQUE/FK em MySQL isolado; permanece pulado sem ambiente de teste. `npm test`: 81/81. `npm run validate:openapi`: 108 operações válidas.
