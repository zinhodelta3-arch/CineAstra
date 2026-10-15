-- Ocupacao ativa separada dos itens historicos. Conexoes da API usam UTC.
CREATE TABLE assento_ocupacoes (
    id_ocupacao BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_sessao INT UNSIGNED NOT NULL,
    id_assento INT UNSIGNED NOT NULL,
    id_pedido BIGINT UNSIGNED NOT NULL,
    id_item BIGINT UNSIGNED NULL,
    estado ENUM('RESERVADA','CONFIRMADA') NOT NULL,
    expira_em DATETIME(3) NULL,
    criada_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE KEY uk_ocupacao_sessao_assento (id_sessao,id_assento),
    UNIQUE KEY uk_ocupacao_item (id_item),
    KEY ix_ocupacao_pedido (id_pedido),
    KEY ix_ocupacao_expira (estado,expira_em),
    CONSTRAINT fk_ocupacao_sessao FOREIGN KEY (id_sessao) REFERENCES sessoes(id_sessao),
    CONSTRAINT fk_ocupacao_assento FOREIGN KEY (id_assento) REFERENCES assentos(id_assento),
    CONSTRAINT fk_ocupacao_pedido FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido),
    CONSTRAINT fk_ocupacao_item FOREIGN KEY (id_item) REFERENCES itens_pedido(id_item),
    CONSTRAINT chk_ocupacao_estado CHECK ((estado='RESERVADA' AND expira_em IS NOT NULL AND id_item IS NULL) OR (estado='CONFIRMADA' AND expira_em IS NULL AND id_item IS NOT NULL))
) ENGINE=InnoDB;

INSERT INTO assento_ocupacoes (id_sessao,id_assento,id_pedido,id_item,estado,expira_em)
SELECT ip.id_sessao,ip.id_assento,ip.id_pedido,ip.id_item,'CONFIRMADA',NULL
FROM itens_pedido ip JOIN pedidos p ON p.id_pedido=ip.id_pedido
WHERE ip.id_sessao IS NOT NULL AND p.status IN ('PAGO','FINALIZADO');

INSERT INTO assento_ocupacoes (id_sessao,id_assento,id_pedido,id_item,estado,expira_em)
SELECT ip.id_sessao,ip.id_assento,ip.id_pedido,NULL,'RESERVADA',DATE_ADD(p.data_pedido,INTERVAL 15 MINUTE)
FROM itens_pedido ip JOIN pedidos p ON p.id_pedido=ip.id_pedido
WHERE ip.id_sessao IS NOT NULL AND p.status IN ('EM_ANDAMENTO','AGUARDANDO_PAGAMENTO')
  AND DATE_ADD(p.data_pedido,INTERVAL 15 MINUTE)>UTC_TIMESTAMP(3);

-- Mantem o indice de consulta/FK da sessao apos remover a UNIQUE antiga.
ALTER TABLE itens_pedido ADD KEY ix_itens_sessao_assento_historico (id_sessao,id_assento);

-- O runner valida a geometria e a cobertura do backfill antes de retirar o indice historico.
ALTER TABLE itens_pedido DROP INDEX uk_sessao_assento;
