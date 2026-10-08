# convites_plano

Referência por tabela; confira migrations aplicadas.

```sql
CREATE TABLE convites_plano (
    id_convite INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_assinatura INT UNSIGNED NOT NULL,
    id_usuario_convidado INT UNSIGNED NOT NULL,
    status ENUM('PENDENTE','ACEITO','RECUSADO','EXPIRADO') DEFAULT 'PENDENTE',
    data_convite DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_resposta DATETIME,
    UNIQUE KEY uk_assinatura_convidado (id_assinatura, id_usuario_convidado),
    CONSTRAINT fk_convitesplano_assinatura FOREIGN KEY (id_assinatura) REFERENCES assinaturas(id_assinatura),
    CONSTRAINT fk_convitesplano_usuario FOREIGN KEY (id_usuario_convidado) REFERENCES usuarios(id_usuario)
);
```
