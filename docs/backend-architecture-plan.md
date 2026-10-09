# CineAstra — diagnóstico e contrato arquitetural (Prompt 00)

## Atualização tarefa 18 — 08/10/2026

Agendamento integrado a validators/routes/controllers/services/models, ADMIN/2FA, transação/auditoria e OpenAPI. `locais` é o lock estável antes de `salas` e `sessoes`; conflitos RN19 são revalidados no mesmo local com uma hora livre, inclusive salas distintas e meia-noite. Sessão com qualquer item de pedido não muda direitos nem é cancelada. RN20 fica para reserva de usuário, ausente no schema/fluxo atual. A migration base já contém `sessoes`; nenhuma migration nova/aplicada. 76 testes passaram, OpenAPI 95 operações. Aceite MySQL pendente de `_test` isolado. Detalhes em [backend-sessions.md](backend-sessions.md).

## Atualização tarefa 17 — 08/10/2026

Locais, salas e assentos integrados a validators/routes/controllers/services/models, auth ADMIN/2FA, transação/auditoria e OpenAPI. Leituras públicas exigem todos os pais ativos; gestão é aninhada por local/sala. A sala inicia inativa e só ativa com `capacidade` assentos ativos; qualquer sessão congela layout e bloqueia arquivamento, preservando histórico de venda. A migration base já contém tabelas/FKs/UNIQUE; nenhuma migration nova/aplicada. 72 testes passaram e OpenAPI tem 88 operações. Aceite MySQL real pendente de ambiente `_test` isolado. Detalhes em [backend-venues.md](backend-venues.md).

## Atualização tarefa 16 — 08/10/2026

Galeria V4 integrada a model/service/controller/routes e à composição do app, com ADMIN/2FA para escrita, consulta pública restrita a filme ATIVO, promoção de staging para volume privado durável, journal de compensação e sincronização de `filmes.imagem`. Escritas bloqueiam o filme; `tipo_principal` gerada permanece somente leitura. Nenhuma migration nova; V4 existente ainda não foi verificada/aplicada no banco real. Node 24 exigiu definir `req.signal` como propriedade própria no middleware de prazo. Contrato, endpoints e limites em [backend-film-gallery.md](backend-film-gallery.md). 68 testes passaram; aceite SQL depende de banco `_test` isolado.

## Atualização tarefa 15 — 08/10/2026

Upload ADMIN integrado como staging privado e temporário, sem migration ou mutação de catálogo. Routes -> controller -> service -> storage; Sharp valida/decodifica/reencoda pixels fora das transações MySQL. Autenticação/2FA/limiter existentes precedem Multer; sessão revalidada antes de persistir. Armazenamento local exclusivo de instância única, nomes UUID, limites/quota/TTL/cleanup e prévia autenticada; tarefa 16 promoverá imagens para galeria durável. Config `IMAGE_STAGING_DIR`; detalhes e limites em [backend-image-uploads.md](backend-image-uploads.md). Testes com processamento/filesystem/socket reais; SQL de autenticação continua dependência existente.

## Atualização tarefa 14 — 08/10/2026

Catálogo integrado à estrutura existente (routes/validators/controllers/services/models) e à autorização/transação/auditoria/outbox de identidade. Contrato detalhado em [backend-catalog.md](backend-catalog.md). CRUD ADMIN + 2FA, catálogo público ativo com paginação por ID e filtros; projeção pública exclui mídia privada. DELETE arquiva sempre e preserva associações. Migration `20261008_03_catalog_genres.sql` adiciona somente status a gêneros; filmes e V4 reutilizados. `CATALOG_MEDIA_HOSTS` valida hosts exatos HTTPS; nenhuma entrega de playback/upload implementada. SQL real/migration não executados por falta de ambiente isolado. Demais seções mantêm o histórico do diagnóstico e decisões anteriores.

Diagnóstico: 06/10/2026. Atualização Prompt 02: 08/10/2026. **Fundação e identidade integradas com pendências de MySQL/providers/privacidade; não pronto para produção.** Seções 1–10 preservam o diagnóstico; seção 11 registra o Prompt01. O estado do Prompt02 está na seção 12 e em [backend-identity.md](backend-identity.md). Nenhuma alteração no banco real foi executada.

## 1. Fontes e limites da evidência

