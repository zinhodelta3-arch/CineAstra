-- Tarefa14/RF45: arquivamento preserva gêneros associados e o histórico.
-- A tabela original não possuía estado. Legados permanecem ativos.
ALTER TABLE generos ADD COLUMN status ENUM('ATIVO','INATIVO') NOT NULL DEFAULT 'ATIVO';
