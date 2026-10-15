# Notificações — tarefa 21

`GET /api/notifications/me` lista apenas o destinatário da sessão autenticada, com `limit`, cursor BIGINT, `unread=true|false` e `type`. `PATCH /api/notifications/me/:id/read` marca somente a própria notificação como lida e é idempotente; registro alheio retorna 404. O DTO não inclui `id_usuario` nem a chave interna de deduplicação. Não existe endpoint público para criar notificações ou escolher destinatário.

O serviço interno `notificationService.emit(c, event)` exige a conexão da transação do evento de negócio. `id_usuario` e `dedupe_key` têm UNIQUE composta, então repetir a emissão com a mesma chave retorna a notificação original e preserva o estado `lida`. A migration `20261008_06_notification_dedupe.sql` acrescenta a chave nullable e índice de listagem à tabela existente; registros legados permanecem válidos. A chave é construída no servidor.

O primeiro consumidor é o convite de equipe: a criação de `equipe_entradas` e a notificação `TEAM_INVITATION` ocorrem na mesma transação; `team-invitation:<id_entrada>` deduplica retries. Não foram criadas notificações fictícias de promoções, suporte, planos ou cobranças. Essas fontes de RF23 dependem dos respectivos módulos de negócio, consentimento e política de envio. A interface frontend não foi alterada.

`backend/tests/notification.test.js` cobre IDOR, paginação, filtros, retry, lida preservada, API sem POST e SQL parametrizado; `team.test.js` confere o consumidor. A suíte MySQL opt-in verifica UNIQUE no banco isolado. Sem `TEST_DB_*`/schema `_test` vazio, a migration e o teste MySQL não foram executados.
