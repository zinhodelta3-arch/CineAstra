-- Historico append-only de portaria. A linha do ticket e bloqueada antes de cada transicao.
-- Ator NULL e permitido somente para fatos legados anteriores a esta migration.
CREATE TABLE ticket_passagens (
    id_passagem BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_ticket BIGINT UNSIGNED NOT NULL,
    tipo ENUM('ENTRADA','SAIDA') NOT NULL,
    ocorrido_em DATETIME(3) NOT NULL,
    id_usuario_staff INT UNSIGNED NULL,
    meia_comprovacao ENUM('CIE','PCD','ID_JOVEM','IDOSO') NULL,
    CONSTRAINT fk_passagem_ticket FOREIGN KEY (id_ticket) REFERENCES tickets(id_ticket),
    CONSTRAINT fk_passagem_staff FOREIGN KEY (id_usuario_staff) REFERENCES usuarios(id_usuario),
    KEY ix_passagem_ticket_ultima (id_ticket,id_passagem)
);

-- Preserva consumo e saida historicos sem supor que UTILIZADO significa presenca atual.
INSERT INTO ticket_passagens(id_ticket,tipo,ocorrido_em,id_usuario_staff,meia_comprovacao)
SELECT id_ticket,'ENTRADA',COALESCE(data_utilizacao,data_geracao,UTC_TIMESTAMP(3)),conferido_por,meia_comprovacao
FROM tickets WHERE tipo='INGRESSO_SESSAO' AND status='UTILIZADO';

INSERT INTO ticket_passagens(id_ticket,tipo,ocorrido_em,id_usuario_staff)
SELECT id_ticket,'SAIDA',saida_em,saida_por
FROM tickets WHERE tipo='INGRESSO_SESSAO' AND status='UTILIZADO' AND saida_em IS NOT NULL;
