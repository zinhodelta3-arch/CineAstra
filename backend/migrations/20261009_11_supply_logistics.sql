-- Tarefa 27: cada solicitação tem no máximo um envio; identidade e movimentos ficam rastreáveis.
-- Auditar previamente id_solicitacao duplicados em logistica; não aplicar em produção sem revisão.
ALTER TABLE logistica
    ADD COLUMN id_insumo_origem INT UNSIGNED NULL AFTER id_solicitacao,
    ADD COLUMN id_equipamento_origem INT UNSIGNED NULL AFTER id_insumo_origem,
    ADD COLUMN id_insumo_destino INT UNSIGNED NULL AFTER id_equipamento_origem,
    ADD COLUMN quantidade INT NULL AFTER id_insumo_destino,
    ADD COLUMN id_usuario_recebimento INT UNSIGNED NULL AFTER quantidade,
    ADD COLUMN data_devolucao DATETIME NULL AFTER id_usuario_recebimento,
    ADD COLUMN id_usuario_devolucao INT UNSIGNED NULL AFTER data_devolucao,
    ADD UNIQUE KEY uk_logistica_solicitacao (id_solicitacao),
    ADD CONSTRAINT fk_logistica_insumo_origem FOREIGN KEY (id_insumo_origem) REFERENCES insumos(id_insumo),
    ADD CONSTRAINT fk_logistica_equipamento_origem FOREIGN KEY (id_equipamento_origem) REFERENCES equipamentos(id_equipamento),
    ADD CONSTRAINT fk_logistica_insumo_destino FOREIGN KEY (id_insumo_destino) REFERENCES insumos(id_insumo),
    ADD CONSTRAINT fk_logistica_recebedor FOREIGN KEY (id_usuario_recebimento) REFERENCES usuarios(id_usuario),
    ADD CONSTRAINT fk_logistica_devolvedor FOREIGN KEY (id_usuario_devolucao) REFERENCES usuarios(id_usuario),
    ADD CONSTRAINT chk_logistica_identidade CHECK (id_solicitacao IS NULL OR (COALESCE(quantidade,0) > 0 AND ((id_insumo_origem IS NOT NULL AND id_equipamento_origem IS NULL) OR (id_insumo_origem IS NULL AND id_equipamento_origem IS NOT NULL))));

ALTER TABLE logistica
    MODIFY COLUMN status ENUM('PENDENTE','ENVIADO','EM_TRANSITO','RECEBIDO','CANCELADO','DEVOLVIDO') DEFAULT 'PENDENTE';

ALTER TABLE movimentacoes_estoque
    ADD COLUMN id_logistica INT UNSIGNED NULL AFTER id_reserva,
    ADD UNIQUE KEY uk_movestoque_logistica_tipo (id_logistica,tipo),
    ADD CONSTRAINT fk_movestoque_logistica FOREIGN KEY (id_logistica) REFERENCES logistica(id_logistica);
