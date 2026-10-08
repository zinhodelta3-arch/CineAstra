# equipe_membros

Referência por tabela; confira migrations aplicadas.

```sql
CREATE TABLE equipe_membros (
    id_equipe_membro INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_equipe INT UNSIGNED NOT NULL,
    id_usuario INT UNSIGNED NOT NULL,
    funcao VARCHAR(100),
    data_entrada DATE DEFAULT (CURRENT_DATE),
    status ENUM('ATIVO','INATIVO') DEFAULT 'ATIVO',
    UNIQUE KEY uk_equipe_usuario (id_equipe, id_usuario),
    CONSTRAINT fk_equipemembros_equipe FOREIGN KEY (id_equipe) REFERENCES equipes(id_equipe),
    CONSTRAINT fk_equipemembros_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);
```
