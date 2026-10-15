-- Separar autorização de preferências do token que só permite descadastro.
ALTER TABLE newsletter_tokens
    MODIFY COLUMN finalidade ENUM('CONFIRMACAO','DESCADASTRO','GESTAO') NOT NULL;
