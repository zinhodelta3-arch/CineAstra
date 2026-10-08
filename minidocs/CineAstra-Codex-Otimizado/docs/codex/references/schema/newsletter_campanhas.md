# newsletter_campanhas

Referência por tabela; confira migrations aplicadas.

```sql
CREATE TABLE newsletter_campanhas (
    id_campanha INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_categoria INT UNSIGNED NOT NULL,
    nome VARCHAR(150) NOT NULL,
    assunto VARCHAR(200) NOT NULL,
    conteudo_html MEDIUMTEXT NOT NULL,
    conteudo_texto MEDIUMTEXT NULL,
    status ENUM('RASCUNHO','AGENDADA','ENVIANDO','CONCLUIDA','CANCELADA')
        NOT NULL DEFAULT 'RASCUNHO',
    agendada_para DATETIME NULL,
    iniciada_em DATETIME NULL,
    concluida_em DATETIME NULL,
    data_cadastro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_newsletter_campanhas_agendamento (status, agendada_para, id_campanha),
    CONSTRAINT chk_newsletter_campanhas_assunto CHECK (
        CHAR_LENGTH(TRIM(assunto)) > 0
    ),
    CONSTRAINT chk_newsletter_campanhas_agendada CHECK (
        status <> 'AGENDADA' OR agendada_para IS NOT NULL
    ),
    CONSTRAINT fk_newsletter_campanhas_categoria FOREIGN KEY (id_categoria)
        REFERENCES newsletter_categorias(id_categoria)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```
