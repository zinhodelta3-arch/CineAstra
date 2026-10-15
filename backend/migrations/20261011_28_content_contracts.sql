-- Conteúdo aprovado é imutável por slug/versão; nenhuma identidade empresarial fictícia é semeada.
CREATE TABLE conteudos_publicados (
    id_conteudo BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    slug ENUM('business','team','history','reputation','partners','social-campaigns','terms','privacy','faq') NOT NULL,
    versao VARCHAR(50) COLLATE utf8mb4_bin NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    corpo JSON NOT NULL,
    fonte VARCHAR(500) NOT NULL,
    id_publicador INT UNSIGNED NOT NULL,
    publicado_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE KEY uk_conteudo_versao (slug,versao),
    KEY ix_conteudo_atual (slug,id_conteudo),
    CONSTRAINT fk_conteudo_publicador FOREIGN KEY (id_publicador) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE pedido_contratos (
    id_pedido BIGINT UNSIGNED PRIMARY KEY,
    oferta_hash CHAR(64) COLLATE utf8mb4_bin NOT NULL,
    contrato_snapshot JSON NOT NULL,
    aceito_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT fk_pedido_contrato FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
