-- Bounces e reclamações persistem mesmo se o inscrito já se descadastrou;
-- preservar descadastrado_em e impedir reinscrição/envio posteriores.
CREATE TABLE newsletter_bloqueios (
    id_inscrito INT UNSIGNED PRIMARY KEY,
    motivo ENUM('BOUNCE','COMPLAINT') NOT NULL,
    id_evento_provedor VARCHAR(255) NOT NULL,
    bloqueado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_newsletter_bloqueios_inscrito FOREIGN KEY (id_inscrito)
        REFERENCES newsletter_inscritos(id_inscrito) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
