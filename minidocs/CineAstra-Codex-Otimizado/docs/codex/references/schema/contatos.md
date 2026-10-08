# contatos

Referência por tabela; confira migrations aplicadas.

```sql
CREATE TABLE contatos (
    id_contato INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT UNSIGNED NOT NULL,
    tipo ENUM('TELEFONE','WHATSAPP','EMAIL_SECUNDARIO') NOT NULL,
    valor VARCHAR(150) NOT NULL,
    principal BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_contatos_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);
```
