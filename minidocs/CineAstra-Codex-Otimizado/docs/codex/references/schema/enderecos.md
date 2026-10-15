# enderecos

Referência por tabela; confira migrations aplicadas.

```sql
CREATE TABLE enderecos (
    id_endereco INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT UNSIGNED NOT NULL,
    cep VARCHAR(10),
    logradouro VARCHAR(150),
    numero VARCHAR(20),
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    estado VARCHAR(2),
    principal BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_enderecos_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);
```
