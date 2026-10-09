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

## Decisões da tarefa 24 — 09/10/2026

- `combos.id_local` torna o local explícito para validar a composição; NULL preserva legados sem atribuição arbitrária, que ficam fora da consulta pública até saneamento. Cada insumo do combo deve estar disponível no mesmo local e ter fornecedor/vínculo operacional ativos.
- Combo já referenciado em `itens_pedido` não aceita PATCH nem substituição da composição; DELETE apenas arquiva. Fotos alternativas em `combos_imagens` não são variantes comerciais. O preço armazenado é base decimal; descontos/limite pertencem à tarefa 28, saldo/consumo à 26.

## Decisões da tarefa 25 — 09/10/2026

- Reutiliza storage/journal V4 em namespaces separados para insumos e combos. Staging de FORNECEDOR exige sidecar persistente com ID da conta; arquivos antigos sem sidecar falham fechados e precisam de reenvio. Galeria de insumo aceita ADMIN e fornecedor proprietário/vínculo ativo; combo permanece ADMIN. Escritas bloqueiam o pai e rebaixam PRINCIPAL anterior antes da promoção. Não há migration nova porque tabelas/UNIQUE V4 já estão no schema.

## Decisões da tarefa 26 — 09/10/2026

- `insumos.quantidade` permanece saldo físico; `quantidade_reservada` nova determina disponibilidade. Uma reserva por pedido/insumo agrega linhas de insumo e todos componentes de combo, com UNIQUE e transições ATIVA/CONSUMIDA/LIBERADA/COMPENSADA. Checkout futuro deve usar a mesma transação/conexão; nenhuma reserva pública é exposta antes da compra real.
- Movimentos manuais só alteram saldo físico disponível e usam quantidade assinada: ENTRADA/DEVOLUCAO positivas, SAIDA/PERDA negativas, AJUSTE em ambos os sentidos. Consumo e compensação vinculam movimento à reserva; liberação não cria movimento físico. Alerta de mínimo usa disponível <= mínimo, sem afirmar garantia de reposição.

## Decisões da tarefa 27 — 09/10/2026

- Solicitação referencia exatamente um item de origem e um local de destino; equipamento exige sessão. Fornecedor precisa de vínculo ativo com ambos os locais. Aprovação cria uma logística única por solicitação; envio debita insumo e recebimento o credita em linha do destino, ligada ao envio. Equipamento transfere a linha integralmente; origem/destino históricos ficam na logística.
- Devolução de equipamento exige recebimento e sessão ENCERRADA; registra uma única devolução e reatribui local de origem. O schema não prova uso real durante a sessão. Não há coordenadas/provider para RN11, logo `data_prevista` permanece sem ETA inventado.

## Decisões da tarefa 28 — 09/10/2026

- Cálculos financeiros usam centavos `BigInt`, percentuais em pontos-base e arredondamento half-up. Custos ausentes ficam NULL e bloqueiam cotação; preços publicados são atualizados explicitamente pelo ADMIN, e catálogo fora da base calculada torna a cotação não finalizável. Passo inicial de combo: 5% por item adicional, configurável e sujeito ao teto de 25%.
- Meia usa metade do preço cobrado do público em geral, com promoções públicas refletidas nessa base, sem acumular descontos pessoais. Pode ficar abaixo do custo unitário por direito legal; a projeção de margem é avaliada pela ocupação e 50% de meias. Prévia de meia não é elegibilidade comprovada e não permite `commit` sem sinal confiável do checkout futuro.
- Cupom não é consumido em cotação. A confirmação interna bloqueia o cupom, reserva uso por 15 minutos e grava snapshot imutável do pedido; pagamento/cancelamento futuro deve confirmar ou liberar a reserva. Benefício de plano só vale com cobrança PAGA/ISENTA da competência.

## Decisões da tarefa 29 — 09/10/2026

- A API recebe somente `setupReference` opaca de fluxo hospedado; o provider real emite token, marca e últimos quatro. Sem adaptador configurado, toda operação externa falha 503. Métodos legados sem token aparecem ao dono, mas são inelegíveis para cobrança.
- DELETE arquiva o método para preservar FKs financeiras. `pagamento_intencoes` registra antes do gateway a obrigação XOR, método, valor e chave única por pagador; retry idêntico retorna o registro original. Despacho externo/webhook ficam na tarefa 30, fora dos locks.
