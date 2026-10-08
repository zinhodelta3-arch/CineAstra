# assinatura_cobrancas

Referência por tabela; confira migrations aplicadas.

```sql
CREATE TABLE assinatura_cobrancas (
    id_cobranca BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_assinatura INT UNSIGNED NOT NULL,
    id_usuario INT UNSIGNED NOT NULL COMMENT 'responsável por esta fração da cobrança',
    competencia DATE NOT NULL COMMENT 'mês/ano de referência (usar sempre dia 01)',
    valor_devido DECIMAL(10,2) NOT NULL,
    valor_multa_aplicada DECIMAL(10,2) DEFAULT 0.00,
    status ENUM('PENDENTE','PAGO','ATRASADO','ISENTO') DEFAULT 'PENDENTE',
    data_vencimento DATE NOT NULL,
    data_pagamento DATETIME,
    UNIQUE KEY uk_cobranca_competencia (id_assinatura, id_usuario, competencia),
    CONSTRAINT chk_cobrancas_valores CHECK (valor_devido >= 0 AND valor_multa_aplicada >= 0),
    CONSTRAINT fk_cobrancas_assinatura FOREIGN KEY (id_assinatura) REFERENCES assinaturas(id_assinatura),
    CONSTRAINT fk_cobrancas_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);
```
