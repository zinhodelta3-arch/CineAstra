# assinaturas

Referência por tabela; confira migrations aplicadas.

```sql
CREATE TABLE assinaturas (
    id_assinatura INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT UNSIGNED NOT NULL COMMENT 'titular da assinatura',
    id_plano INT UNSIGNED NOT NULL,
    inicio DATE NOT NULL,
    fim DATE,
    periodicidade ENUM('MENSAL','ANUAL') NOT NULL,
    tipo_divisao ENUM('TITULAR_PAGA','DIVISAO_IGUAL') NOT NULL DEFAULT 'TITULAR_PAGA',
    status ENUM('ATIVA','CANCELADA','EXPIRADA','PENDENTE') DEFAULT 'ATIVA',
    renovacao_automatica BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_assinaturas_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    CONSTRAINT fk_assinaturas_plano FOREIGN KEY (id_plano) REFERENCES planos(id_plano)
);
```
