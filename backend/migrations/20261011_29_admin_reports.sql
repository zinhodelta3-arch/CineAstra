-- Índices de leitura para os períodos dos relatórios; não alteram dados financeiros.
ALTER TABLE pagamentos ADD KEY idx_pagamentos_relatorio (data_pagamento,status,id_pedido,id_cobranca);
ALTER TABLE reembolso_solicitacoes ADD KEY idx_reembolsos_relatorio (respondido_em,status,id_pagamento);
ALTER TABLE auditoria_eventos ADD KEY idx_auditoria_relatorio (occurred_at,id_auditoria);