Lidos `AGENTS.md`, código backend, manifests/lockfiles dos dois projetos, migrations e frontend. Os caminhos `docs/requisitos-cineastra.txt`, `docs/banco-referencia-cineastra.txt` e `docs/CineAstra-prompts-backend.md` não existiam no checkout inicial. Foram usados integralmente os anexos em `C:\Users\25170132.EDUC123\Downloads\`:

| Caminho esperado | Anexo correspondente |
| --- | --- |
| `docs/requisitos-cineastra.txt` | `docs.txt` (RF01–46, RNF01–36, RN01–26, apêndices) |
| `docs/banco-referencia-cineastra.txt` | `cineAstrasqlv4.txt` (v3, logs, renomeação e V4) |
| `docs/CineAstra-prompts-backend.md` | `CineAstra-prompts-backend.md` (revisão 06/10/2026, contrato global e Prompt 00) |
| Referência histórica | `cineastra_prompts_agentes_backend.txt` |

O prompt revisado rege esta rodada; o histórico não autoriza checkout antes do financeiro nem proíbe migrations justificadas. Estes documentos não substituem as fontes integrais: disponibilizá-las nos caminhos esperados é pendência de portabilidade para outro ambiente.

Distinções obrigatórias: **DDL versionado ≠ DDL aplicado; leitura estática ≠ funcionalidade testada; fixture ≠ operação real; plano ≠ implementação.** Não existe `.env` na raiz/backend/frontend, `node_modules` local ou cliente `mysql` encontrado no PATH. Não foi acessado banco remoto nem executado SQL. Não há comprovação de schema, dados, privilégios, engine, versão ou scheduler reais.

## 2. Arquitetura atual e classificação

- `backend/`: JavaScript ESM (`type: module`), Express; diretórios globais `config`, `middlewares`, `utils`, `migrations`, `models`, `controllers`, `routes`, `uploads`.
- `models`, `controllers`, `routes` e `uploads` têm somente `.gitkeep`. Não há services, validators, providers, jobs, testes automatizados, OpenAPI ou server separado.
- `frontend/`: Next.js App Router, React, Tailwind e componentes de UI. Apenas página inicial e layout; sem cliente HTTP/API routes/proxy configurado.
- npm e lockfile v3 em cada projeto; preservar ambos. Não existe package.json na raiz.

| Classe solicitada | Evidência e conclusão |
| --- | --- |
| Existentes e funcionais | Nenhum fluxo de negócio backend demonstrado funcional. Utilitário `ApiError` tem comportamento local verificável; não prova HTTP. Temas, carrossel, filtros e modais frontend têm implementação local, sem validação de execução nesta rodada. |
| Existentes, mas incompletas | Pool/helpers SQL, JWT/RBAC, logger, upload, tratamento de erros, bootstrap e arquivos SQL. Reaproveitar intenção e estrutura; corrigir no módulo responsável. |
| Ausentes | Todos os fluxos de negócio RF01–46 na API, incluindo login; Swagger, validação contextual, idempotência, integrações, worker, health/readiness, testes HTTP/MySQL e runner de migrations. RF07 possui somente personalização local parcial no frontend. |
| Incompatíveis com requisitos/banco | `admin` minúsculo versus ENUM `ADMIN`; manifests não declaram imports necessários; app aponta para loja de roupas; seeds usam `nome_fantasia` depois de rename; SQL de referência executável dentro da migration base; contratos de erros divergentes; mocks frontend não equivalem a reservas/vendas. |

### Dependências: declaradas, travadas e disponíveis

Backend lockfile: `bcrypt 6.0.0`, `cors 2.8.6`, `dotenv 18.0.3`, `express 5.2.1`, `fs 0.0.1-security`, `helmet 8.3.0`, `multer 2.4.0`, `mysql 2.18.1`, `path 0.12.7`. Nenhuma instalação local encontrada. `mysql2`, `bcryptjs`, `jsonwebtoken`, `swagger-ui-express` ausentes do manifest/lock; os três primeiros já são importados. `mysql` não satisfaz `mysql2/promise`, `bcrypt` não satisfaz `bcryptjs`. `fs`/`path` do npm são desnecessários para built-ins Node, avaliar remoção apenas no Prompt 01. Validador, rate limiting, biblioteca decimal, testes HTTP e TOTP serão escolhidos conforme módulo, sem instalar nesta rodada.

Frontend lockfile corresponde às dependências de runtime do manifest: Next `16.3.6`, React/React DOM `19.2.8`, demais versões listadas no próprio lock. Scripts `dev`, `build`, `start`, `lint`; sem script de testes. Backend tem somente `test` placeholder que falha. Ambiente: Node `v24.14.1`, npm `11.11.0`; pinagem/suporte oficial serão verificados no Prompt 01.

`npm audit --package-lock-only --ignore-scripts --json` no backend retornou 0 vulnerabilidades reportadas, não uma certificação. Aviso oficial Multer GHSA-3pph-fpjx-jg34, consultado em 06/10/2026: versões >=2.2.0 e <2.4.0 afetadas, correção em 2.4.0, igual ao lock. Não fazer downgrade; revalidar avisos ao instalar. Fonte: https://github.com/expressjs/multer/security/advisories/GHSA-3pph-fpjx-jg34.

### Defeitos concretos da fundação

| Evidência | Impacto | Responsável |
| --- | --- | --- |
| `app.js:11–12` imports relativos sem `.js` | Node ESM não resolve esses caminhos | 01 |
| `app.js:50` usa `authRotas` sem declaração/import | Inicialização falha mesmo depois de instalar dependências | 01, rota real somente 02 |
| `app.js:75` usa `app.use('*', ...)` com Express 5 | Padrão wildcard incompatível; usar fallback sem path no 01 | 01 |
| `app.js:87` chama listen no import; nenhum shutdown | Não testável isoladamente; pool não encerrado | 01 |
| `app.js:31–40` CORS `*`, omite PATCH, parsers antes do logger | Política aberta, PATCH não anunciado, erros do parser não registrados | 01 |
| `database.js:26–80` tabela/colunas/where interpolados, SELECT * sem limite | Risco de SQL injection se exposto; falta projeção/paginação | 01 + models dos módulos |
| Cada helper adquire conexão própria | Operação composta não compartilha transação; nada implementa begin/commit/rollback | 01 |
| Pool sem BIGINT string, timezone e limite de fila | Perda de precisão/ambiguidade temporal/pressão de memória | 01 |
| `authMiddleware.js:18–35,63` split sem exigir Bearer, JWT sem algoritmo/issuer/audience, confia em role/email, `admin` | Segurança parcial, autorização incompatível e sem usuário ativo/revogação/2FA | 01–02 |
| Logger captura body/query em erros não sensíveis; caminho pode conter token; console usa originalUrl/erro completo | Dados pessoais/SQL/tokens podem vazar; denylist não basta | 01 |
| `void saveLog`, pool queue ilimitada | Há catch, mas não há fila limitada, drain/monitoramento/durabilidade de auditoria | 01 |
| Upload aceita arquivos genéricos quaisquer e MIME informado; timestamp/nome; remoção por caminho derivado | Falta assinatura real, nomes aleatórios, contenção de path, limites de partes e compensação | 03, infraestrutura 01 |
| Errors/ApiError usam formatos variados e expõem message em development | Falta code/requestId e details seguros; 413/415 ausentes | 01 |
| `.gitignore` raiz só ignora node_modules/.next | `.env` backend, uploads privados e artefatos não protegidos pelo ignore | 01 |

Os riscos são caminhos potenciais constatados por leitura; não foram explorados endpoints inexistentes.

## 3. Frontend e contratos existentes

Busca em `frontend/src` não encontrou fetch, axios ou `/api/`; `next.config.mjs` não tem rewrites. **Não existe endpoint ou formato de resposta HTTP consumido pelo frontend atual.** Preservar `/api/auth` como prefixo já mencionado no app; `/api/auth/login` e `/registrar` aparecem apenas no texto da raiz, sem handlers. `/api/produtos`, categorias, cores, tamanhos e modelos são exemplos de loja de roupas, não APIs CineAstra. `/uploads` é montagem estática declarada, não endpoint de negócio funcional.

`page.jsx:13–35` usa arrays mock: filmes (`id,title,subtitle,genre,duration,rating/age,score,format,image,poster,synopsis,trailerUrl,sessions`), combos (`id,title,description,price,priceFormatted,label,image`). `sessions` contém somente horários; IDs como `m-1`/`hero-1`/`c-1` não são IDs persistentes. `page.jsx:354–364` calcula preço fixo 38/19 em Number e ingresso sem assento/local/id_sessao; `cartItems` fica em memória. Integração futura deve mapear DTOs em adapter frontend em rodada autorizada, não adicionar colunas fictícias de score/formato promocional ao banco. Enviar apenas IDs/quantidades/escolhas no checkout, não confiar no total da UI.

`appearance-provider.jsx` persiste `cineastra-appearance` em localStorage; `themes.js` lista cineastra/violet-bloom/mocha-mousse/catppucin. Estes presets não equivalem ao ENUM CLARO/ESCURO/SISTEMA: manter modo claro/escuro separado do preset e propor extensão mínima no 02 se houver sincronização autenticada. Outros links do header são “Em breve”. Nenhum arquivo frontend foi alterado.

## 4. Banco: o que foi e o que não foi verificado

Inventário completo de entidades, chaves, enums, checks, geradas e índices: [backend-schema-inventory.md](backend-schema-inventory.md). Schema documental final: **47 tabelas** (37 v3 + logs + 3 galerias + 6 newsletter). Engine InnoDB exigida; MySQL >=8.0.16 e collation `utf8mb4_0900_as_ci` impedem assumir equivalência MariaDB.

| Atualização | Arquivo/evidência versionada | Aplicada no banco real? |
| --- | --- | --- |
| Base v3 | `20261001_01_create_database.sql`, `20261001_02_create_tables.sql` | Não verificável neste ambiente |
| logs + 90 dias | `20261001_03_create_table_logs.sql`; evento a cada 15min, lote 5000 | Não verificável; existência do evento não prova scheduler ativo |
| `nome_cine` | `20261001_04_update_alter_table_fornecedores.sql` | Não verificável |
| `url_reproducao` | `20261006_alter_table_filmes.sql:23–29` | Não verificável |
| Galerias | Mesmo arquivo, `filmes_imagens`, `insumos_imagens`, `combos_imagens`, backfill capa | Não verificável, inclusive backfill e unicidades |
| Newsletter | Mesmo arquivo, seis tabelas, três categorias iniciais | Não verificável, inclusive seeds de categorias |

Não existe ledger/runner de migrations. Não executar todos os arquivos por glob: a base contém SELECTs com `?` não comentados (`02:628–700`), queries `nome_fantasia` (`649,677`); seeds `05` incluem esse nome antigo, hashes aparentes de 58 caracteres (não bcrypt completo de 60), tokens/chaves estáticos, IDs assumidos a partir de 1 e SELECTs de verificação. Não são testes automatizados nem bootstrap seguro. DDL tem commit implícito; falha parcial requer inspeção, não retry cego. `USE cineastra` embutido em scripts exige controle para não atingir base errada. Migration 04 não escolhe database; executá-la sem seleção correta é perigoso.

### Procedimento futuro somente leitura

Responsável pelo ambiente deve confirmar um alvo dev/homologação, entregar conexão por canal seguro e permitir SELECT de metadados. Não enviar credenciais em documentação. Verificar `VERSION()`, `DATABASE()`, `@@session.time_zone`, `@@global.event_scheduler`; consultar `information_schema.TABLES`, `COLUMNS` (tipo/null/default/EXTRA/GENERATION_EXPRESSION), `TABLE_CONSTRAINTS`, `KEY_COLUMN_USAGE`, `CHECK_CONSTRAINTS`, `STATISTICS` e `EVENTS` filtrados por schema confirmado. Conferir `SHOW CREATE TABLE` das 47 entidades e `SHOW CREATE EVENT ev_logs_expurgo` quando permitido. Validar ausência de `nome_fantasia`, presença de `nome_cine`, tipos/constraints V4 e contagem dos três códigos de categoria. Verificar capas antigas não vazias sem correspondente principal usando SELECT. Exportar apenas estrutura/evidência redigida, não dados pessoais. Acesso negado a EVENT/scheduler deve ficar como pendência operacional, sem aumentar privilégios da aplicação nem ligar scheduler nesta rodada.

## 5. DECISÕES COMPARTILHADAS

Estas são decisões para implementação futura, não contratos já publicados. Responsabilidades devem ser respeitadas também por ADMIN; ADMIN não tem bypass financeiro ou de histórico.

1. **Arquitetura (01):** preservar ESM e `backend/` global. Rotas -> auth/RBAC/validator -> controller -> service -> model -> MySQL. Criar services/validators/providers/jobs/tests conforme necessidade, sem `src/modules` paralelo. `app.js` sem listen; `server.js` carrega env antes dos imports dependentes, startup/shutdown/timeouts.
2. **REST/DTO (01):** prefixo `/api` por compatibilidade com bootstrap existente; recursos em inglês conforme prompts, ações explícitas. Cadastro em `/api/auth/register`, alias `/api/auth/registrar` se mantido o caminho anunciado. Sem outro versionamento nesta etapa. Sucesso `{success:true,data,requestId}`; lista inclui `pagination:{limit,nextCursor}`; erro `{success:false,code,message,requestId,details?}`. `details` só campos seguros. Mudança sobre erros portugueses do esqueleto é intencional, sem consumidor HTTP encontrado; confirmar antes da integração frontend. 201+Location, 204 sem corpo, 202 só job rastreável; 400/401/403/404/409/413/415/422/429/500/503 conforme contrato global.
3. **IDs/dinheiro (01/08):** todos os IDs da API em strings decimais, inclusive INT; BIGINT nunca Number. mysql2 `supportBigNumbers:true,bigNumberStrings:true`; verificar também insertId acima de 2^53 antes de liberar implementação. DECIMAL strings, `decimalNumbers:false`; BRL como `"120.00"`, sem símbolo/localização. Cálculo decimal exato; arredondamento HALF_UP em centavo no subtotal final de cada linha; total soma linhas. Guardar intermediários/snapshots e regra versionada. Rateio em centavos inteiros exatos: quociente+resto por ordem crescente de ID do participante comparado sem Number.
4. **Datas (01/04/12):** UTC para instantes técnicos/app/pool, API RFC3339 com Z; `DATE` como YYYY-MM-DD sem conversão automática a Date. Calendário/ciclo no fuso `America/Sao_Paulo` como padrão de negócio proposto; confirmar com responsável para operação em outros fusos. Sessão deve ter início/fim explícitos e fuso, inclusive meia-noite, migration no 04 mantendo campos legados. Intervalo 1h no mesmo local, não só sala; máximo 5h somente reserva de sessão por usuário, não TTL de assento.
5. **Token (01/02):** JWT bearer Authorization, HS256 explicitamente permitido com segredo de alta entropia fora do repo, issuer/audience fixados em configuração validada e duração curta (15min proposta). Payload mínimo sub/sid/jti; verificar sessão não revogada, usuário ativo/perfil atual. ADMIN/SUPERVISOR restritos até 2FA completo. Sem token em URL ou localStorage obrigatório. Cookies não adotados por padrão; se frontend optar por cookies, revisão explícita HttpOnly/Secure/SameSite+CSRF antes de publicar. Logout revoga sessão persistida.
6. **OpenAPI (01):** única especificação OpenAPI 3.0.3 em `backend/docs/openapi.json`, UI `/api-docs`, JSON `/openapi.json`, bearerAuth/Authorize; privadas descrevem perfil/escopo e públicas `security:[]`. Sem spec criada nesta rodada, pois não há rota integrada funcional. Endpoints deste documento são planejados, não anunciar Try it out funcional. Atualização/teste da spec em cada módulo; produção desativada/protegida.
7. **Preço (08):** PriceService único, input IDs/quantidades/local/sessão/tipo, output linhas com base/custo/descontos/tributos quando definidos/final, total, versão e validade informativa. Checkout revalida. Descontos comuns em pontos percentuais sobre a mesma base, soma limitada a 25%, combo contado uma vez. Meia é alternativa fora do teto, não cumulativa no ingresso, aplicar vantagem maior após definição jurídica de base. Markup sobre custo 60%, alerta mínimo 20%, não confundir retorno sobre custo com margem sobre receita. Custo zero não divide; venda abaixo do custo não liberada. RN07 não garante 20% automaticamente: com custo total 100, receita base 160 e 10/20 meias, receita 120 (20%); descontos extras podem reduzir projeção. Corrigir oferta antes de publicar, não negar direito de meia silenciosamente.
8. **Benefícios (12; cálculo 08):** BenefitsService retorna direitos por usuário/assinatura/competência/versionamento; limite inclui titular. Resgate mensal com UNIQUE e snapshot do combo elegível, sem if de nomes de planos. Saída/modalidade aceita afeta ciclo seguinte; pendência jurídica/comercial para concordância, plano anual e IPCA não permite inventar valor.
9. **Reservas (10; saldos 07; consulta 04):** ocupação ativa única sessão/assento separada de histórico; reserva com expiração configurada e exposta antes de pagar, sem inventar prazo aprovado. Estoque físico, reservado e disponível distintos; cupom com reserva/consumo/liberação. Locks nos pais estáveis e UNIQUE. Reserva vencida é inelegível mesmo sem job. Não reatribuir assento pago nem liberar após consumo indevido.
10. **Pagamentos/reembolso (09; callers 10/12):** obrigação exclusivamente pedido OU cobrança, BRL/valor servidor; provider create/query/cancel/refund/verifyWebhook retorna referência/estado real e capacidade de recorrência. Sem provider -> 503, nunca APROVADO simulado. External calls fora dos locks, persistir intenção e conciliar timeout. Uma quitação por obrigação, várias tentativas com eventos externos únicos. Reembolso tem valor parcial/total, solicitação recebida imediatamente, avaliação e confirmação externa separadas. Pagamento tardio de reserva expirada vai para conciliação/estorno, não emissão automática.
11. **Idempotência (fundação 01, persistência antes do financeiro 09):** chave vinculada usuário/operação/hash canônico da entrada; UNIQUE, resultado/referência e estado persistidos. Mesma chave/outro hash -> 409. Em processamento -> resposta rastreável, não outra cobrança. Política de TTL aprovada por fluxo, sem apagar evidência financeira. Falha/deadlock retry limitado com operação idempotente; sem promessa exactly-once externo.
12. **Notificações/auditoria/worker (01/05 e módulos emissores):** evento `{eventId,type,aggregateId,actorId,occurredAt,version,payloadMinimo}`. Auditoria de negócio + outbox na mesma transação da operação. Notificação interna deduplica evento/destinatário; usuário só lê próprias. Worker claim curto, lease/backoff/limite de tentativas/recuperação; chamada externa fora da transação. Scheduler SQL ou worker de expurgo decidido operacionalmente, nunca ambos sem coordenação.
13. **Retenção (01/02/09/14):** logs HTTP 90 dias, evento existente ou alternativa monitorada. Auditoria, financeiro, consentimentos e evidências não herdam expurgo HTTP. Sem exclusão automática destes até política de finalidade/prazo/base legal aprovada por responsável jurídico/privacidade; minimizar, restringir e anonimizar quando permitido. Tokens expirados/sessões têm limpeza após prazo de segurança definido no módulo. Retenção indefinida nos comentários v3 não é política legal aprovada. CASCADE de galeria não apaga arquivo externo; cleanup/compensação no storage.
14. **Streaming (11):** StreamingService autoriza dono+idade+pagamento+vigência a cada play; acessos avulsos por item, planos via participação/benefício, sem item artificial. Aluguel inicia na confirmação de compra, compra pode não expirar. MediaProvider emite URL curta assinada somente se origem privada/CDN suporta; ausente -> 503. Nunca expor `url_reproducao` em catálogo/galerias/DTOs públicos ou cache compartilhado.
15. **Newsletter (13):** reutilizar as seis tabelas V4; ausência de preferência é recusa; double opt-in; token randomBytes(32)/SHA256 BINARY(32), finalidade/expiração/consumo. ADMIN categorias/campanhas; conta/token autorizado controla inscrição; POST para ação efetiva, GET não consome token. Claim SKIP LOCKED e revalidação antes de enviar; sem e-mail real não marcar ENVIADO.

## 6. Permissões planejadas (deny by default)

`Próprio` sempre exige dono real, nunca id_usuario do body confiável. Vínculo operacional ativo via equipe/sessão/local e função; fornecedor via fornecedores.id_usuario e item/local autorizado. Novo vínculo fornecedor-local proposto no 06; ter estoque local não concede todos os locais. ADMIN exige 2FA, escopo administrativo explícito e auditoria.

| Recurso/operação | Público | CLIENTE | FORNECEDOR | SUPERVISOR | COLABORADOR | ADMIN |
| --- | --- | --- | --- | --- | --- | --- |
| Catálogo/locais/sessões publicáveis/planos | Leitura DTO mínimo | Leitura | Leitura | Leitura | Leitura | CRUD cadastro elegível |
| Cadastro/login/recuperação | Cadastro CLIENTE e login/desafio | Próprio | Próprio | Próprio + 2FA | Próprio | Próprio + 2FA; criação interna controlada |
| Perfil/endereço/contato/preferência/exportação | Não | Próprio | Próprio | Próprio | Próprio | Gerência autorizada, sem expor segredos |
| Métodos/pedido/cobrança/reembolso/streaming | Não | Dono/pagador/participante elegível | Não global | Apenas operação vinculada, não financeiro do cliente | Idem | Ações auditadas, sem status financeiro arbitrário |
| Sessão/local operacional | DTO público | Consulta | Consulta vinculada para devolução | Local/sessão responsável | Leitura da sessão vinculada | Gerência |
| Equipe/chamado/clientes de sessão | Não | Não | Não | Equipe sob responsabilidade, DTO mínimo de clientes | Membro ativo/função/tarefa própria | Gerência com invariantes |
| Ticket/entrada/saída | Não | Consulta própria, não consumo staff | Não | Sessão vinculada | Sessão+função autorizadas | Operação auditada |
| Fornecedor/produto/galeria/estoque/logística | Catálogo vendável mínimo | Leitura comercial | Próprio fornecedor + locais autorizados | Estoque/solicitação no local vinculado | Função no local vinculado | Gerência/ajustes justificados |
| Assinatura/convite/participação | Planos públicos | Titular gerencia; convidado aceita/recusa/saída própria; cotas só pagador | Não global | Não global | Não global | Administração auditada sem reescrever fatura |
| Suporte/notificações | FAQ e institucional | Suporte próprio/notificações próprias | Próprias notificações | Próprias notificações | Próprias notificações | Atendimento/relatórios; logs só ADMIN |
| Newsletter | Inscrição/confirmar/opt-out com token e antiabuso | Preferência própria comprovada | Própria inscrição | Própria inscrição | Própria inscrição | Categorias/campanhas/envios |

## 7. Máquinas de estado e dimensões separadas

Todas planejadas; transições condicionais, autorização contextual e auditoria, sem PATCH livre de status.

| Agregado | Estados existentes / fluxo permitido proposto | Lacuna/guarda |
| --- | --- | --- |
| Pedido | EM_ANDAMENTO -> AGUARDANDO_PAGAMENTO -> PAGO -> FINALIZADO; cancelamento de EM_ANDAMENTO/AGUARDANDO_PAGAMENTO | PAGO cancelado só via processo que trate direitos/estorno; RF14 em dimensão operacional separada AGENDADO/EM_REALIZACAO/ATRASADO/PARTICIPANDO/FINALIZADO |
| Pagamento | PENDENTE -> APROVADO ou RECUSADO; APROVADO -> ESTORNADO somente confirmação integral | Timeout/EM_CONCILIACAO e estorno parcial em processo separado, não inventar ENUM já aplicado; webhook duplicado não regride estado |
| Reserva (nova) | ATIVA -> CONFIRMADA, EXPIRADA ou LIBERADA | Ocupação ativa permanece para venda confirmada; liberação com história durável e eligibility; TTL avaliado sob lock |
| Ticket | GERADO -> UTILIZADO/CANCELADO/EXPIRADO | Um ticket por item/tipo com retirada total das unidades, sem consumo parcial nesta proposta; validade, sessão da retirada e UNIQUE a adicionar; combo RETIRADA_INSUMO |
| Sessão | AGENDADA -> EM_CARTAZ -> ENCERRADA; AGENDADA -> CANCELADA | Cancelamento com vendas requer compensação; início tardio em indicador operacional separado; explícito fim/fuso |
| Assinatura | PENDENTE -> ATIVA -> CANCELADA/EXPIRADA | Não ativar antes de obrigação quitada; suspensão de direito separado por participante; cessar futuras renovações ao cancelar |
| Participação (nova) | PENDENTE -> ATIVA -> SAIDA_AGENDADA -> ENCERRADA; ATIVA -> SUSPENSA -> ATIVA ou ENCERRADA | Convite PENDENTE -> ACEITO/RECUSADO/EXPIRADO não substitui participação; limite sob lock; ciclo seguinte snapshot |
| Cobrança | PENDENTE -> PAGO/ATRASADO/ISENTO; ATRASADO -> PAGO | Encargos/versionamento, 1º/8º/>30 dias; dívida permanece após cancelamento |
| Equipe/adesão | ATIVA -> FINALIZADA/CANCELADA; membro ATIVO -> INATIVO | Solicitação/convite novo PENDENTE -> ACEITO/RECUSADO/EXPIRADO; função atribuída só responsável |
| Chamado | ABERTO -> EM_ANDAMENTO -> RESOLVIDO -> FECHADO | Aceite único responsável; reabertura só ação auditada quando definida |
| Solicitação estoque | PENDENTE -> APROVADA/RECUSADA; APROVADA -> FINALIZADA | Finaliza após operação real, não atualização isolada |
| Logística | PENDENTE -> ENVIADO -> EM_TRANSITO -> RECEBIDO; PENDENTE -> CANCELADO | Após envio, cancelamento deve tratar retorno físico/compensação, não devolver saldo automaticamente; recebimento idempotente |
| Suporte | ABERTO -> EM_ATENDIMENTO -> RESOLVIDO -> FECHADO | Atendimento 10min não resolve/fecha demanda; fila e histórico persistidos; SLA monitorado |
| Newsletter inscrito | PENDENTE -> ATIVO -> DESCADASTRADO/BLOQUEADO; reinscrição DESCADASTRADO -> PENDENTE | Consentimento novo+tokens novos; BLOQUEADO não reativado por link; CHECKs de datas |
| Campanha/envio | RASCUNHO -> AGENDADA -> ENVIANDO -> CONCLUIDA; cancelamento elegível. Envio PENDENTE -> PROCESSANDO -> ENVIADO/FALHOU; FALHOU -> PROCESSANDO ou CANCELADO | Claim/lease/backoff; opt-out cancela pendentes; ENVIADO não resetado; crash externo conciliado |

## 8. Lacunas e especificação de migrations propostas

**Somente especificações: nenhum arquivo SQL novo nem execução nesta rodada.** Antes de implementar, confrontar SHOW CREATE e dados reais. Nomes abaixo são propostas explícitas, não colunas existentes. Todos os IDs/FKs seguem tipos referenciados; novas entidades de evento usam BIGINT UNSIGNED. Índices de busca adicionais somente com query/EXPLAIN. Ordem por dependência, não autorização para aplicar tudo.

| Ordem / dono | Evidência e impacto | Alteração mínima proposta / compatibilidade / teste |
| --- | --- | --- |
| M00 / 01 | SQL base contém exemplos; sem ledger; scripts USE fixo | Separar DDL, seeds exclusivos de teste e SELECTs; ledger de nome/checksum/aplicação. Não reescrever migration já aplicada antes de identificar histórico; baseline explícito por inspeção. Testar banco vazio e atualização parcial sem tocar produção. |
| M01 / 01 (antes de eventos críticos) | logs é somente HTTP e expurgável | `auditoria_eventos` append-only (ator/agregado/tipo/instante/requestId/metadados mínimos) e `outbox_eventos` UNIQUE eventId, estado/tentativas/lease; transação da operação. Testar rollback/crash/retry/drain. |
| M02 / 02 | usuarios só tem DOB/status; 2fa sem UNIQUE e logout inexistente | `sessoes_autenticacao` usuário/expiração/revogação, `desafios_2fa` hash/expiração/tentativas/consumo; UNIQUE(id_usuario,metodo) em autenticacao_2fa após dedupe revisado, segredo cifrado e replay step. Reusar recuperacao_senha.token para hash opaco compatível, não criar tabela duplicada. Testar replay/logout/bloqueio/enrollment. |
| M03 / 02 | RF01/RNF23/RN24 sem consentimento/base legal/responsável | `consentimentos_usuario` finalidade/versão/base legal/aceite/revogação; `verificacoes_idade` evidência mínima/status/referência provider/data/expiração; `responsaveis_usuario` menor/responsável/estado/prova/escopo; `autorizacoes_responsavel` compra/assinatura e preferências parentais (limites de uso/compras). UNIQUE vínculos válidos, sem publicidade; retenção aprovada. Testar responsável alheio/idade não verificada/autorização expirada. |
| M04 / 02 | principal não único em endereços/contatos; preset frontend distinto | Slot gerado anulável e UNIQUE por usuário para endereço/método principal (método no 09), contato por usuário/tipo; dedupe sem apagar histórico. Preset de aparência separado do ENUM tema se aprovado. Testar troca concorrente e compatibilidade local. |
| M05 / 03 e 06 | V4 já versionado | **Não duplicar galerias/newsletter/url.** Somente aplicar blocos faltantes após confirmação; backfill de capa controlado, generated read-only. ADMIN troca galeria sob lock pai. Testar duas principais, upload/storage compensation e URL privada ausente. |
| M06 / 04 | sessoes.data+TIME não define fim em outro dia; RN20 sem fluxo de reserva de espaço | Adicionar instantes início/fim e fuso com CHECK fim>início, backfill revisado e dupla escrita temporária. `reservas_sessao_usuario` (solicitante/local/início/fim/estado/responsável/aprovação), distinta de assento, para máximo 5h; produto/direito de solicitar depende de definição comercial. Testar meia-noite, fronteiras e intervalo no mesmo local. |
| M07 / 05 | equipe_membros só ATIVO/INATIVO, RF37 solicita/convita | `equipe_adesoes` equipe/usuário/origem/estado/expiração/respondido; unicidade de pedido pendente por par; supervisor também usa vínculo aprovado, não autoatribuição. Notificacoes ganha chave de evento/destinatário UNIQUE anulável para legado. Testar duplo aceite/IDOR/dedupe. |
| M08 / 06 | fornecedor e item têm local, mas não lista de locais autorizados | `fornecedor_locais` PK fornecedor/local, estado/vigência; backfill revisado não concede acesso global. Combos precisam local coerente: adicionar id_local ou associação por local (decisão mínima: um local por combo), inferência só composição unívoca. Testar item de local alheio/combinação multilocal rejeitada. |
| M09 / 07 | quantidade física sem reserva; logistica sem mapeamento de identidade entre locais | `reservas_estoque` item/pedido/quantidade/estado/expiração e saldo reservado condicionado; `transferencia_itens` origem/destino/quantidade/solicitação e UNIQUE de recebimento em movimento; XOR insumo/equipamento. Origem física/coord para RN11 após provider definido, sem ETA fictício. Testar duas saídas/último combo/receber duas vezes/rollback. |
| M10 / 08 | RN05–10/16/18 e Apêndice A sem custos/parâmetros/promoções; preco é venda | Custos versionados por insumo (receita/parceria), local por tempo, exibição, aluguel/licença e plano; `parametros_financeiros` vigência/versão/unidade/valor; `promocoes` escopo/validade/percentual/estado e associações; `reservas_cupom`/usos com UNIQUE por obrigação, contagem sob lock. Snapshots em linhas de cotação/pedido (custo/base/descontos/regra). CHECKs planos preço>=0/desconto/limite após saneamento. Testar C=100, rateio/desconto/duplo cupom e custo ausente bloqueando oferta. |
| M11 / 09 | metodo sem token; pagamentos.transacao_id não único; sem moeda/idempotência/webhook | Token/referência+gateway no método sem PAN/CVV, slot principal único; `operacoes_idempotentes` UNIQUE usuário/operação/chave+hash/estado/resultado, `webhook_eventos` UNIQUE provedor/evento e integridade/estado; UNIQUE(provedor,transacao_id) anulável após reconciliação de duplicados e guarda de quitação única por obrigação. Processos financeiros com intenção/timeout/conciliação e moeda. Testar callback duplo/fora de ordem, método alheio, valor divergente, provider ausente. |
| M12 / 09 | RF19/RN03/26 sem histórico/estorno parcial | `reembolsos` solicitação/ator/obrigação/valor/estado/motivo/prazos; `reembolso_eventos` referências únicas externas; trava de soma<=pago e idempotência; conservar pagamento histórico. Testar parcial/repetido/timeout/reembolso sem falso sucesso. |
| M13 / 10 (garantia antes de remover antiga) | uk_sessao_assento em histórico impede cancelamento/revenda | `ocupacoes_assento` PK sessão/assento, item UNIQUE, estado ATIVA/CONFIRMADA/expiração; `reservas_assento_historico` para eventos/liberação. Auditar/backfill só ocupações válidas sob manutenção, criar garantia substituta, validar paridade e só então retirar uk_sessao_assento histórica. Não apagar itens. Testar disputa último assento e cancelamento+revenda. |
| M14 / 10 | Ticket sem expiry/UNIQUE item/finalidade, combos sem sessão; RF14/35/41/RN23 | Tickets: UNIQUE(id_item,tipo), expiracao e sessão de retirada; um consumo retira quantidade total. `eventos_presenca` entrada/saída/ator/sessão/ticket com estado de presença e consumo atômico; `comprovacoes_meia` tipo/evidência mínima/conferências e contador/limite protegido por sessão. Dimensão operacional do pedido separada. Contrato/sumário/prova de aceite versionados (RN25). Testar duplo consumo, +30min, reentrada e meia concorrente. |
| M15 / 12 (config benefícios pode anteceder 08) | convites ACEITO não modela saída/suspensão; plano não descreve benefícios | `plano_beneficios` versionado; `assinatura_participantes` UNIQUE vínculo com estado/vigência/saída ciclo seguinte e histórico, `alteracoes_assinatura` concordâncias/modalidade/ciclo efetivo; `beneficios_resgates` UNIQUE assinatura/beneficiário/competência/benefício; cobrança snapshot custos/cotas/multa percentual/juros/IPCA fonte. Testar limite/rateio/cancelamento-job e inadimplência individual. 11 pode consultar interface e ficar bloqueado para planos até 12. |
| M16 / 14 | suporte tem uma mensagem/resposta, não conversa/SLA | `suporte_mensagens` autor/instante/conteúdo, backfill preservando originais; fila/atendimento com prazo/sessões ao vivo, atribuição/histórico. FAQ/institucional versionado em arquivos, sem tabela desnecessária; dados reais fornecidos pela empresa. Testar múltiplas mensagens, 10min não fecha, prazo 5 dias e IDOR. |

## 9. Concorrência, performance e operações transacionais

Helper 01 entrega uma conexão: getConnection -> begin -> execução -> commit; catch rollback; finally release. Models aceitam conexão. Nada de chamadas externas dentro de lock. Ordem determinística por fluxo: galeria pai -> imagens; newsletter inscrito -> token; agendamento local -> sessão; checkout sessão/local -> ocupações/assentos por ID -> itens estoque por tipo/ID -> cupom -> pedido/itens; aprovação/cancelamento devem seguir a mesma ordem dos recursos de checkout antes de obrigação/pedido, com releitura sob lock. Assinatura -> participantes por ID -> competência; estoque itens ordenados -> movimento. A ordem concreta de flows cruzados deve ser testada no MySQL no módulo; retry limitado não substitui garantia.

Transacionais: troca principal, principal de endereço/contato, reset/2FA, adesão de equipe, aceite chamado, saída/recebimento/transferência estoque, reservas e cupom, checkout, aprovação/emissão de ticket/acesso, cancelamento/estorno elegível, consumo/entrada/saída, aceite/saída de plano/rateio/resgate/cobrança, confirmação/opt-out/claim newsletter. Registrar auditoria/outbox junto a mudanças críticas. Evitar SELECT * e N+1, paginação limite padrão 20/máximo 100, ordenação estável, keyset em histórico, projeções explícitas. QueueLimit e timeouts configurados. Performance/99,5% exigem carga medida, monitoramento e infraestrutura; não demonstrados.

## 10. Plano de execução e critérios

| Prompt | Dependências / critério objetivo de aceite |
| --- | --- |
| 01 fundação | Consumir estes docs; reparar inicialização/dependências/imports/Express5, env/ignore, app/server, pool/transaction, logs seguros, RBAC/JWT básico, OpenAPI válido e testes sem banco+MySQL isolado. Não esperar gateway para começar. |
| 02 identidade | 01 + evidências/termos/provider idade/e-mail; cadastro só CLIENTE, propriedade, 2FA obrigatório e logout testados; sem provider não declarar verificação concluída. |
| 03 catálogo | 01/02 + schema V4 confirmado/storage; CRUD+galerias com concorrência e nenhum vídeo privado público. |
| 04 locais/sessões | 03+identidade+schema; horários/meia-noite/local/assento corretos, disponibilidade compatível com futura reserva 10. |
| 05 equipes | 02/04; escopo operacional, convite/aceite e notificações idempotentes testados. |
| 06 fornecedores | 02/04/03; nome_cine confirmado, propriedade/local/combo e galerias. |
| 07 estoque/logística | 05/06; saldo nunca negativo, movimentos+recebimento uma vez; geodistância sem provider pendente explícita. |
| 08 preço | 03/04/06/07, custos/parâmetros aprovados e interface benefícios 12; cálculo exato e snapshots/teto/cupom concorrente. |
| 09 financeiro | 01/02/08, gateway sandbox/protocolo; primitivas antes dos callers, idempotência/webhook/reembolso testados. |
| 10 checkout | 07–09+idade/04/05; último recurso concorrente, TTL, confirmação externa, cancelamento/revenda/consumo seguros. |
| 11 streaming | 10+MediaProvider; avulso protegido; direitos de plano aguardam 12, sem sucesso fictício. |
| 12 assinatura | 08–11 e recorrência+IPCA oficial/convenção aprovados; participação/ciclos/rateio/inadimplência individual/benefício. Concluir integração de planos em 08/10/11. |
| 13 newsletter | 01/02/05+V4+e-mail; opt-in/categoria/worker duplo/opt-out/crash testados. |
| 14 suporte/admin | Módulos anteriores+conteúdo real/IA opcional; histórico/SLA/relatórios líquidos, logs redigidos e fonte de custos. |
| 15 auditoria | Schema migrado isolado, testes de concorrência e contratos completos, revisão segurança/infra; não publicar com risco crítico. |

Dependências externas reais: conexão dev/test separadas e metadados; gateway/tokenização/recorrência/webhook/sandbox; e-mail e SMS se usados; verificação confiável de idade/prova de responsável; storage/CDN origem privada; CAPTCHA; TLS/WAF/topologia proxy/limiter store; distância/coordenadas/ETA e fórmula; IA; IPCA oficial/convenção de dias; backup/monitoramento; termos/política/informações empresariais/licenças/custos. Ausência não impede documentação nem toda fundação, mas bloqueia aceite dos fluxos correspondentes.

### Pendências jurídicas e comerciais (não conformidade certificada)

Fonte oficial consultada: https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/l15211.htm, 06/10/2026. Art. 41-A confirma vigência em 17/03/2026; arts. 9/13/17/18/24 tratam aferição, finalidade e supervisão. Art. 39 modula/dispensa determinadas obrigações para serviços com controle editorial/licenciamento sob condições: **RN24 generaliza obrigações que dependem de enquadramento/regulamentação**. Não reduzir RN24 silenciosamente: responsável jurídico define aplicabilidade e responsável de produto confirma política protetiva do projeto. Conferir também os regulamentos vigentes indicados no texto oficial antes de implementação. Demais referências legais dos anexos (CDC, comércio eletrônico, meia, LGPD/classificação/acessibilidade) não foram auditadas integralmente nesta rodada; os prazos aqui são requisitos do projeto, não parecer de vigência legal.

Decisões pendentes com dono: jurídico/produto — base da meia (preco_inteira vs preço efetivamente cobrado), acompanhamento/idade, arrependimento/consumo/plano anual e retenção; produto/financeiro — custo por duração/unidade, elegibilidade do combo médio, TTL/reserva de espaço, percentuais de desconto/composição, rateio e encargos/IPCA/dias, destinação de lucro líquido 5–10%; operações — fuso/locais, origens de estoque e ETA; infra — provedores e isolamento. Não inventar CNPJ, preço/custo ou IPCA. Folha/salários e transferências empresariais internas estão fora de escopo RN14.

## 11. Prompt 01 — implementação atual e DECISÕES COMPARTILHADAS

- `backend/app.js` é factory sem listen, `server.js` carrega env validado e compõe pool/logger/retention antes de escutar; ESM/diretórios globais preservados. `routes/infrastructureRoutes` -> healthController -> healthService; SQL em models. Endpoints públicos GET `/`, `/health`, `/ready`, `/openapi.json`, `/api-docs`/assets. Nenhum `/api/auth` fictício nem domínio de venda criado. Frontend não alterado pelo agente (alterações staged encontradas depois são trabalho do usuário).
- npm/lock preservados e instalados; removidos pacotes inadequados mysql/bcrypt/fs/path, adicionados mysql2,bcryptjs,jsonwebtoken,swagger-ui-express,express-rate-limit e dev swagger-parser/supertest com versões reais de registry/lock. Node24 confirmado LTS, engines24/npm11; patch local24.14.1 testado, patch LTS recente indicado pela fonte24.21.0 fica para atualização do ambiente pelo operador.
- Pool: parametrização explícita, fila finita, timezoneZ/SET time_zoneUTC, DATE string, DECIMAL string e supportBigNumbers/bigNumberStrings; helper transaction compartilha conexão, rollback/release e destrói conexão em rollback falho/timeout. Socket interrompido+Promise deadline/AbortSignal, aquisição tardia liberada. Não aplica retries de commit ambíguo. Dinheiro/ID DTOs básicos rejeitam Number sem precisão; insertId real aguarda teste MySQL.
- JSON/urlencoded/body limits e deadline <=10s, timeouts headers/request/socket, Helmet,CORS whitelist/PATCH e trust proxy IP/CIDR explícito. Memória limiter só1instância; external store sem factory real bloqueia. Limiters por IP+identidade/fluxo exportados, não endpoints falsos. Padrão bearer sem cookies, API erros/code/requestId/details seguros implementado; textos portugueses legados substituídos sem consumidor HTTP identificado no00.
- Auth JWT HS256 com issuer/audience/iat/exp máximo900s/sub/sid/jti/purpose, RBAC uppercase+owner+interface de vínculo operacional. **Sessão/revogação/2FA não implementados nesta etapa**: default SessionProvider 503, não valida JWT pleno sem persistência. 02 deve conectar provider real e fluxo de emissão antes de login; testes usam fixtures claramente nomeadas. CAPTCHA falha fechado até provider real.
- OpenAPI3.0.3 única em `backend/docs/openapi.json`, operações comparadas ao registry em tests/script; bearerAuth/Authorize, esquemas Id/Money/Error/Pagination. Docs desativadas em produção, sem persistir autorização, CSP local só UI. Sem endpoints privados/CRUD fictícios para demonstrar Swagger.
- Logs INSERT na tabela existente com corpo/query/resposta sempre omitidos; template de rota sem baseUrl/URL/valores, User-Agent omitido intencionalmente (controlado pelo cliente). IP/método/status/duração/tamanho/usuário mínimo registrados; fila finita, metrics/drop/failure/drain, sem erro SQL nos logs de console. Retenção event exige metadados/scheduler; alternativa worker90dias/lote5000 recusa evento concorrente. Não ligar scheduler nem exigir privilégio administrativo na aplicação. Metadados/acesso/definer/execução não confirmados no banco real.
- M00/M01 artefatos: runner manifest por statements/checksum/GET_LOCK/markerRUNNING antes de DDL, exclui USE/create database,seeds,SELECTs de exemplo e eventos; base sem ledger requer baseline manual. SQLs antigos intactos. Nova migration `20261006_01_infrastructure_events.sql` cria auditoria_eventos/outbox_eventos, helper audit mínimo na conexão caller. **Nenhuma migration aplicada, nenhum evento de negócio emitido; consumer outbox e política por evento permanecem antes dos módulos comerciais.** Schema documental estendido esperado49tabelas+ledger=50, em vez das47do00; banco real desconhecido.
- `/uploads` deixou de ser montagem estática genérica. Infra Multer restrita/lazy e gate de validador real; nenhum upload de negócio/publicação de bytes. Conteúdo real/storage/compensação continuam no03.

Critérios comprovados por execução isolada e HTTP estão no handoff/coverage01. Pendências impeditivas naquele checkpoint: configdev/test/SHOWCREATE/integraçãoMySQL e baseline/DDL real, provider sessão02/CAPTCHA, store multi-instância, TLS/WAF/backups/monitoramento. O estado posterior de M02–M04 consta abaixo.

## 12. Prompt 02 — DECISÕES COMPARTILHADAS implementadas

Detalhamento e evidências: [backend-identity.md](backend-identity.md); checkpoint: [backend-handoff.md](backend-handoff.md).

- Preservados ESM, `/api`, models/controllers/routes/services globais, pool/transação, JWT, logger, limiter e spec única. `createApp` compõe identidade por padrão e usa SessionProvider SQL; não há mais sessão indisponível por ausência de implementação. Lookup SQL/migration ausente ainda falha fechado. Frontend intacto.
- `identityModel` usa schema v3+M02/M03/M04, SQL parametrizado, whitelists e projeções. `identityService` cuida de credenciais, sessões, reset, TOTP e idade; `profileService`, de propriedade, perfil, privacidade, administração e supervisão parental. Middleware não é autorização final: mutações revalidam sessão/status sob lock do usuário.
- JWT máximo 15min, sem refresh/cookies. JTI e tokens opacos persistidos em hash. Segredo TOTP cifrado com AES-GCM/AAD por usuário. APP implementado; SMS/EMAIL ainda 503 até protocolo/provider real integrado. Desafio 5min/5tentativas; reset30min; tentativa inválida commitada; passo TOTP crescente. Rotação mantém fator antigo até prova e revoga sessões na conclusão.
- Cadastro CLIENTE requer CAPTCHA, termos/privacidade/base legal configurados, proof provider de idade e vínculo legal para até16. Autodeclaração não basta. Administração cria somente contas internas; bootstrap primeiro ADMIN via stdin e guard persistido. Nunca usar seed/hash fixo. Mudança de acesso revoga sessões/desafios/resets e preserva último ADMIN ativo.
- Endereços/contatos principais bloqueiam usuário antes dos filhos; UNIQUE geradas existentes mantidas. Locks administrativos: guard → usuários por ID → filhos. Recuperação/2FA: lookup inicial sem lock → usuário → token/fator com releitura. E-mail/provas/CAPTCHA fora de transações. Auditoria/outbox junto à alteração.
- Export próprio paginado por seção, sem segredos. DELETE desativa e cria solicitação RECEBIDA, HTTP202; Location permite acompanhamento ADMIN. Retenção/anonimização e conclusão real dependem de política aprovada. Não converter desativação em alegação de eliminação LGPD. Sem apagar fatos financeiros/consentimentos ou aplicar expurgo90dias a estes.
- Migration `20261008_01_identity.sql` preexistente reaproveitada; nova `20261008_02_identity_guard.sql` adicionada. Plano88statements, alvo59tabelas com ledger. Nenhuma aplicada; duplicatas normalizadas/principais/fatores e DDL real exigem inspeção prévia.
- 34 operações de identidade documentadas; 54 testes isolados/HTTP aprovados. Integração MySQL nova testa baseline+upgrade e concorrência, mas foi pulada sem config. Fontes integrais agora estão nos caminhos de docs previstos. Nenhuma funcionalidade de módulos03–15 iniciada.

## Tarefa 19 — equipes e membros (08/10/2026)

O módulo ESM de equipes reutiliza identidade, transação, auditoria, rotas `/api`, DTOs e OpenAPI existentes. `teamModel` concentra SQL parametrizado sobre `equipes`, `equipe_membros`, `sessoes`, `usuarios` e a migration nova `equipe_entradas`; `teamService` controla vínculo, perfil, sessão, convite e decisão; controller/routes/validators preservam os formatos HTTP. A linha da sessão serializa criação de uma equipe ativa; a linha da equipe serializa entradas e mudanças de membros. Uma pendência por equipe/usuário usa UNIQUE gerada. O backend não cria chamados nesta tarefa. Detalhes e impactos: [backend-teams.md](backend-teams.md).

## Tarefa 20 — chamados internos (08/10/2026)

`taskModel`, `taskService`, controller, routes e validators compõem o módulo de chamados internos sob `/api/teams/:id/chamados`. A migration `20261008_05_internal_tasks.sql` adiciona vínculo composto equipe/sessão e eventos de transição sem apagar chamados legados. Transação e locks de equipe/chamado serializam atribuição e aceite; eventos e auditoria são atômicos. Não reutiliza suporte ao cliente. Contrato e limites: [backend-internal-tasks.md](backend-internal-tasks.md).

## Tarefa 21 — notificações (08/10/2026)

`notificationModel`, `notificationService`, controller, routes e validators implementam leitura própria e emissão interna transacional. A migration `20261008_06_notification_dedupe.sql` acrescenta UNIQUE `(id_usuario,dedupe_key)` sem alterar registros legados. O convite de equipe emite `TEAM_INVITATION` na mesma transação e usa o ID da entrada como chave estável; não há criação pública para terceiros. Fontes de promoção, suporte, planos e cobrança continuam nos módulos correspondentes. Contrato e limite de RF23: [backend-notifications.md](backend-notifications.md).

## Tarefa 22 — fornecedores (08/10/2026)

O módulo de fornecedores mantém routes/controller/service/model globais, auth ADMIN/FORNECEDOR e auditoria transacional. Usa o ALTER legado que renomeia `nome_fantasia` para `nome_cine` e migration nova de CNPJ normalizado/único. O cadastro exige conta FORNECEDOR ativa e não transfere propriedade. Local só é relacionável por insumos, equipamentos ou logística; as rotas futuras devem escopar fornecedor e local em conjunto. Contrato: [backend-suppliers.md](backend-suppliers.md).

## Tarefa 23 — insumos e equipamentos (08/10/2026)

`productModel`, `productService`, controller, routes e validators compõem os cadastros em `/api/inputs` e `/api/equipment`. A migration `20261008_08_supplier_products.sql` cria o vínculo operacional `fornecedor_locais` e a chave de patrimônio normalizado. O service deriva o fornecedor da conta, verifica o vínculo ativo antes de escrever e arquiva recursos referenciados logicamente. `preco` permanece string decimal; `quantidade` inicia em zero e é reservada aos movimentos de estoque. Contrato e limites: [backend-products.md](backend-products.md).

## Tarefa 24 — combos e composição (09/10/2026)

`comboModel`, `comboService`, controller, routes e validators integram combos ao app existente. `combos.id_local` é acrescentado por migration explícita; legados sem local são preservados, mas não publicados. O service valida local/insumos e bloqueia mutações em combo já referenciado por pedido, com arquivamento lógico. O catálogo público filtra disponibilidade operacional; estoque e preço final permanecem nas tarefas 26/28. Contrato: [backend-combos.md](backend-combos.md).

## Tarefa 25 — galerias de insumos e combos (09/10/2026)

O schema V4 de imagens comerciais já constava no manifest; `commerceGalleryModel`, service, controller, routes e validators foram integrados à mesma arquitetura da galeria de filmes. Storage/journal foram parametrizados por namespace e staging ganhou sidecar persistente de proprietário para FORNECEDOR. Escritas bloqueiam o pai e rebaixam a PRINCIPAL anterior antes de promover outra; UNIQUE gerada protege o banco. Público recebe somente imagens de recursos disponíveis. Contrato: [backend-commerce-galleries.md](backend-commerce-galleries.md).

## Tarefa 26 — movimentos e reserva de estoque (09/10/2026)

`inventoryModel`, `inventoryService`, controller, routes e validators compõem saldo, movimentos e alertas por local. A migration `20261009_10_inventory_reservations.sql` separa saldo físico/reservado e vincula reservas ao pedido e movimentos históricos. O serviço de checkout interno recebe a conexão transacional do chamador, expande combos e bloqueia insumos em ordem crescente; consumir, liberar e compensar são transições explícitas. Não há compra nem reserva pública antes do módulo comercial. Contrato: [backend-inventory.md](backend-inventory.md).

## Tarefa 27 — solicitações e logística (09/10/2026)

`supplyModel`, `supplyService`, controller, routes e validators integram solicitações, estoque por local e transporte. A migration `20261009_11_supply_logistics.sql` liga logística a identidade/quantidade de item, recebedor, destino e movimentos, além da devolução de equipamento. Estados e saldos mudam em uma transação com auditoria; o recebimento tem uma única transição válida. O insumo transferido ganha linha no destino rastreada pela logística; equipamento move a linha e preserva origem/destino no envio. Contrato e limites: [backend-supply-logistics.md](backend-supply-logistics.md).

## Tarefa 28 — custos, parâmetros e cotação (09/10/2026)

`pricingMath` centraliza centavos inteiros e arredondamento; `pricingModel`, `pricingService`, controller, routes e validators ligam custos reais, parâmetros, promoções, cupons, benefícios de plano e cotação. A migration `20261009_12_pricing.sql` adiciona custos opcionais, configuração por categoria, uso de cupom e snapshot de pedido. ADMIN publica preço calculado nos campos atuais de catálogo; cotação pública redige custo/margem. `commit` é consumidor interno da transação do pedido e reserva cupom com lock; a integração no checkout virá nas tarefas 33–34. Contrato: [backend-pricing.md](backend-pricing.md).

## Tarefa 29 — métodos tokenizados e provider (09/10/2026)

`paymentMethodModel`, service, controller, routes e validators gerenciam somente métodos próprios. Token e identificação mascarada vêm de provider externo injetado; o padrão falha com 503. `prepare` registra intenção idempotente antes do despacho de pagamento e verifica obrigação XOR, pagador e método na conexão transacional. Migration `20261009_13_payment_methods.sql` preserva métodos legados sem token e cria a intenção persistente. Chamadas de cobrança e conciliação pertencem à tarefa 30. Contrato: [backend-payment-methods.md](backend-payment-methods.md).
