# Catálogo — tarefa 14 (08/10/2026)

Implementação integrada ao backend ESM existente; uploads (15), galerias (16) e reprodução/compra não pertencem a esta entrega. Contratos mantêm `/api`, `{success,data,requestId}` e erros da fundação. Campos de filme seguem os nomes SQL portugueses; IDs e preços são strings, flags são booleanos. Nenhum consumidor frontend foi alterado.

## Operações

| Método | Caminho | Acesso |
| --- | --- | --- |
| GET | `/api/films`, `/api/films/:id`, `/api/genres`, `/api/genres/:id` | Público, somente ATIVO |
| GET | `/api/admin/films`, `/api/admin/films/:id`, `/api/admin/genres`, `/api/admin/genres/:id` | ADMIN com sessão válida e 2FA, inclui inativos |
| POST | `/api/films`, `/api/genres` | ADMIN; 201 + Location |
| PATCH/DELETE | `/api/films/:id`, `/api/genres/:id` | ADMIN; DELETE arquiva, 204 |
| GET | `/api/films/:id/genres`, `/api/admin/films/:id/genres` | Público ativo / ADMIN |
| POST | `/api/films/:id/genres` | ADMIN; body `{ "genreId": "1" }`, vínculo idempotente |
| DELETE | `/api/films/:id/genres/:genreId` | ADMIN; remove somente vínculo, 204 |

Listas retornam `data.items` e `data.pagination.{limit,nextCursor}`. Cursor por ID crescente, limite padrão 20/máximo 100. Filmes aceitam `titulo` (substring literal), `genreId`, `classificacao`, `cinema`, `streaming`; ADMIN também `status`. Booleanos da query são `true`/`false`. Campos desconhecidos são rejeitados. POST/PATCH aceitam apenas os campos documentados no Swagger; PATCH não reinjeta defaults.

Streaming exige preço de aluguel ou compra. Preços são strings de duas casas não negativas dentro de DECIMAL(10,2); aluguel exige prazo positivo. Validação confere classificação, duração, datas reais (1000–9999), flags e campos permitidos. `imagem` permanece somente leitura até upload da tarefa 15.

`url_reproducao` nunca aparece na projeção SQL nem no DTO público; edição/leitura administrativa é protegida. URLs recebidas exigem HTTPS e hostname exato em `CATALOG_MEDIA_HOSTS` (lista separada por vírgulas, sem protocolo/path/wildcards). Lista vazia impede cadastrar/alterar URLs não nulas; CRUD sem URL funciona. Não há fetch de mídia nem entrega de playback nesta etapa. Proteção da origem/CDN continua obrigatória para futura reprodução.

Toda mutação revalida ADMIN/sessão/2FA dentro da transação existente, persiste auditoria/outbox e usa SQL parametrizado. Associações travam filme e depois gênero; criar vínculo exige ambos ativos. DELETE arquiva também registros ainda não referenciados: política única, reversível com PATCH de status, preservando FKs e histórico. Gêneros arquivados são omitidos dos vínculos públicos.

## Migration e validação

`backend/migrations/20261008_03_catalog_genres.sql` acrescenta somente `generos.status` (ATIVO/INATIVO, default ATIVO). Justificativa: gênero não tinha estado e sua exclusão física apagaria associações por cascade. Migration registrada no runner/ledger; não aplicada nesta sessão. Conferir metadados e baseline antes de migrar base existente. Nenhuma mudança em tabelas V4 de filmes/galerias.

Comandos no backend: `npm run generate:openapi:catalog`, `npm run validate:openapi`, `npm test`, `npm run test:integration`, `npm run migrate -- --plan` (offline).

Evidência: 59 testes unitários/HTTP aprovados; OpenAPI 3.0.3 com 57 operações (18 de catálogo). SQL parametrizado/projeções são inspecionados por teste; fixtures HTTP usam repositório simulado explicitamente. A suíte `tests/integration/identity.mysql.test.js` inclui cenário SQL de catálogo após bootstrap ADMIN/TOTP, filtros, dinheiro, FK, arquivo e auditoria. Não executado: 2 suítes MySQL puladas por configuração ausente.

Dependência exata: MySQL não produtivo com schema vazio terminado em `_test`, diferente de `DB_NAME`, `TEST_DB_HOST`, `TEST_DB_PORT` (opcional, 3306), `TEST_DB_USER`, `TEST_DB_PASSWORD`, `TEST_DB_NAME`, `TEST_DB_CONFIRMED_NON_PRODUCTION=true` e `RUN_IDENTITY_MYSQL_TESTS=true`. A suíte aplica baseline e migrations, preserva dados de evidência e não apaga schema existente. Banco de desenvolvimento separado também é necessário para verificar/aplicar migration e uso manual no Swagger. Sem isso, aceite SQL permanece BLOQUEADO; testes simulados não comprovam locks/constraints reais.
