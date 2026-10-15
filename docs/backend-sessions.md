# Agendamento de sessões — tarefa 18 (08/10/2026)

O módulo usa `sessoes` da migration base `20261001_02_create_tables.sql` e suas FKs para filme/sala. `itens_pedido.id_sessao` identifica direitos já iniciados. Nenhuma migration nova ou aplicação de DDL nesta tarefa; a versão aplicada do banco real ainda precisa de confirmação.

## Contrato HTTP

- GET público `/api/sessions` e `/api/sessions/:id`: somente sessões `AGENDADA` ou `EM_CARTAZ` com local/sala/filme ativos e filme disponível para cinema. Filtros opcionais `localId`, `date`, `startFrom`, `startUntil`; paginação por ID com `limit` 1–100 e cursor. Data e faixa de horário filtram o **início** da sessão, sem inferir disponibilidade de assentos ou direito de compra.
- GET `/api/admin/sessions` e `/:id` incluem estados internos e filtro `status`. POST cria sessão; PATCH edita sessão agendada sem itens ou avança estado; DELETE marca `CANCELADA`, preservando FKs/histórico. Gestão exige ADMIN com sessão/2FA, revalidado na transação. Resposta JSON mantém `{success,data,requestId}`; IDs e preço são strings. `data_fim` deriva do horário para deixar explícito o término no dia seguinte.
- Entradas: `id_filme`, `id_sala`, `data`, `horario_inicio`, `horario_fim`, `preco_inteira`; `idioma` opcional. PATCH não muda a sala, pois isso exigiria migração de direitos/assentos; mudança de status é enviada separadamente. `AGENDADA → EM_CARTAZ → ENCERRADA` é o ciclo normal; cancelamento só antes de encerrar e sem item de pedido. Nenhum pagamento é criado ou confirmado por estas rotas.

## Tempo, locks e direitos

- `sessoes.data` é o **dia de início**. Se `horario_fim` for menor que `horario_inicio`, termina no dia seguinte. Início e fim iguais são rejeitados; o intervalo deve ter menos de 24 horas. A duração deve cobrir `filmes.duracao`. Os horários representam hora civil do local; o schema atual não persiste fuso ou offset, limitação a resolver antes de operações em fusos distintos e transições de horário de verão.
- RN19: entre quaisquer sessões não canceladas do mesmo **local**, inclusive salas distintas, exige uma hora livre. Exatamente 60 minutos é permitido. A busca examina dias de início de D−2 até D+2 para incluir sessões de quase 24h e conflitos antes/depois da meia-noite. Toda criação ou mudança de horário bloqueia `locais` antes de `salas` e revalida sala/filme e conflitos na transação; o fluxo da tarefa 17 usa a mesma ordem. Escritas externas que ignorem esse lock não têm proteção por constraint SQL.
- Qualquer item de pedido associado congela filme, preço, data e horários e impede cancelamento, mesmo que o pedido ainda não esteja pago. Avanço de estado operacional continua permitido. Esta regra conservadora protege direitos e evita tratar carrinho/compra como revogação automática. Reembolsos/transferências pertencem ao módulo financeiro.
- RN20 limita a cinco horas **sessões reservadas por usuários**. Este endpoint é administrativo e o schema atual não identifica reserva de usuário; por isso não impõe cinco horas a sessões gerais nem declara RN20 implementada. O futuro fluxo de reserva deverá persistir o vínculo e aplicar o limite nele.

## Evidência e pendência

`npm test`: 76/76, incluindo fronteira de 60 minutos, conflitos entre salas, dia anterior/seguinte, meia-noite, corrida simultânea em repository de teste, validação estrita, venda congelada e preço exato. OpenAPI 3.0.3 validado com 95 operações, sete novas. A suíte MySQL isolada contém corrida concorrente e pedido com item vinculado, mas foi pulada sem `TEST_DB_*` e confirmação de schema `_test` vazio e não produtivo. Portanto o comportamento de locks/transações sob MySQL real ainda não está aceito.
