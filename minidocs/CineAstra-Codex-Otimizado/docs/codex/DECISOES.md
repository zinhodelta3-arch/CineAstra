# Decisões compartilhadas

## Decisões da tarefa 18 — 08/10/2026
- `sessoes.data` é o dia de início; `horario_fim` menor que o início indica término no dia seguinte. `data_fim` é derivada no DTO, sem DDL. Hora civil local sem fuso persistido é limitação para expansão multizona.
- RN19: uma hora livre no mesmo local, inclusive salas diferentes; lock estável em `locais` antes de sala/sessão e revalidação de candidatos D−2..D+2. Exatamente uma hora é válida. Tarefa 17 já bloqueia pais na mesma ordem.
- Item de pedido associado congela filme, preço e horário e impede cancelamento; estado operacional pode avançar. DELETE é cancelamento lógico. Sala não muda por PATCH.
- RN20 de cinco horas pertence a reserva de usuário; fluxo administrativo de sessão não a restringe, pois não há marcador/vínculo de reserva no schema atual.

## Decisões da tarefa 17 — 08/10/2026
- Reutilizar tabelas/FKs/UNIQUE de locais, salas e assentos da migration base; não criar DDL duplicado. DELETE arquiva por status para preservar referências.
- Sala nasce INATIVA; só ativa com quantidade de assentos ATIVA igual à capacidade e local ATIVO. Tipos PCD/OBESO/IDOSO geram filtro/flag `acessivel`, sem afirmar disponibilidade ou certificação física.
- Qualquer sessão vinculada congela estrutura, status e arquivamento da sala e de seus assentos; local vinculado só permite editar telefone. Mais estrito que pedido PAGO para preservar histórico. Tarefa 18 deve bloquear local/sala na mesma ordem antes de criar sessão.
- Consultas públicas exigem cada pai ativo; CRUD administrativo exige ADMIN com sessão/2FA. Aceite MySQL real pendente do schema `_test` não produtivo.

## Decisões da tarefa 16 — 08/10/2026
- Reutilizar `filmes_imagens` V4 e migration existente; não criar estrutura duplicada. Escritas bloqueiam `filmes` e sincronizam `filmes.imagem`; coluna gerada `tipo_principal` só é lida pela constraint.
- Publicação copia staging para volume privado durável com nova chave e journal por arquivo. Reconciliação consulta referência SQL sob lock antes de manter/remover arquivo; endpoint ADMIN permite retry após falha.
- Lista ordena por `ordem,id_imagem`, com cursor composto; alterações de ordem entre páginas exigem reiniciar paginação. Bytes públicos somente se URL estiver vinculada a filme ATIVO.
- Storage local de instância única; `IMAGE_GALLERY_DIR` privado e distinto de staging em produção. Aceite SQL fica bloqueado sem banco `_test` confirmado, apesar de 68 testes locais e OpenAPI validado.

## Decisões da tarefa 15 — 08/10/2026
- Staging administrativo compartilhado apenas por ADMIN com sessão/2FA; nenhuma associação de galeria antecipada.
- Sharp 0.35.5 reprocessa PNG/JPEG/WebP estáticos em WebP sem metadados; Multer 2.4.0 mantido após revisão/registry/auditoria.
- Storage interno local de instância única, UUID, quota 200, acesso por 24h e expurgo sob demanda; IMAGE_STAGING_DIR explícito em produção. Sem static/fetch/URLs de entrada.
- Rotas POST /api/admin/uploads/images e GET/DELETE /:key. Tarefa 16 promove cópia durável, registra vínculo e compensa falhas SQL; staging não é fonte definitiva.
- 64 testes aprovados com decoder/filesystem/abort HTTP reais; nenhuma migration. Bloqueio MySQL anterior da 14 continua separado.

Preencher na tarefa 00; depois atualizar somente decisões novas/alteradas.
Histórico real anterior à adoção deste kit: `docs/backend-architecture-plan.md` e `docs/backend-handoff.md` na raiz do projeto. A tabela original abaixo permanece pendente de conciliação, não exige refazer o diagnóstico para a tarefa 14.

## Decisões da tarefa 14 — 08/10/2026
- Reutilizar backend ESM/Express/mysql2, auth ADMIN + 2FA, transações/auditoria/outbox existentes; npm e contratos `/api` preservados.
- Catálogo público só ATIVO, IDs/preços strings, paginação por ID; URL de reprodução restrita ao ADMIN.
- DELETE arquiva filmes e gêneros, preservando relações; migration mínima acrescenta status ao gênero (não aplicada).
- URLs de trailer/reprodução recebidas exigem HTTPS e host exato em CATALOG_MEDIA_HOSTS; sem fetch ou reprodução nesta etapa.
- Uploads/galerias ficam em 15/16. Aceite SQL bloqueado por ausência de TEST_DB_* e opt-in não produtivo; cenário preparado na suíte de identidade.

