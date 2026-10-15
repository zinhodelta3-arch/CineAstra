# Tarefa 27 — solicitações e logística

## Contrato

- `GET /api/stock?localId=...&sessionId=...` mostra saldos locais e envios já enviados/em trânsito. ADMIN pode omitir `sessionId`; SUPERVISOR/COLABORADOR precisam de equipe vinculada à sessão/local. Itens sem saldo ficam `SEM_ESTOQUE`; envios ativos aparecem em `a_chegar`.
- `GET/POST /api/stock/requests`, `GET /:id`, `POST /:id/approve` e `/refuse`: uma solicitação tem quantidade positiva e exatamente um insumo ou equipamento. Um item de origem e local de destino têm vínculo fornecedor/local ativo. Solicitação de equipamento exige sessão. Aprovação cria uma logística única; recusa não movimenta saldo.
- `GET /api/logistics`, `GET /:id`, `POST /:id/send`, `/transit`, `/receive`, `/cancel`, `/return`: fornecedor próprio ou ADMIN decide e envia; equipe vinculada ao destino ou ADMIN recebe. Só envio PENDENTE pode ser cancelado. Recebimento exige ENVIADO/EM_TRANSITO, finaliza a solicitação e registra ENTRADA uma vez. Devolução é exclusiva a equipamento recebido após sessão ENCERRADA; volta ao local de origem uma vez. Transferência de equipamento é integral.
- Cursor/IDs são strings decimais; `limit` 1–100. Listagem de equipe por sessão exige `localId` e `sessionId`. A resposta segue `{success,data,requestId}`.

## Integridade

`supplyService` usa a conexão da transação para locks, saldo, estado, movimentos e auditoria. O envio de insumo debita a origem e registra SAIDA. O recebimento cria uma linha de insumo no destino, liga `id_insumo_destino` à logística e registra ENTRADA; origem e destino não são inferidos de nomes. Para equipamento, a linha física muda de local no recebimento e volta no retorno; a logística preserva os locais históricos. A chave única por solicitação impede segundo envio; a chave por logística/tipo impede repetir movimento do mesmo tipo. O recebimento repetido e o local de sessão divergente retornam erro.

`20261009_11_supply_logistics.sql` acrescenta as referências e o estado DEVOLVIDO. Antes do ALTER, auditar `logistica.id_solicitacao` duplicado ou não nulo sem item/quantidade: a UNIQUE/CHECK rejeita esses legados. Aplicar somente depois das migrations anteriores em banco isolado e revisar plano/ledger. A migration não foi executada nesta rodada.

## Limites conhecidos

Não há coordenadas, distância de rota ou provider de ETA. `data_prevista` continua `null` até integração com dados reais; RN11 não é declarado completo. O schema não registra uso efetivo de equipamento durante sessão; a devolução é liberada pelo estado ENCERRADA, sem afirmar uso. Cada recebimento entre locais cria uma nova linha de insumo e mantém a identidade pela logística, podendo haver mais de uma linha para o mesmo nome; a consulta de alertas da tarefa 26 é por linha de insumo e não emite notificações duplicadas. A interface de solicitação não foi alterada. MySQL `_test` não estava configurado, portanto constraints, locks e rollback SQL real seguem sem aceite.
