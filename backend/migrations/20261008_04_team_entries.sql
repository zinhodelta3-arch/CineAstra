-- Tarefa 19: solicitação/convite explícito; equipe_membros só muda após aceite.
-- Uma pendência por usuário/equipe; histórico ACEITA/RECUSADA/CANCELADA permanece.
CREATE TABLE equipe_entradas (
    id_entrada BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_equipe INT UNSIGNED NOT NULL,
    id_usuario INT UNSIGNED NOT NULL,
    id_emissor INT UNSIGNED NOT NULL,
    tipo ENUM('SOLICITACAO','CONVITE') NOT NULL,
    funcao_proposta VARCHAR(100) NULL,
    status ENUM('PENDENTE','ACEITA','RECUSADA','CANCELADA') NOT NULL DEFAULT 'PENDENTE',
    pendente_usuario INT UNSIGNED GENERATED ALWAYS AS (
        CASE WHEN status = 'PENDENTE' THEN id_usuario ELSE NULL END
    ) STORED,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    decidido_em DATETIME NULL,
    UNIQUE KEY uk_equipe_entrada_pendente (id_equipe, pendente_usuario),
    KEY idx_equipe_entradas_usuario (id_usuario, status, id_entrada),
    CONSTRAINT fk_equipe_entradas_equipe FOREIGN KEY (id_equipe) REFERENCES equipes(id_equipe),
    CONSTRAINT fk_equipe_entradas_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    CONSTRAINT fk_equipe_entradas_emissor FOREIGN KEY (id_emissor) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
