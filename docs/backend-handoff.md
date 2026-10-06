# CineAstra — handoff Prompt 00

Data: 06/10/2026. **STATUS: CONCLUÍDO COM PENDÊNCIAS de evidência do ambiente/banco.** Entregas de diagnóstico produzidas; backend não funcional nem pronto para produção. Executado somente Prompt 00 + Contrato global. Não iniciar módulos futuros automaticamente.

## Arquivos criados nesta rodada

- `docs/backend-architecture-plan.md`: arquitetura atual/alvo, classificação, dependências/risco, frontend, permissões, máquinas de estado, contratos, propostas M00–M16, sequência e dependências externas.
- `docs/backend-schema-inventory.md`: 47 tabelas v3+V4, colunas funcionais, PK/FK/UNIQUE/CHECK, ENUMs, geradas, índices e evento de logs.
- `docs/backend-coverage.md`: matriz de todos RF01–46/RN01–26/RNF01–36, fluxo/entidade/endpoint planejado/perfil/escopo/responsável/teste, V4.
- `docs/backend-handoff.md`: checkpoint, comandos/resultados e bloqueios.

Sem alterações em código frontend/backend, manifests/lockfiles, migrations, seeds ou banco. Sem endpoint criado/modificado. Sem permissão/transação de negócio implementada. OpenAPI ausente: convenção/local/versão definidos para Prompt 01, sem spec fictícia de rotas não implementadas.

## Resumo que a próxima rodada precisa confirmar

1. Checkout inicialmente limpo. API ESM esqueleto com pastas models/controllers/routes contendo apenas `.gitkeep`.
2. Dependências locais não instaladas; manifest usa mysql/bcrypt, código exige mysql2/bcryptjs e jsonwebtoken ausentes, swagger-ui-express ausente. Preserve npm e lock v3; corrigir só no Prompt 01 autorizado.
3. `app.js` importa middlewares sem extensão, referencia authRotas inexistente, wildcard `*` incompatível Express5, dá listen no import e contém rotas/texto de loja de roupas. Não existe login implementado a preservar; preservar prefixo `/api/auth`, avaliar alias anunciado `/registrar`.
4. Frontend é protótipo com arrays hardcoded; nenhuma chamada HTTP/endpoint/resposta da API consumida. Preset local difere de tema ENUM; checkout atual sem assento e total fixo é mock, não contrato comercial real.
5. Banco final esperado 47 tabelas, nome_cine/url/galerias/newsletter/logs versionados; **não sabemos quais foram aplicados**. Não tentar migration automática para descobrir.
6. Base `02` contém SELECTs de referência com placeholders fora de comentários e queries antigas; seed `05` usa nome_fantasia depois de rename e hashes aparentes incompletos de 58 caracteres, tokens/chaves estáticos, IDs fixos. Não usar em produção/bootstrap nem confundir SELECT manual com teste automatizado.
7. JWT tem perfil minúsculo incompatível; helpers SQL concatenam where/tabela/colunas e cada chamada usa conexão própria; logger/upload têm elementos úteis mas não cumprem Contrato global.
8. Não existe configuração `.env` local na raiz/backend/frontend; `.gitignore` raiz não protege .env. Não imprimir conteúdo sensível caso próxima rodada encontre configuração em outro lugar.

## Validação realizada (sem escrever no banco)

| Comando/verificação | Resultado observado / limite |
| --- | --- |
| `git status --short` antes de editar | Vazio, checkout inicialmente limpo |
| `node --version`; `npm --version` | v24.14.1 / 11.11.0 |
| Inventário dedicado + `Get-ChildItem -Force` | Pastas de domínio/uploads só .gitkeep; sem env/node_modules locais; mysql não encontrado por Get-Command |
| Inspeção de ambos package.json e JSON completo de ambos lockfiles por script Node | lock v3, versões/runtime coerentes com respectivos manifests; ausência das quatro libs backend exigidas |
| `require.resolve` com paths backend: express/mysql2/promise/bcryptjs/jsonwebtoken | NOT_RESOLVED para todas; não chamar libs travadas de “instaladas” |
| `node --check backend/app.js` e `Get-ChildItem backend -Recurse -Filter *.js ... node --check` | 8 arquivos JS backend aceitos sintaticamente; não resolve imports/nem valida Express em runtime |
| `node backend/app.js` | Exit 1, ERR_MODULE_NOT_FOUND: express; processo falhou antes de ouvir HTTP ou acessar SQL. Defeitos de imports/authRotas/wildcard além disso constatados estaticamente, não segundo erro runtime observado |
| `npm test` em backend | Exit 1: Error: no test specified. Nenhuma suíte existe |
| Script Node ESM com node:assert e import ApiError | 6 assertions aprovadas (status 400/404/401/403/500 e chaves JSON com detalhes); teste local ad hoc, não suíte persistida nem HTTP |
| `npm audit --package-lock-only --ignore-scripts --json` em backend | Exit 0, 0 vulnerabilidades reportadas, metadados prod=99/total=98 do próprio npm. Não instala nem atualiza lock. Não prova segurança do código/provedores |
| Consulta aviso oficial Multer GHSA-3pph-fpjx-jg34 | Correction 2.4.0, lock já nessa versão; revalidar todos avisos no 01 |
| Consulta oficial Lei 15.211/2025 Planalto | Art41-A vigência 17/03/2026; aplicabilidade/modulação Art39 e regulamentos exigem decisão jurídica, não certificação |
| Scripts de inspeção seed sem imprimir dados sensíveis | 37 alvos INSERT v3, nome antigo, SELECTs manuais, tokens estáticos e 9 hashes aparentes de comprimento 58; conteúdo não executado |
| Contagem CREATE TABLE removendo linhas comentadas | 47 nomes únicos; busca regex inicial sem remover comentários deu 48 por incluir exemplo notificacoes_historico, descartado |
| Busca fetch/axios/api no frontend e leitura page/providers/config | Nenhuma integração HTTP; arrays mock/localStorage e serviços externos de imagem/fontes/trailer |
| Script Node assert de integridade documental | RF46/46, RN26/26, RNF36/36 com linhas de matriz; 47/47 entidades DDL no inventário; links relativos entre documentos resolvidos |
| `git diff --check`; `git status --short` ao finalizar | Sem diff de arquivos previamente rastreados; apenas `?? docs/` com os quatro novos documentos. `diff --check` não valida arquivos ainda não rastreados |

