-- Tarefa 20: vínculo explícito de equipe e histórico durável de chamados internos.
-- Legados sem equipe ficam preservados; novas rotas exigem equipe/sessão válidas.
ALTER TABLE equipes
    ADD UNIQUE KEY uk_equipes_id_sessao (id_equipe,id_sessao);

ALTER TABLE chamados
    ADD COLUMN id_equipe INT UNSIGNED NULL AFTER id_sessao,
    ADD KEY idx_chamados_equipe (id_equipe,id_sessao,id_chamado),
    ADD CONSTRAINT fk_chamados_equipe_sessao FOREIGN KEY (id_equipe,id_sessao) REFERENCES equipes(id_equipe,id_sessao),
    MODIFY COLUMN status ENUM('ABERTO','EM_ANDAMENTO','RESOLVIDO','FECHADO','CANCELADO') NOT NULL DEFAULT 'ABERTO';

CREATE TABLE chamado_eventos (
    id_evento BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_chamado INT UNSIGNED NOT NULL,
    id_ator INT UNSIGNED NOT NULL,
    acao ENUM('CRIADO','EDITADO','ATRIBUIDO','ACEITO','RESOLVIDO','FECHADO','CANCELADO') NOT NULL,
    status_anterior ENUM('ABERTO','EM_ANDAMENTO','RESOLVIDO','FECHADO','CANCELADO') NULL,
    status_novo ENUM('ABERTO','EM_ANDAMENTO','RESOLVIDO','FECHADO','CANCELADO') NOT NULL,
    id_responsavel INT UNSIGNED NULL,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_chamado_eventos_chamado (id_chamado,id_evento),
    CONSTRAINT fk_chamado_eventos_chamado FOREIGN KEY (id_chamado) REFERENCES chamados(id_chamado),
    CONSTRAINT fk_chamado_eventos_ator FOREIGN KEY (id_ator) REFERENCES usuarios(id_usuario),
    CONSTRAINT fk_chamado_eventos_responsavel FOREIGN KEY (id_responsavel) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
