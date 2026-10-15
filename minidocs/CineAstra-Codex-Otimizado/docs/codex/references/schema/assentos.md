# assentos

Referência por tabela; confira migrations aplicadas.

```sql
CREATE TABLE assentos (
    id_assento INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_sala INT UNSIGNED NOT NULL,
    fileira VARCHAR(5) NOT NULL,
    numero INT NOT NULL,
    tipo ENUM('COMUM','PCD','OBESO','IDOSO','CASAL') DEFAULT 'COMUM' COMMENT 'PCD/OBESO/IDOSO cobrem a NFR de acessibilidade',
    status ENUM('ATIVA','INATIVA') DEFAULT 'ATIVA',
    UNIQUE KEY uk_assento_sala (id_sala, fileira, numero),
    CONSTRAINT chk_assentos_numero CHECK (numero > 0),
    CONSTRAINT fk_assentos_sala FOREIGN KEY (id_sala) REFERENCES salas(id_sala)
);
```
