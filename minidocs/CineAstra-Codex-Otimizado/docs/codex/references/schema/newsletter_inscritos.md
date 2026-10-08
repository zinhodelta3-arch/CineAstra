# newsletter_inscritos

Referência por tabela; confira migrations aplicadas.

```sql
CREATE TABLE newsletter_inscritos (
    id_inscrito INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT UNSIGNED NULL,
    email VARCHAR(254) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_as_ci NOT NULL,
    nome VARCHAR(100) NULL,
    status ENUM('PENDENTE','ATIVO','DESCADASTRADO','BLOQUEADO')
        NOT NULL DEFAULT 'PENDENTE',
    origem VARCHAR(100) NOT NULL DEFAULT 'SITE',
    versao_termo VARCHAR(50) NOT NULL COMMENT 'Versao do texto de consentimento aceito',
    consentimento_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    confirmado_em DATETIME NULL,
    descadastrado_em DATETIME NULL,
    data_cadastro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_newsletter_inscritos_email (email),
    UNIQUE KEY uk_newsletter_inscritos_usuario (id_usuario),
    KEY idx_newsletter_inscritos_status (status, id_inscrito),
    CONSTRAINT chk_newsletter_inscritos_email CHECK (
        CHAR_LENGTH(TRIM(email)) > 0
    ),
    CONSTRAINT chk_newsletter_inscritos_termo CHECK (
        CHAR_LENGTH(TRIM(versao_termo)) > 0
    ),
    CONSTRAINT chk_newsletter_inscritos_confirmacao CHECK (
        status <> 'ATIVO' OR confirmado_em IS NOT NULL
    ),
    CONSTRAINT chk_newsletter_inscritos_descadastro CHECK (
        (status = 'DESCADASTRADO' AND descadastrado_em IS NOT NULL)
        OR (status <> 'DESCADASTRADO' AND descadastrado_em IS NULL)
    ),
    CONSTRAINT chk_newsletter_inscritos_datas CHECK (
        (confirmado_em IS NULL OR confirmado_em >= consentimento_em)
        AND (descadastrado_em IS NULL OR descadastrado_em >= consentimento_em)
    ),
    CONSTRAINT fk_newsletter_inscritos_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```
