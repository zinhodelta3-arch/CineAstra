# preferencias_usuario

Referência por tabela; confira migrations aplicadas.

```sql
CREATE TABLE preferencias_usuario (
    id_preferencia INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT UNSIGNED NOT NULL,
    tema ENUM('CLARO','ESCURO','SISTEMA') DEFAULT 'SISTEMA',
    tamanho_fonte ENUM('PEQUENO','MEDIO','GRANDE','MUITO_GRANDE') DEFAULT 'MEDIO',
    alto_contraste BOOLEAN DEFAULT FALSE,
    modo_acessibilidade BOOLEAN DEFAULT FALSE,
    idioma VARCHAR(10) DEFAULT 'pt-BR',
    UNIQUE KEY uk_preferencias_usuario (id_usuario),
    CONSTRAINT fk_preferencias_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);
```
