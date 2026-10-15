-- Serializa bootstrap e mudanças administrativas, preservando um ADMIN ativo.
-- Linha estável evita depender de lock de SELECT vazio durante bootstrap.
CREATE TABLE identity_admin_guard (
    id TINYINT UNSIGNED PRIMARY KEY,
    CONSTRAINT chk_identity_admin_guard CHECK (id = 1)
) ENGINE=InnoDB;
INSERT INTO identity_admin_guard (id) VALUES (1);
