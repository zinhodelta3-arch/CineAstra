# Tarefa 32 — ocupação ativa de assentos

`assento_ocupacoes` guarda somente a cadeira ativa por sessão. A UNIQUE em `(id_sessao,id_assento)` substitui a UNIQUE histórica de `itens_pedido`; as linhas antigas continuam para auditoria e revenda após cancelamento. `id_item` vincula a confirmação ao item vendido. Reserva provisória expira em 15 minutos UTC e é removida sob lock da cadeira na próxima tentativa de reserva.

Antes de retirar a UNIQUE antiga, a migration confere se os itens históricos usam assento da sala da sessão e se o backfill cobre pedidos PAGO/FINALIZADO e pendências dentro do TTL. Pedidos CANCELADO e pendências vencidas não ocupam. Falha de inspeção ou DDL deixa o ledger para saneamento manual. A migration não foi aplicada neste ambiente.

O checkout da tarefa 34 deve chamar `reserve(c,{orderId,sessionId,seatId})` na mesma transação do pedido/item. Após pagamento confirmado, chamar `confirm(c,{orderId,sessionId,seatId,itemId})` na transação que concede o direito; confirmação após TTL falha. Cancelamento elegível primeiro cancela pedido e tickets vivos, depois chama `releaseCancelled(c,{orderId})` na mesma transação. Ticket GERADO/UTILIZADO impede liberação. Nenhuma rota HTTP nova foi criada nesta tarefa.

O serviço valida pedido, local, sala, sessão e assento ativos e mantém IDs como strings. O índice único decide a corrida do último assento. Inserção direta de item fora da transação de ocupação viola o contrato. Aceite real depende de `TEST_DB_*`, `RUN_IDENTITY_MYSQL_TESTS=true` e schema `_test` vazio confirmado como não produtivo.
