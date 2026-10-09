# Galeria de filmes — tarefa 16 (08/10/2026)

O catálogo V4 usa `filmes_imagens` com tipos `CAPA`, `BANNER` e `ALTERNATIVA`, `ordem`, texto alternativo e `principal`. A migration V4 existente (`backend/migrations/20261006_alter_table_filmes.sql`) cria a tabela, a coluna gerada `tipo_principal` e a constraint única por filme/tipo; também copia `filmes.imagem` legada para capa principal. **Nenhuma migration nova ou aplicação de DDL nesta tarefa.** A versão aplicada no banco real ainda precisa ser confirmada.

## Contrato HTTP

- GET `/api/films/:id/images`: lista apenas de filmes `ATIVO`. GET `/api/film-images/:key`: bytes WebP somente quando a chave está associada a filme ativo. Sem URL de staging, reprodução ou caminho privado.
- GET `/api/admin/films/:id/images`: lista de filmes ativos ou arquivados. POST na mesma rota recebe `stagingKey` da tarefa 15, tipo, alt, ordem e principal; responde 201 com `Location` administrativo.
- PATCH/DELETE `/api/admin/films/:id/images/:imageId`: edita metadados/principal ou exclui vínculo. POST `/api/admin/films/:id/images/reconcile` tenta concluir compensações pendentes após falha ou interrupção.
- Respostas JSON preservam `{success,data,requestId}`. IDs são strings. A lista ordena por `ordem,id_imagem`, até 100 itens, cursor `ordem:id_imagem`. Edições de ordem entre páginas podem repetir/omitir itens; cliente deve reiniciar a paginação após mutações.
- Mutações exigem ADMIN autenticado com sessão/2FA, revalidado na transação. Toda escrita bloqueia primeiro o filme (`SELECT ... FOR UPDATE`), troca de principal limpa a anterior e a UNIQUE do banco protege a invariável. `filmes.imagem` acompanha a capa principal em cada escrita; URL legada >255 caracteres vira `NULL`, sem truncamento.

## Arquivo e falhas

O upload temporário permanece no staging até expirar após 24h. POST lê a imagem da tarefa 15 e grava cópia WebP durável com nova chave aleatória fora do lock SQL. Um journal privado por chave registra a promoção antes da transação. Depois, a reconciliação consulta a referência SQL sob lock do filme: mantém arquivo referenciado ou remove o órfão. DELETE registra journal antes do SQL e usa a mesma reconciliação após commit/rollback. Falha de reconciliação conserva o journal e emite telemetria; operador ADMIN pode chamar `/reconcile` para o filme. A operação não garante atomicidade entre filesystem e MySQL em queda abrupta; disponibilidade do journal/volume compartilhado exige monitoramento e backup.

`IMAGE_STAGING_DIR` e `IMAGE_GALLERY_DIR` devem apontar para diretórios absolutos, privados e distintos em produção. O storage local suporta uma instância; com `INSTANCE_COUNT > 1`, operações de gravação de imagens falham 503. Nenhum `express.static` expõe o volume. O acesso público a bytes faz lookup SQL a cada pedido. O limite local é 2.000 imagens; não há política automática de retenção para imagens publicadas.

## Evidência e pendência

`npm test`: 68/68 aprovados, incluindo HTTP, duas capas principais no repository de teste, ordenação/cursor, acesso público/arquivado, metadados, compensação após falha SQL e storage real. OpenAPI 3.0.3 validado com 67 operações. A suíte de integração MySQL contém cenário de principal/UNIQUE/projeção legada/privacidade, mas ficou sem execução porque `TEST_DB_*` e confirmação de schema `_test` isolado não estão disponíveis. Portanto locks/constraint no MySQL aplicado e implantação do volume durável ainda não estão aceitos.
