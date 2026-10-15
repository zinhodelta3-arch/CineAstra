# Participantes e rateio — tarefa 39

O titular escolhe `divisionMode` (`TITULAR_PAGA` ou `DIVISAO_IGUAL`) em `POST /api/subscriptions`. A primeira cobrança continua integralmente do titular, pois ainda não há participantes. A entrada e a saída só mudam a composição usada no ciclo seguinte; faturas anteriores não são reescritas.

## API

- `GET /api/subscriptions/{id}/participants` e `/participants/history`: membros atuais e eventos históricos para titular ou participante vinculado.
- `POST /api/subscriptions/{id}/invitations` (titular), `GET /api/subscription-invitations/me`, `POST /api/subscription-invitations/{id}/accept` ou `/decline` (convidado). Convite reserva vaga. O lock na assinatura serializa convites e aceites; o limite contratado inclui o titular e participantes suspensos.
- `POST /api/subscriptions/{id}/participants/me/leave` permite saída própria. `POST /api/subscriptions/{id}/participants/{userId}/suspend` e `/resume` são do titular. Suspensão corta benefício imediatamente, mas não apaga cobranças passadas nem transfere a cota sem acordo.
- `POST /api/subscriptions/{id}/division-proposals` propõe nova modalidade. `GET /api/subscriptions/{id}/division-proposals/pending` mostra a proposta e o próprio voto; `POST /api/subscriptions/{id}/division-proposals/{proposalId}/consent` registra aceite/recusa. O titular consente ao propor; todos os participantes atuais, inclusive suspensos, precisam aceitar. Entrada fica bloqueada durante votação; saída cancela a proposta. Modo aprovado é agendado para o próximo ciclo.
- `GET /api/subscriptions/{id}/next-cycle` mostra cota futura em centavos e `issued:false`. `GET /api/subscriptions/{id}/charges?competence=AAAA-MM-01` mostra somente cobranças próprias, inclusive após saída. A soma do rateio é exata: ordenação por ID, centavos remanescentes distribuídos aos primeiros IDs.

Eventos de convite, participação e rateio geram notificações in-site na mesma transação e auditoria. Convites aceitos legados são incorporados pela migration `20261011_23_plan_participants.sql` com evento histórico. A migration cria participante atual, eventos, propostas e consentimentos, e agenda o modo futuro na assinatura. Não foi aplicada.

O módulo 39 calcula e avisa a próxima cota; a emissão idempotente de cobranças recorrentes, aplicação da modalidade agendada, inadimplência e cancelamento automático pertencem ao módulo 40. Sem MySQL `_test` e `TEST_DB_*`, FK, backfill, concorrência e isolamento financeiro não têm aceite em banco real. Também falta provider financeiro real para comprovar pagamento de cotas.
