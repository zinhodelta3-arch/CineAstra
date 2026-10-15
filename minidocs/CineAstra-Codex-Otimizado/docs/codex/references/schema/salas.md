# salas

Referência por tabela; confira migrations aplicadas.

```sql
CREATE TABLE salas (
    id_sala INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_local INT UNSIGNED NOT NULL,
    nome VARCHAR(100) NOT NULL,
    capacidade INT NOT NULL,
    tipo ENUM('2D','3D','4DX','VIP','IMAX') DEFAULT '2D',
    status ENUM('ATIVA','MANUTENCAO','INATIVA') DEFAULT 'ATIVA',
    UNIQUE KEY uk_sala_local_nome (id_local, nome),
    CONSTRAINT chk_salas_capacidade CHECK (capacidade > 0),
    CONSTRAINT fk_salas_local FOREIGN KEY (id_local) REFERENCES locais(id_local)
);
```
