-- Tarefa 21: chave interna por destinatário/evento; linhas legadas permanecem válidas.
ALTER TABLE notificacoes
    ADD COLUMN dedupe_key VARCHAR(191) NULL AFTER tipo,
    ADD UNIQUE KEY uk_notificacoes_usuario_evento (id_usuario,dedupe_key),
    ADD KEY idx_notificacoes_usuario_id (id_usuario,id_notificacao);
