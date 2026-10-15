# suporte

Referência por tabela; confira migrations aplicadas.

```sql
CREATE TABLE suporte (
    id_suporte INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT UNSIGNED NOT NULL,
    id_atendente INT UNSIGNED,
    assunto VARCHAR(150) NOT NULL,
    mensagem TEXT NOT NULL,
    resposta TEXT,
    status ENUM('ABERTO','EM_ATENDIMENTO','RESOLVIDO','FECHADO') DEFAULT 'ABERTO',
    data_abertura DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_fechamento DATETIME,
    CONSTRAINT fk_suporte_cliente FOREIGN KEY (id_cliente) REFERENCES usuarios(id_usuario),
    CONSTRAINT fk_suporte_atendente FOREIGN KEY (id_atendente) REFERENCES usuarios(id_usuario)
);
```
