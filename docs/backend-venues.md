# Locais, salas e assentos — tarefa 17 (08/10/2026)

O módulo usa as tabelas `locais`, `salas` e `assentos` da migration base `20261001_02_create_tables.sql`: FKs `salas.id_local` e `assentos.id_sala`, UNIQUE `(id_local,nome)` e `(id_sala,fileira,numero)`, `capacidade > 0`, `numero > 0` e ENUMs documentados. Nenhuma migration nova ou aplicação de DDL nesta tarefa. Ainda é necessário confirmar a versão efetivamente aplicada no banco de desenvolvimento/teste.

## Contrato

- GET público `/api/locations[/:localId]`, `/api/locations/:localId/rooms[/:roomId]` e `/api/locations/:localId/rooms/:roomId/seats[/:seatId]`. Cada lista tem `limit` 1–100, cursor ID crescente e `nextCursor`; assentos aceitam `accessible=true|false`. Público vê somente local ATIVO, sala ATIVA e assento ATIVA, inclusive na checagem de todos os pais.
- As mesmas consultas com prefixo `/api/admin` incluem inativos e filtro `status`. POST na coleção, PATCH/DELETE no item existem nos três níveis, apenas ADMIN com sessão/2FA. DELETE arquiva por status, preservando FKs e histórico. DTO mantém `{success,data,requestId}` e IDs decimais como strings.
- `acessivel` no DTO é derivado dos tipos `PCD`, `OBESO` ou `IDOSO`. O campo descreve o tipo cadastrado; não é certificação de acessibilidade física do local. Filtros são consultas de layout, sem afirmar disponibilidade de ingresso.

## Regras de integridade

- Sala nasce INATIVA, sem assentos. Para ativá-la, o local deve estar ATIVO e a quantidade de assentos ATIVA deve ser igual à `capacidade`. Criar/reativar assento ATIVA acima da capacidade retorna 409. Uma sala ativa deve ser desativada antes de reduzir seus assentos ativos. O banco mantém a unicidade de nomes/posições; duplicata vira 409.
- Mutações revalidam ADMIN na transação e bloqueiam pais na ordem local → sala → assento. Um assento só é encontrado pelo `id_sala` aninhado e uma sala só pelo `id_local`; IDs de outro contexto retornam 404. Campos de vínculo não são editáveis.
- **Regra após sessão/venda:** qualquer sessão vinculada congela estrutura, status e arquivamento da sala e de seus assentos, inclusive se a sessão foi cancelada. O local também não pode ser arquivado nem ter dados estruturais alterados; telefone pode ser atualizado. A regra é deliberadamente mais restrita que verificar apenas pedido PAGO: preserva assentos já expostos/vendidos e o histórico. A tarefa 18 deve bloquear os mesmos pais ao criar sessão, para serializar essa decisão com alterações de layout.
- Local não pode ser arquivado ou colocado em manutenção/inativo enquanto houver sala ATIVA. Sala com sessão não pode ser desativada; cancelamento de venda não libera alteração estrutural nesta etapa. Correção excepcional de layout histórico requer fluxo próprio e migração/auditoria, fora deste CRUD.

## Evidência e limite

`npm test`: 72/72, incluindo HTTP de autorização/contexto, capacidade, assentos acessíveis, duplicidade e congelamento após sessão em repository de teste. OpenAPI 3.0.3: 88 operações válidas, 21 novas. O cenário MySQL em `tests/integration/identity.mysql.test.js` cobre FKs, UNIQUE, capacidade e acesso a sala de outro local, mas ficou sem execução por ausência de `TEST_DB_*` e confirmação do schema `_test` vazio e não produtivo. Portanto constraints/locks no MySQL real ainda não estão aceitos.
