# chamados

Referência por tabela; confira migrations aplicadas.

```sql
CREATE TABLE chamados (
    id_chamado INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_criador INT UNSIGNED NOT NULL,
    id_responsavel INT UNSIGNED,
    id_sessao INT UNSIGNED,
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT,
    prioridade ENUM('BAIXA','MEDIA','ALTA','URGENTE') DEFAULT 'MEDIA',
    status ENUM('ABERTO','EM_ANDAMENTO','RESOLVIDO','FECHADO') DEFAULT 'ABERTO',
    data_abertura DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_fechamento DATETIME,
    CONSTRAINT fk_chamados_criador FOREIGN KEY (id_criador) REFERENCES usuarios(id_usuario),
    CONSTRAINT fk_chamados_responsavel FOREIGN KEY (id_responsavel) REFERENCES usuarios(id_usuario),
    CONSTRAINT fk_chamados_sessao FOREIGN KEY (id_sessao) REFERENCES sessoes(id_sessao)
);
```
