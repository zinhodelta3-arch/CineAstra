# Tarefa 33 — carrinho e cotação

`POST /api/orders/quote` recebe apenas `localId` opcional, `lines` tipadas e `couponCode` opcional. Cada linha identifica exatamente SESSION com `seatId` e quantidade 1, INPUT/COMBO com quantidade positiva ou STREAMING com `mode` ALUGUEL/COMPRA e quantidade 1. Campos de preço, status e dono são rejeitados. Somente CLIENTE com sessão ativa pode consultar.

O serviço verifica sessão, sala, local, cadeira livre no instante da leitura, filme, classificação etária, fornecedor/local de insumos, composição e saldo disponível agregado entre linhas. Verificação de idade vigente é obrigatória; menor de até 16 anos recebe `guardianAuthorizationRequired=true` e `finalizable=false`. Meia-entrada é apenas prévia até comprovação. A cotação usa o motor da tarefa 28, retorna preços exatos, desconto, total, `fees=0.00` e horário do snapshot. Nenhuma taxa adicional é cobrada nesta etapa.

Compra definitiva de streaming usa categoria `PURCHASE`, custo `filmes.custo_streaming_compra` e preço publicado `filmes.preco_compra`. A migration `20261010_17_streaming_purchase_pricing.sql` acrescenta o custo e a categoria aos parâmetros/promoções/benefícios; custo NULL bloqueia cotação. A migration ainda não foi aplicada.

A cotação não cria pedido, item, ticket, pagamento ou reserva. O snapshot retornado é informativo e deve ser recalculado na transação do checkout da tarefa 34, que persistirá pedido/itens/snapshot e reservará estoque/assento antes de pagamento. Preço e disponibilidade podem mudar entre a cotação e essa transação. O frontend não foi alterado.

Na tarefa 35, a linha COMBO ganhou `sessionId` opcional na cotação e obrigatório no checkout para vincular a retirada a uma sessão do mesmo local. A cotação sem sessão continua informativa.
