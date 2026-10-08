# sessoes

Referência por tabela; confira migrations aplicadas.

```sql
CREATE TABLE sessoes (
    id_sessao INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_filme INT UNSIGNED NOT NULL,
    id_sala INT UNSIGNED NOT NULL,
    data DATE NOT NULL,
    horario_inicio TIME NOT NULL,
    horario_fim TIME NOT NULL,
    idioma ENUM('DUBLADO','LEGENDADO','ORIGINAL') DEFAULT 'DUBLADO',
    preco_inteira DECIMAL(10,2) NOT NULL COMMENT 'valor da meia-entrada = preco_inteira / 2',
    status ENUM('AGENDADA','EM_CARTAZ','ENCERRADA','CANCELADA') DEFAULT 'AGENDADA',
    CONSTRAINT chk_sessoes_preco CHECK (preco_inteira >= 0),
    CONSTRAINT fk_sessoes_filme FOREIGN KEY (id_filme) REFERENCES filmes(id_filme),
    CONSTRAINT fk_sessoes_sala FOREIGN KEY (id_sala) REFERENCES salas(id_sala)
);
```
