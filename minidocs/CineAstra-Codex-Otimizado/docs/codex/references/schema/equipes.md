# equipes

Referência por tabela; confira migrations aplicadas.

```sql
CREATE TABLE equipes (
    id_equipe INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_supervisor INT UNSIGNED NOT NULL,
    id_sessao INT UNSIGNED NOT NULL,
    nome VARCHAR(100) NOT NULL,
    status ENUM('ATIVA','FINALIZADA','CANCELADA') DEFAULT 'ATIVA',
    CONSTRAINT fk_equipes_supervisor FOREIGN KEY (id_supervisor) REFERENCES usuarios(id_usuario),
    CONSTRAINT fk_equipes_sessao FOREIGN KEY (id_sessao) REFERENCES sessoes(id_sessao)
);
```
