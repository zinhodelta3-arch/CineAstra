-- O prazo vendido fica no item; alteracoes futuras de filmes nao encurtam o aluguel.
-- Itens historicos ficam NULL para revisao, sem inventar duracao contratada.
ALTER TABLE itens_pedido
    ADD COLUMN dias_acesso_aluguel_snapshot INT UNSIGNED NULL,
    ADD CONSTRAINT chk_item_aluguel_snapshot CHECK (
        dias_acesso_aluguel_snapshot IS NULL OR
        (tipo_streaming='ALUGUEL' AND dias_acesso_aluguel_snapshot BETWEEN 1 AND 36500)
    );
