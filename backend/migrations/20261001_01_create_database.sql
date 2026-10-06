-- ================================================================================
-- CINEASTRA - BANCO DE DADOS (VERSAO 3 - SAUDE DE LONGO PRAZO)
-- ================================================================================
-- Blocos numerados (01, 02, 03...) na ordem de dependência de FOREIGN KEY, para
-- virarem migrations separadas. Requer MySQL 8.0.16+ (CHECK CONSTRAINT).

-- ----------------------------------------------------------------------
-- BLOCO 00 - DECISOES DE CAPACIDADE (LEIA ANTES DE APLICAR)
-- ----------------------------------------------------------------------
-- Em relação à v2, esta versão corrige riscos de ESGOTAMENTO em produção:

-- 1) INT (mesmo UNSIGNED) estoura em ~4,29 bilhões de linhas. Tabelas que
--    recebem uma linha por VENDA/EVENTO em alta frequência foram promovidas
--    para BIGINT UNSIGNED, pois nunca são podadas e crescem indefinidamente:
--        pedidos, itens_pedido, tickets, pagamentos,
--        movimentacoes_estoque, notificacoes, acessos_streaming,
--        assinatura_cobrancas (cobrança mensal recorrente, é registro
--        financeiro e não pode ser apagada).
--    Todas as demais tabelas (cadastro/referência: usuarios, filmes, locais,
--    salas, assentos, sessoes, fornecedores, insumos, equipamentos, planos,
--    assinaturas, cupons etc.) crescem muito mais devagar e foram mantidas
--    como INT UNSIGNED — já são ~4,29 bilhões de capacidade, suficiente por
--    décadas, sem pagar o custo extra de armazenamento do BIGINT à toa.
--    Toda coluna de FOREIGN KEY usa o MESMO tipo da coluna referenciada.

-- 2) [NOVO] chk_itenspedido_sessao_qtd: impede uma linha de ingresso de
--    sessão (que representa UM assento específico) ter quantidade > 1,
--    o que seria um dado sem sentido (não existem "3 unidades" da mesma
--    poltrona).

-- 3) Tabelas de log que só crescem (notificacoes, movimentacoes_estoque,
--    tickets, chamados) não têm expurgo/particionamento aqui — ver
--    recomendação comentada no BLOCO 15, pois particionar no InnoDB exige
--    remover as FOREIGN KEY dessas tabelas (trade-off consciente, não
--    aplicado automaticamente).
-- ----------------------------------------------------------------------

CREATE DATABASE IF NOT EXISTS cineastra
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cineastra;
