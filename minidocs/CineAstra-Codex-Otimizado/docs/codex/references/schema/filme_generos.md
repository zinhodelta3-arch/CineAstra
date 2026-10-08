# filme_generos

Referência por tabela; confira migrations aplicadas.

```sql
CREATE TABLE filme_generos (
    id_filme INT UNSIGNED NOT NULL,
    id_genero INT UNSIGNED NOT NULL,
    PRIMARY KEY (id_filme, id_genero),
    CONSTRAINT fk_filmegen_filme FOREIGN KEY (id_filme) REFERENCES filmes(id_filme) ON DELETE CASCADE,
    CONSTRAINT fk_filmegen_genero FOREIGN KEY (id_genero) REFERENCES generos(id_genero) ON DELETE CASCADE
);
```
