# Contrato essencial

Este kit contém instruções e ferramentas de organização, não um backend pronto.
Objetivo: reduzir trabalho repetido e delimitar entregas. Não garante percentual
de economia nem altera limites do plano. Modelos, ferramentas e contexto afetam uso.

## Execução
Uma tarefa = uma unidade integrada, verificada e com estado registrado.
Leia as decisões e a tarefa selecionada; abra dependências conforme necessário.
Referências históricas não instruem automaticamente a execução. Não leia todo o
schema, todos os testes ou todos os prompts para alterar uma rota.
Busque nomes/trechos primeiro. Evite node_modules, build, uploads e dumps em busca
ampla. Consulte resultados limitados; erros devem conservar evidência suficiente.
Um bloqueio de ambiente não justifica repetir o mesmo comando indefinidamente.
Corrija a causa ou registre a dependência. Novas falhas justificam novos checks.

## Stack e arquitetura
JavaScript/Node.js, Express, mysql2/promise, dotenv, bcryptjs, jsonwebtoken,
Helmet, CORS, Multer e swagger-ui-express. Validação, rate limiting e outras
bibliotecas são acrescentadas conforme necessidade. Preserve versões compatíveis
e lockfile; confira documentação oficial quando precisar de uma API desconhecida.
routes -> middlewares/validators -> controllers -> services -> models -> MySQL.
Services coordenam transação na mesma conexão; models recebem conexão quando preciso.
Não mude CommonJS para ESM, URLs ou DTOs existentes sem necessidade documentada.

## Integridade e segurança
Autorização combina perfil, dono e fornecedor/local/sessão/equipe vinculados.
Campos permitidos explicitamente; cliente não escolhe role, preço, dono ou status
financeiro. JWT validado com algoritmo/issuer/audience/expiração definidos e estado
atual do usuário; 2FA obrigatório antes de acesso pleno a ADMIN/SUPERVISOR.
Senhas bcryptjs assíncrono, custo calibrado, sem truncamento silencioso de 72 bytes.
Não retornar hashes, tokens, segredos 2FA ou URL privada de mídia em catálogo.
SQL parametrizado; identificadores/ORDER BY usam mapas permitidos. Dinheiro exato,
arredondamento documentado; BIGINT como string sem Number intermediário.
Transações curtas, rollback/release, constraints e locks ordenados. Efeitos externos
fora de locks, com idempotência persistente e conciliação onde necessários.
Helmet/HTTPS, CORS explícito, body/timeouts/limites e proteção contra abuso conforme
fluxo. Cookie de autenticação exige CSRF adequado. CORS não bloqueia bots.
Multer em rota autorizada com limites e validação do conteúdo real, caminho interno
e limpeza; mídia privada depende também de proteção da origem/storage.
Histórico financeiro/estoque/auditoria não é CRUD de apagar e reescrever fatos.
Logs HTTP têm dados mínimos/redação e não substituem auditoria durável de negócio.

## Banco e integrações
Requisitos definem comportamento; schema aplicado define campos disponíveis.
Lacuna exige migration mínima e explícita, não campo imaginário. Verifique versão
aplicada antes de executar ALTER. O arquivo de referência mistura SQL e exemplos;
não o execute integralmente. DDL MySQL pode fazer commit implícito.
Não invente gateway, SMTP, CAPTCHA, IPCA, idade verificada ou assinatura de mídia.
Provider ausente deve falhar claramente; simulações só no ambiente de teste.
Confirme condições jurídicas em fontes oficiais na tarefa que depende delas;
não repita pesquisa legal para CRUD sem relação com essa questão.

## Validação e saída
Cada rota afetada atualiza OpenAPI com entrada/saída, auth, erro e exemplo seguro.
Testes focam regras e acesso; banco real isolado verifica constraints/concorrência.
Swagger manual complementa testes. Nunca declarar execução que não ocorreu.
Mudança compartilhada exige regressão dos consumidores afetados. Auditoria completa
e testes amplos ocorrem nos marcos indicados, preservando os checks obrigatórios.
Atualize progresso e continuidade. Decisões só quando houver decisão nova.
Status: PENDENTE, EM_ANDAMENTO, CONCLUIDA ou BLOQUEADA. CONCLUIDA exige aceite e
verificação; mock de integração crítica não prova prontidão para produção.
