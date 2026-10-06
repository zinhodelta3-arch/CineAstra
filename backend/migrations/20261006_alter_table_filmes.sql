-- CINEASTRA - UPDATE V4: GALERIAS, REPRODUCAO E NEWSLETTER
-- Base: esquema v3 anexado. Requer MySQL 8.0.16+ e tabelas InnoDB.
-- Execute UMA VEZ, sobre o banco existente; nao e um script de recriacao.
-- Nao use --force: interrompa no primeiro erro. Em caso de falha parcial,
-- confira quais blocos foram aplicados antes de continuar.
-- DDL no MySQL faz commit implicito: nao existe rollback de todo este arquivo.
-- Execute em homologacao antes de producao e mantenha backup do banco.
-- As imagens alternativas sao opcionais: zero ou varias linhas na galeria.
-- Aqui, "produto" corresponde a insumos do esquema original; nao sao criadas
-- variantes comerciais, substituicoes de itens ou novas regras de estoque.

USE cineastra;
SET NAMES utf8mb4;

-- ============================================================================
-- BLOCO 16 - LINK DE REPRODUCAO DO FILME
-- ============================================================================
-- trailer continua sendo o trailer. url_reproducao e o video completo.
-- Guarde URL estavel ou endereco do manifesto HLS/DASH; URLs assinadas e
-- temporarias devem ser geradas pelo backend apos validar acessos_streaming.
-- Nao exponha este campo em endpoints publicos do catalogo.

ALTER TABLE filmes
    ADD COLUMN url_reproducao VARCHAR(2048) NULL
        COMMENT 'URL estavel do video completo ou manifesto HLS/DASH'
        AFTER trailer,
    ADD CONSTRAINT chk_filmes_url_reproducao CHECK (
        url_reproducao IS NULL OR CHAR_LENGTH(TRIM(url_reproducao)) > 0
    );

-- ============================================================================
-- BLOCO 17 - IMAGENS DOS FILMES
-- ============================================================================
-- Uma linha por imagem. Permite varias capas, banners e imagens alternativas.
-- principal=1 seleciona a imagem preferida de cada tipo para a interface.
-- UNIQUE + coluna gerada garante no maximo uma principal por filme/tipo.
-- principal=0 produz NULL, permitindo varias imagens secundarias.
-- Nao escreva em tipo_principal: e uma coluna calculada pelo banco.