Uma tentativa auxiliar de inspeção com regex via `node -e` falhou na interpretação de aspas do PowerShell, antes de executar JavaScript. Refeita por here-string com sucesso; não é falha do projeto. Não executados: instalação npm, migrations/seeds, conexão MySQL/SHOW CREATE/scheduler, HTTP/RBAC/login, concorrência/transação/reembolso, OpenAPI/Swagger, frontend build/lint/browser/carga/acessibilidade. Motivos: bibliotecas/suítes/configuração de banco ausentes e escopo diagnóstico; nenhuma evidência de serviço pronto.

## Próxima etapa: Prompt 01 — fundação, não domínio

Ler os quatro documentos, AGENTS e contrato revisado; reinspecionar arquivos. Arquivos previstos para preservar/corrigir: `backend/app.js`, `config/database.js`, `config/jwt.js`, os quatro middlewares, `utils/ApiError.js`, `backend/package.json`, `backend/package-lock.json`, `.gitignore`. Manter SQL como evidência até baseline real; frontend intocado. Criar `backend/server.js`, configuração env validada/`.env.example` sem segredos, helper transacional, requestId/404/limiter/autorizações básicas/health/readiness, specification `backend/docs/openapi.json`, infraestrutura de testes/validação da spec e runner seguro com separação seeds/exemplos. Diretórios globais atuais, sem arquitetura paralela.

Aceite 01: app importável sem listen, env inválido falha seguro, HTTP health/404/errors/limites/CORS/JWT/RBAC testados, pool libera/fecha, BIGINT >2^53 não arredonda (incluindo insertId), log redigido com fila limitada, Swagger válido sem afrouxar Helmet global. MySQL integration exige base dev/test confirmada e isolada. Infra não depende de gateway/IA para começar; providers críticos não configurados falham 503. Login/cadastro real e demais módulos ficam para rodadas respectivas.

## Bloqueios e condições para resolver

| Bloqueio real | O que impede | Responsável / condição concreta |
| --- | --- | --- |
| Sem conexão/atestado de ambiente dev/test/schema real | Dizer o que já está aplicado, testar SQL/locks/scheduler | Operações fornece config por canal seguro, confirma alvo não produtivo e autoriza leitura de metadados. Somente leitura na verificação inicial; não aplicar DDL sem rodada autorizada |
| Bibliotecas/manifests incompatíveis e bootstrap quebrado | Qualquer teste HTTP/inicialização da API | Prompt 01: corrigir dependências+imports+bootstrap com lock preservado e provas runtime |
| Sem suíte automatizada/runner de migration | Regressão/contrato/integração reproduzível | 01 cria infraestrutura; módulos implementam testes antes de afirmar cobertura |
| Fontes integrais só em anexos externos, não caminhos docs pedidos | Continuidade em outra máquina | Disponibilizar/copiar fontes integrais aprovadas nos nomes esperados; não usar resumos como contrato global completo |
| Gateway/tokenização/recorrência/webhook e mídia privada não definidos | Pagamento/reembolso real e play protegido | Financeiro/infra escolhem provider, sandbox/protocolo/capacidades; 09/11 integram e validam sem aprovação fictícia |
| E-mail/SMS/CAPTCHA/provider idade e prova responsável ausentes | Reset/double opt-in/2FA remoto/cadastro idade confiável | Produto/privacidade/infra definem provider, evidência mínima/base legal/config segura; nenhum sucesso presumido |
| Custos, TTL, combo médio, ETA, ciclo/IPCA/dias, conteúdo empresarial e jurídico não aprovados | Publicar ofertas/planos/regras legais como implementadas | Financeiro/produto/operações/jurídico resolvem pendências do plano; não criar dados fictícios para passar testes |
| HTTPS/WAF/store limiter/proxy/backups/monitoramento sem evidência | Critérios produção/disponibilidade/segurança | Infra disponibiliza topologia e testes/medições operacionais; gate final 15 |

## Continuidade obrigatória

Atualizar architecture/coverage/handoff em cada rodada e a OpenAPI no módulo que criar/alterar rotas. Endpoints nas matrizes são planejamento, não implementação. Migrations M00–M16 têm dono e critérios, não execução autorizada em lote. Revalidar schema antes de escrever SQL; não recriar V4 já aplicado nem apagar histórico para revender assento. Nenhum requisito crítico desaparece pela falta de coluna: responsável/solução ou dependência impeditiva está registrado.
