-- Tarefa 24: o combo precisa de local para validar sua composição.
-- Nullable preserva combos legados sem local; eles não são publicados até saneamento explícito.
ALTER TABLE combos
    ADD COLUMN id_local INT UNSIGNED NULL AFTER id_combo,
    ADD KEY idx_combos_local_ativo (id_local, ativo, id_combo),
    ADD CONSTRAINT fk_combos_local FOREIGN KEY (id_local) REFERENCES locais(id_local);