CREATE TABLE filmes_imagens (
    id_imagem BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_filme INT UNSIGNED NOT NULL,
    tipo ENUM('CAPA','BANNER','ALTERNATIVA') NOT NULL DEFAULT 'ALTERNATIVA',
    url VARCHAR(2048) NOT NULL,
    texto_alternativo VARCHAR(255) NULL,
    ordem INT UNSIGNED NOT NULL DEFAULT 0,
    principal BOOLEAN NOT NULL DEFAULT FALSE,
    tipo_principal VARCHAR(20) GENERATED ALWAYS AS (
        CASE WHEN principal = 1 THEN tipo ELSE NULL END
    ) STORED,
    data_cadastro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_filmes_imagens_principal (id_filme, tipo_principal),
    KEY idx_filmes_imagens_galeria (id_filme, tipo, ordem, id_imagem),
    CONSTRAINT chk_filmes_imagens_url CHECK (CHAR_LENGTH(TRIM(url)) > 0),
    CONSTRAINT chk_filmes_imagens_principal CHECK (principal IN (0, 1)),
    CONSTRAINT fk_filmes_imagens_filme FOREIGN KEY (id_filme)
        REFERENCES filmes(id_filme) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Preserva e copia a imagem antiga como capa principal.
-- A coluna filmes.imagem permanece para compatibilidade com o codigo atual.
-- A partir da migracao, a aplicacao deve ler/gravar em filmes_imagens.
-- Nao ha sincronizacao automatica entre a coluna antiga e a nova galeria.

INSERT INTO filmes_imagens (id_filme, tipo, url, texto_alternativo, principal)
SELECT id_filme, 'CAPA', TRIM(imagem), CONCAT('Capa de ', titulo), TRUE
FROM filmes
WHERE imagem IS NOT NULL AND CHAR_LENGTH(TRIM(imagem)) > 0;

-- ============================================================================
-- BLOCO 18 - IMAGENS DOS INSUMOS/PRODUTOS
-- ============================================================================
-- PRINCIPAL e a imagem do card; ALTERNATIVA cobre outras fotos/angulos.
-- No maximo uma principal por insumo; alternativas nao tem limite fixo.
-- Nenhuma imagem e obrigatoria. Nao escreva em slot_principal.

CREATE TABLE insumos_imagens (
    id_imagem BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_insumo INT UNSIGNED NOT NULL,
    tipo ENUM('PRINCIPAL','ALTERNATIVA') NOT NULL DEFAULT 'ALTERNATIVA',
    url VARCHAR(2048) NOT NULL,
    texto_alternativo VARCHAR(255) NULL,
    ordem INT UNSIGNED NOT NULL DEFAULT 0,
    slot_principal TINYINT GENERATED ALWAYS AS (
        CASE WHEN tipo = 'PRINCIPAL' THEN 1 ELSE NULL END
    ) STORED,
    data_cadastro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_insumos_imagens_principal (id_insumo, slot_principal),
    KEY idx_insumos_imagens_galeria (id_insumo, tipo, ordem, id_imagem),
    CONSTRAINT chk_insumos_imagens_url CHECK (CHAR_LENGTH(TRIM(url)) > 0),
    CONSTRAINT fk_insumos_imagens_insumo FOREIGN KEY (id_insumo)
        REFERENCES insumos(id_insumo) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- BLOCO 19 - IMAGENS DOS COMBOS
-- ============================================================================
-- As fotos do combo sao independentes das fotos dos insumos que o compoem.

CREATE TABLE combos_imagens (
    id_imagem BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_combo INT UNSIGNED NOT NULL,
    tipo ENUM('PRINCIPAL','ALTERNATIVA') NOT NULL DEFAULT 'ALTERNATIVA',
    url VARCHAR(2048) NOT NULL,
    texto_alternativo VARCHAR(255) NULL,
    ordem INT UNSIGNED NOT NULL DEFAULT 0,
    slot_principal TINYINT GENERATED ALWAYS AS (
        CASE WHEN tipo = 'PRINCIPAL' THEN 1 ELSE NULL END
    ) STORED,
    data_cadastro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_combos_imagens_principal (id_combo, slot_principal),
    KEY idx_combos_imagens_galeria (id_combo, tipo, ordem, id_imagem),
    CONSTRAINT chk_combos_imagens_url CHECK (CHAR_LENGTH(TRIM(url)) > 0),
    CONSTRAINT fk_combos_imagens_combo FOREIGN KEY (id_combo)
        REFERENCES combos(id_combo) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- BLOCO 20 - INSCRITOS NA NEWSLETTER
-- ============================================================================
-- id_usuario vincula uma conta existente. NULL permite cadastro so com email.
-- Nao inscreva automaticamente todos os usuarios; registre a escolha expressa.
-- A aplicacao valida o email e normaliza espacos/caixa conforme sua politica.
-- Email alterado precisa de nova confirmacao; ele nao acompanha usuarios.email
-- automaticamente. A collation abaixo distingue acentos, mas ignora caixa.

CREATE TABLE newsletter_inscritos (
    id_inscrito INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT UNSIGNED NULL,
    email VARCHAR(254) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_as_ci NOT NULL,
    nome VARCHAR(100) NULL,
    status ENUM('PENDENTE','ATIVO','DESCADASTRADO','BLOQUEADO')
        NOT NULL DEFAULT 'PENDENTE',
    origem VARCHAR(100) NOT NULL DEFAULT 'SITE',
    versao_termo VARCHAR(50) NOT NULL COMMENT 'Versao do texto de consentimento aceito',
    consentimento_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    confirmado_em DATETIME NULL,
    descadastrado_em DATETIME NULL,
    data_cadastro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_newsletter_inscritos_email (email),
    UNIQUE KEY uk_newsletter_inscritos_usuario (id_usuario),
    KEY idx_newsletter_inscritos_status (status, id_inscrito),
    CONSTRAINT chk_newsletter_inscritos_email CHECK (
        CHAR_LENGTH(TRIM(email)) > 0
    ),
    CONSTRAINT chk_newsletter_inscritos_termo CHECK (
        CHAR_LENGTH(TRIM(versao_termo)) > 0
    ),
    CONSTRAINT chk_newsletter_inscritos_confirmacao CHECK (
        status <> 'ATIVO' OR confirmado_em IS NOT NULL
    ),
    CONSTRAINT chk_newsletter_inscritos_descadastro CHECK (
        (status = 'DESCADASTRADO' AND descadastrado_em IS NOT NULL)
        OR (status <> 'DESCADASTRADO' AND descadastrado_em IS NULL)
    ),
    CONSTRAINT chk_newsletter_inscritos_datas CHECK (
        (confirmado_em IS NULL OR confirmado_em >= consentimento_em)
        AND (descadastrado_em IS NULL OR descadastrado_em >= consentimento_em)
    ),
    CONSTRAINT fk_newsletter_inscritos_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- BLOCO 21 - CATEGORIAS E PREFERENCIAS INDIVIDUAIS
-- ============================================================================
-- Uma categoria por assunto; novas categorias podem ser adicionadas por INSERT.
-- Ausencia de preferencia OU aceita=0 significa nao receber aquela categoria.
-- Aceitar PROMOCOES nao implica aceitar LANCAMENTOS ou NOVIDADES.

CREATE TABLE newsletter_categorias (
    id_categoria INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
    nome VARCHAR(100) NOT NULL,
    descricao VARCHAR(255) NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT chk_newsletter_categorias_ativo CHECK (ativo IN (0, 1)),
    CONSTRAINT chk_newsletter_categorias_codigo CHECK (
        CHAR_LENGTH(TRIM(codigo)) > 0
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO newsletter_categorias (codigo, nome, descricao) VALUES
    ('PROMOCOES', 'Promocoes', 'Descontos, cupons e ofertas de produtos e combos'),
    ('LANCAMENTOS', 'Lancamentos', 'Estreias de filmes e novos titulos no streaming'),
    ('NOVIDADES', 'Novidades', 'Noticias, eventos e novidades gerais do Cineastra');

CREATE TABLE newsletter_preferencias (
    id_inscrito INT UNSIGNED NOT NULL,
    id_categoria INT UNSIGNED NOT NULL,
    aceita BOOLEAN NOT NULL DEFAULT FALSE,
    atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_inscrito, id_categoria),
    KEY idx_newsletter_preferencias_publico (id_categoria, aceita, id_inscrito),
    CONSTRAINT chk_newsletter_preferencias_aceita CHECK (aceita IN (0, 1)),
    CONSTRAINT fk_newsletter_preferencias_inscrito FOREIGN KEY (id_inscrito)
        REFERENCES newsletter_inscritos(id_inscrito) ON DELETE CASCADE,
    CONSTRAINT fk_newsletter_preferencias_categoria FOREIGN KEY (id_categoria)
        REFERENCES newsletter_categorias(id_categoria)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- BLOCO 22 - TOKENS DE CONFIRMACAO E DESCADASTRO
-- ============================================================================
-- Gere o token no backend com crypto.randomBytes(32). Envie o token puro no
-- link e armazene APENAS seu SHA-256 binario (32 bytes). Nao use IDs sequenciais
-- nem email como token. Valide finalidade, expiracao e utilizado_em.
-- Confirmacao: enviar email transacional mesmo enquanto status=PENDENTE.
-- Descadastro: oferecer link em cada campanha e opcao na conta autenticada.

CREATE TABLE newsletter_tokens (
    id_token BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_inscrito INT UNSIGNED NOT NULL,
    finalidade ENUM('CONFIRMACAO','DESCADASTRO') NOT NULL,
    token_hash BINARY(32) NOT NULL,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expira_em DATETIME NOT NULL,
    utilizado_em DATETIME NULL,
    UNIQUE KEY uk_newsletter_tokens_hash (token_hash),
    KEY idx_newsletter_tokens_inscrito (id_inscrito, finalidade, utilizado_em),
    KEY idx_newsletter_tokens_expiracao (expira_em),
    CONSTRAINT chk_newsletter_tokens_expiracao CHECK (expira_em > criado_em),
    CONSTRAINT chk_newsletter_tokens_utilizacao CHECK (
        utilizado_em IS NULL OR utilizado_em >= criado_em
    ),
    CONSTRAINT fk_newsletter_tokens_inscrito FOREIGN KEY (id_inscrito)
        REFERENCES newsletter_inscritos(id_inscrito) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- BLOCO 23 - CAMPANHAS E FILA/HISTORICO DE ENVIOS
-- ============================================================================
-- Cada campanha tem seu proprio assunto, conteudo e categoria de destinatarios.
-- O banco registra a fila; SMTP/API e agendamento sao implementados no backend.

CREATE TABLE newsletter_campanhas (
    id_campanha INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_categoria INT UNSIGNED NOT NULL,
    nome VARCHAR(150) NOT NULL,
    assunto VARCHAR(200) NOT NULL,
    conteudo_html MEDIUMTEXT NOT NULL,
    conteudo_texto MEDIUMTEXT NULL,
    status ENUM('RASCUNHO','AGENDADA','ENVIANDO','CONCLUIDA','CANCELADA')
        NOT NULL DEFAULT 'RASCUNHO',
    agendada_para DATETIME NULL,
    iniciada_em DATETIME NULL,
    concluida_em DATETIME NULL,
    data_cadastro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_newsletter_campanhas_agendamento (status, agendada_para, id_campanha),
    CONSTRAINT chk_newsletter_campanhas_assunto CHECK (
        CHAR_LENGTH(TRIM(assunto)) > 0
    ),
    CONSTRAINT chk_newsletter_campanhas_agendada CHECK (
        status <> 'AGENDADA' OR agendada_para IS NOT NULL
    ),
    CONSTRAINT fk_newsletter_campanhas_categoria FOREIGN KEY (id_categoria)
        REFERENCES newsletter_categorias(id_categoria)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE newsletter_envios (
    id_envio BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_campanha INT UNSIGNED NOT NULL,
    id_inscrito INT UNSIGNED NOT NULL,
    status ENUM('PENDENTE','PROCESSANDO','ENVIADO','FALHOU','CANCELADO')
        NOT NULL DEFAULT 'PENDENTE',
    tentativas INT UNSIGNED NOT NULL DEFAULT 0,
    ultima_tentativa_em DATETIME NULL,
    processando_desde DATETIME NULL COMMENT 'Permite recuperar jobs abandonados',
    enviado_em DATETIME NULL,
    id_mensagem_provedor VARCHAR(255) NULL,
    ultimo_erro TEXT NULL,
    data_cadastro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_newsletter_envios_destinatario (id_campanha, id_inscrito),
    KEY idx_newsletter_envios_fila (status, id_campanha, id_envio),
    KEY idx_newsletter_envios_recuperacao (status, processando_desde),
    CONSTRAINT chk_newsletter_envios_enviado CHECK (
        status <> 'ENVIADO' OR enviado_em IS NOT NULL
    ),
    CONSTRAINT chk_newsletter_envios_processando CHECK (
        status <> 'PROCESSANDO' OR processando_desde IS NOT NULL
    ),
    CONSTRAINT fk_newsletter_envios_campanha FOREIGN KEY (id_campanha)
        REFERENCES newsletter_campanhas(id_campanha),
    CONSTRAINT fk_newsletter_envios_inscrito FOREIGN KEY (id_inscrito)
        REFERENCES newsletter_inscritos(id_inscrito) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- BLOCO 24 - EXEMPLOS DE USO (COMENTADOS; NAO EXECUTAM NA MIGRACAO)
-- ============================================================================
-- Troque ? por parametros do driver mysql2; nao concatene valores do usuario.

-- A. Cadastrar banner e imagens alternativas de um filme:
-- INSERT INTO filmes_imagens
--     (id_filme, tipo, url, texto_alternativo, ordem, principal)
-- VALUES
--     (?, 'BANNER', ?, ?, 0, TRUE),
--     (?, 'ALTERNATIVA', ?, ?, 1, FALSE),
--     (?, 'ALTERNATIVA', ?, ?, 2, FALSE);

-- B. Galeria do filme, ordenada; dados de video ficam em rota autorizada:
-- SELECT id_imagem, tipo, url, texto_alternativo, principal, ordem
-- FROM filmes_imagens WHERE id_filme = ?
-- ORDER BY tipo, principal DESC, ordem, id_imagem;

-- C. Principal + varias imagens opcionais de um produto:
-- INSERT INTO insumos_imagens (id_insumo, tipo, url, texto_alternativo, ordem)
-- VALUES (?, 'PRINCIPAL', ?, ?, 0),
--        (?, 'ALTERNATIVA', ?, ?, 1),
--        (?, 'ALTERNATIVA', ?, ?, 2);

-- D. Galeria do combo:
-- SELECT id_imagem, tipo, url, texto_alternativo, ordem
-- FROM combos_imagens WHERE id_combo = ?
-- ORDER BY (tipo = 'PRINCIPAL') DESC, ordem, id_imagem;

-- E. Link de reproducao (exige autorizacao no backend):
-- UPDATE filmes SET url_reproducao = ? WHERE id_filme = ?;

-- F. Nova inscricao: so depois do aceite expresso; fazer tudo na mesma conexao.
-- START TRANSACTION;
-- INSERT INTO newsletter_inscritos (id_usuario, email, nome, versao_termo)
-- VALUES (?, ?, ?, ?);
-- SET @novo_inscrito = LAST_INSERT_ID();
-- INSERT INTO newsletter_preferencias (id_inscrito, id_categoria, aceita)
-- SELECT @novo_inscrito, id_categoria, TRUE
-- FROM newsletter_categorias
-- WHERE ativo = TRUE AND codigo IN ('PROMOCOES', 'LANCAMENTOS');
-- -- O exemplo aceita SOMENTE as duas categorias explicitamente selecionadas.
-- INSERT INTO newsletter_tokens (id_inscrito, finalidade, token_hash, expira_em)
-- VALUES (@novo_inscrito, 'CONFIRMACAO', ?, DATE_ADD(NOW(), INTERVAL 24 HOUR));
-- COMMIT;
-- -- Backend envia o link de confirmacao; ainda nao ha envio de campanhas.
-- -- Email ja existente: trate o erro UNIQUE. Nunca reative automaticamente
-- -- um descadastrado com ON DUPLICATE KEY UPDATE status='ATIVO'.

-- G. Confirmar inscricao com seguranca:
-- -- 1. Abra transacao; localize o id_inscrito pelo token_hash parametrizado.
-- -- 2. Bloqueie newsletter_inscritos com SELECT ... FOR UPDATE.
-- -- 3. Bloqueie/revalide o token com SELECT ... FOR UPDATE: CONFIRMACAO,
-- --    utilizado_em IS NULL e expira_em > NOW(). Exija inscrito PENDENTE.
-- -- 4. Marque token utilizado_em=NOW(), mude inscrito para ATIVO,
-- --    confirmado_em=NOW(), descadastrado_em=NULL; invalide outros tokens
-- --    de confirmacao do inscrito e COMMIT. Sem token valido: ROLLBACK.
-- -- Use a mesma ordem de locks (inscrito antes de token) em todos os fluxos.

-- H. Alterar preferencias (conta autenticada ou link de gestao autorizado):
-- UPDATE newsletter_preferencias
-- SET aceita = ? WHERE id_inscrito = ? AND id_categoria = ?;
-- -- Se a preferencia nao existir, INSERT na mesma transacao; ausencia = recusa.

-- I. Descadastro global (apos autorizar conta/token):
-- START TRANSACTION;
-- SELECT id_inscrito FROM newsletter_inscritos WHERE id_inscrito = ? FOR UPDATE;
-- UPDATE newsletter_inscritos
-- SET status = 'DESCADASTRADO', descadastrado_em = NOW()
-- WHERE id_inscrito = ?;
-- UPDATE newsletter_tokens SET utilizado_em = NOW()
-- WHERE id_inscrito = ? AND utilizado_em IS NULL;
-- UPDATE newsletter_envios SET status = 'CANCELADO'
-- WHERE id_inscrito = ? AND status IN ('PENDENTE', 'FALHOU');
-- COMMIT;
-- -- Nao e necessario apagar as preferencias: status desativa todas.
-- -- Reinscricao exige novo aceite, status PENDENTE, confirmado_em=NULL,
-- -- descadastrado_em=NULL, tokens antigos invalidados e redefinicao das
-- -- preferencias pelas novas escolhas; depois, nova confirmacao por email.

-- J. Selecionar destinatarios de uma campanha, respeitando a categoria:
-- SELECT ni.id_inscrito, ni.email, ni.nome
-- FROM newsletter_campanhas nc
-- JOIN newsletter_categorias cat ON cat.id_categoria = nc.id_categoria
-- JOIN newsletter_preferencias np ON np.id_categoria = cat.id_categoria
-- JOIN newsletter_inscritos ni ON ni.id_inscrito = np.id_inscrito
-- WHERE nc.id_campanha = ? AND ni.status = 'ATIVO'
--   AND ni.confirmado_em IS NOT NULL AND np.aceita = TRUE AND cat.ativo = TRUE;

-- K. Enfileirar sem criar outra linha para o mesmo destinatario/campanha:
-- INSERT INTO newsletter_envios (id_campanha, id_inscrito)
-- SELECT nc.id_campanha, ni.id_inscrito
-- FROM newsletter_campanhas nc
-- JOIN newsletter_categorias cat ON cat.id_categoria = nc.id_categoria
-- JOIN newsletter_preferencias np ON np.id_categoria = cat.id_categoria
-- JOIN newsletter_inscritos ni ON ni.id_inscrito = np.id_inscrito
-- WHERE nc.id_campanha = ? AND nc.status = 'ENVIANDO'
--   AND cat.ativo = TRUE AND np.aceita = TRUE
--   AND ni.status = 'ATIVO' AND ni.confirmado_em IS NOT NULL
-- ON DUPLICATE KEY UPDATE id_envio = newsletter_envios.id_envio;
-- -- O conflito nao altera status nem reenvia mensagem ja enviada.

-- ============================================================================
-- BLOCO 25 - INTEGRACAO E VERIFICACAO
-- ============================================================================
-- IMAGENS:
-- * Guarde arquivos no storage/CDN e grave URLs no banco; upload e exclusao
--   dos arquivos sao responsabilidade da aplicacao. CASCADE apaga so as linhas.
-- * Para trocar a principal, bloqueie a linha pai com SELECT ... FOR UPDATE;
--   desmarque a antiga, marque a nova e COMMIT. Insumos/combos: mude o tipo
--   da antiga para ALTERNATIVA antes de promover a nova para PRINCIPAL.
-- * Todas as rotinas de escrita da mesma galeria devem seguir esse bloqueio.
-- * Valide tipo MIME, tamanho e URL no backend; as CHECKs rejeitam so vazios.
-- * Atualize os endpoints antigos para usar as galerias. Se ainda existirem
--   consumidores de filmes.imagem, atualize esse campo junto da nova capa
--   na mesma transacao ate concluir a transicao.
-- NEWSLETTER:
-- * Um worker executa SMTP/API; SELECT ... FOR UPDATE SKIP LOCKED pode reservar
--   linhas da fila em transacoes curtas. Nao mantenha lock durante envio HTTP.
-- * Revalide status ATIVO, categoria ativa, aceita=1 e campanha ENVIANDO
--   imediatamente antes de enviar; houve descadastro? Cancele o job.
-- * Uma mensagem ja aceita pelo provedor pode chegar apos o descadastro.
-- * Unique impede duplicar a fila, nao garante envio externo exatamente uma
--   vez: use id_envio como chave de idempotencia se o provedor oferecer suporte.
-- * Defina limite de tentativas, backoff e recuperacao de jobs PROCESSANDO
--   abandonados; utilize processando_desde e ultima_tentativa_em.
-- * Bounces permanentes/reclamacoes devem bloquear a inscricao no backend.
-- * Expurgue tokens vencidos/utilizados periodicamente. Saneie o HTML no painel.
-- VERIFICACOES EM HOMOLOGACAO:
-- * Confira que cada filmes.imagem nao vazia aparece como CAPA principal.
-- * Insira duas alternativas no mesmo produto/combo: ambas devem ser aceitas.
-- * Uma segunda principal no mesmo produto/combo ou filme/tipo deve falhar.
-- * Uma inscricao PENDENTE/sem preferencia nunca entra no publico de campanha.
-- * Aceitar so PROMOCOES nunca seleciona LANCAMENTOS/NOVIDADES.
-- * Confirme que descadastro cancela pendencias e que o worker o revalida.
-- * Confirme que reutilizar token/usar token vencido nao ativa a inscricao.
-- Referencias tecnicas:
-- https://dev.mysql.com/doc/refman/8.0/en/create-table-generated-columns.html
-- https://dev.mysql.com/doc/refman/8.0/en/create-index.html
-- https://dev.mysql.com/doc/refman/8.0/en/implicit-commit.html
