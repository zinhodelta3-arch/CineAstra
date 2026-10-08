# Decisões compartilhadas

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