| Tema | Decisão e evidência |
| --- | --- |
| Raiz do backend / frontend | A identificar |
| Node / Express / MySQL / módulos | A identificar |
| Gerenciador / comandos start, lint, teste, migrations | A identificar no package.json |
| Prefixo, DTOs, erros, OpenAPI | Preservar contratos existentes; identificar |
| Migrations aplicadas / V4 | Conferir banco de desenvolvimento ou histórico |
| Dinheiro / BIGINT / datas / fuso | Definir representação exata e consistente |
| JWT, sessões, 2FA, CSRF, proxy e limites | Definir pelo ambiente real |
| Perfis, dono e vínculos operacionais | Mapear por endpoint/contexto |
| Reserva/estoque/pagamento/idempotência | Definir contratos antes do checkout |
| Provedores reais / ausentes | Registrar interfaces e bloqueios |

## Lacunas conhecidas nos anexos
- UNIQUE do assento em itens históricos impede revenda após cancelamento.
- Custos/parâmetros, promoções e benefícios não estão completamente persistidos.
- Convite ACEITO não representa saída, suspensão e mudança no ciclo seguinte.
- Métodos/pagamentos precisam tokenização, webhooks, idempotência e reembolsos.
- Idade/responsável, consentimentos, entrada/saída e suporte histórico exigem modelo.
- Status operacionais RF14 diferem dos financeiros; sessão atravessando meia-noite.
- Expiração/quantidade/finalidade dos tickets e vínculo da retirada de combo.
- 2FA precisa enrollment/desafio/replay e autenticação precisa revogação.
- nome_fantasia virou nome_cine; consultas antigas precisam ajuste.
- Galerias/newsletter já existem no V4; colunas geradas são somente leitura.
- Logs HTTP têm expurgo de 90 dias; retenção de negócio é decisão separada.

Registre solução/migration mínima e tarefa responsável por cada lacuna pertinente.

## Decisões da tarefa 19 — 08/10/2026

- Equipe vincula-se à sessão existente; não há FK direta para local. Supervisor próprio ou ADMIN gerencia; COLABORADOR só solicita para si ou aceita convite destinado a si. Função fica com quem autoriza a entrada. `equipe_entradas` guarda pendência/histórico e UNIQUE de pendência; membro só é criado ou reativado depois da decisão positiva. Chamados ficam na tarefa 20.

## Decisões da tarefa 20 — 08/10/2026

- Chamados internos ficam aninhados em `/api/teams/:id/chamados`, separados de suporte ao cliente; todo chamado novo recebe equipe e sessão correspondente. Legados sem equipe permanecem no banco, mas não aparecem nessas rotas.
- Atribuição mantém ABERTO; aceite do responsável ou de membro ativo quando livre muda para EM_ANDAMENTO. Responsável resolve, responsável ou gestor fecha. Exclusão elegível vira CANCELADO com histórico. A migration acrescenta FK composta equipe/sessão e `chamado_eventos`; não foi aplicada.

## Decisões da tarefa 21 — 08/10/2026

- Notificações não têm rota pública de emissão. Serviço interno exige conexão transacional e chave estável; UNIQUE por destinatário/chave preserva lida em retry. Convite de equipe usa `team-invitation:<id_entrada>` como primeiro consumidor. Fontes de notificação de cliente de RF23 aguardam os respectivos módulos, sem mensagens fictícias.

## Decisões da tarefa 22 — 08/10/2026

- Cadastro exige conta FORNECEDOR ativa e `id_usuario` imutável; DELETE marca INATIVO. DTO próprio omite dados da conta e CNPJ completo. ALTER legado fornece `nome_cine`; migration nova cria UNIQUE sobre CNPJ normalizado, inclusive alfanumérico vigente em 2026. Não há relação direta fornecedor-local: rotas de estoque/logística devem verificar as duas chaves nos recursos.

## Decisões da tarefa 23 — 08/10/2026

- A ausência de autorização explícita fornecedor-local foi resolvida por `fornecedor_locais` com concessão/revogação ADMIN. A conta FORNECEDOR determina o próprio escopo; criar/editar exige vínculo e local ativos. Produtos preservam fornecedor/local imutáveis.
- `quantidade` inicia em zero e não tem PATCH genérico; movimentos posteriores serão a única via de saldo. `preco` é preço de catálogo decimal, distinto de custo de aquisição ausente no schema. DELETE arquiva registros referenciados. Patrimônio opcional ganha UNIQUE após trim/uppercase; dados legados precisam de auditoria antes do ALTER.
