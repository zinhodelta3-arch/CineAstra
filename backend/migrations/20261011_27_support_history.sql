-- RF22/RN13: prazo explícito, histórico append-only e sessões ao vivo limitadas.
ALTER TABLE suporte
    ADD COLUMN prazo_resposta_em DATETIME NULL,
    ADD COLUMN primeira_resposta_em DATETIME NULL,
    ADD COLUMN ultima_interacao_em DATETIME NULL,
    ADD KEY idx_suporte_fila (status, prazo_resposta_em, id_suporte);

UPDATE suporte SET prazo_resposta_em=DATE_ADD(data_abertura,INTERVAL 5 DAY),
    ultima_interacao_em=data_abertura
WHERE prazo_resposta_em IS NULL;

CREATE TABLE suporte_mensagens (
    id_mensagem BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_suporte INT UNSIGNED NOT NULL,
    id_autor INT UNSIGNED NULL,
    papel ENUM('CLIENTE','ADMIN') NOT NULL,
    mensagem TEXT NOT NULL,
    registrada_em DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    origem ENUM('NOVA','LEGADO_ABERTURA','LEGADO_RESPOSTA') NOT NULL DEFAULT 'NOVA',
    KEY idx_suporte_mensagens_historico (id_suporte,id_mensagem),
    CONSTRAINT fk_suporte_mensagens_suporte FOREIGN KEY (id_suporte) REFERENCES suporte(id_suporte),
    CONSTRAINT fk_suporte_mensagens_autor FOREIGN KEY (id_autor) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO suporte_mensagens(id_suporte,id_autor,papel,mensagem,registrada_em,origem)
SELECT id_suporte,id_cliente,'CLIENTE',mensagem,data_abertura,'LEGADO_ABERTURA'
FROM suporte WHERE mensagem IS NOT NULL AND CHAR_LENGTH(TRIM(mensagem))>0;

INSERT INTO suporte_mensagens(id_suporte,id_autor,papel,mensagem,registrada_em,origem)
SELECT id_suporte,id_atendente,'ADMIN',resposta,NULL,'LEGADO_RESPOSTA'
FROM suporte WHERE resposta IS NOT NULL AND CHAR_LENGTH(TRIM(resposta))>0;

CREATE TABLE suporte_atendimentos (
    id_atendimento BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_suporte INT UNSIGNED NOT NULL,
    id_atendente INT UNSIGNED NOT NULL,
    iniciado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    encerrado_em DATETIME NULL,
    id_suporte_ativo INT UNSIGNED GENERATED ALWAYS AS (IF(encerrado_em IS NULL,id_suporte,NULL)) STORED,
    UNIQUE KEY uk_suporte_atendimento_ativo (id_suporte_ativo),
    KEY idx_suporte_atendimentos_historico (id_suporte,id_atendimento),
    KEY idx_suporte_atendimentos_expiracao (encerrado_em,iniciado_em,id_suporte),
    CONSTRAINT chk_suporte_atendimento_10min CHECK (encerrado_em IS NULL OR
        (encerrado_em>=iniciado_em AND encerrado_em<=DATE_ADD(iniciado_em,INTERVAL 10 MINUTE))),
    CONSTRAINT fk_suporte_atendimento_suporte FOREIGN KEY (id_suporte) REFERENCES suporte(id_suporte),
    CONSTRAINT fk_suporte_atendimento_admin FOREIGN KEY (id_atendente) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
