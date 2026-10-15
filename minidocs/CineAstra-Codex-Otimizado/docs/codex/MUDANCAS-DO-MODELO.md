# O que foi otimizado
Contrato anterior de centenas de linhas foi reduzido às invariantes compartilhadas;
módulos grandes foram divididos em entregas verificáveis. Diagnóstico profundo
do projeto inteiro deixa de ser exigido em cada rodada. Referências completas ficam
fora do AGENTS e são abertas por trecho/tabela. Handoff é checkpoint de15 linhas;
resposta final de10. Cobertura só linhas afetadas. Testes relevantes continuam por
tarefa, com marcos de regressão e auditoria final. Provider crítico ausente não
vira sucesso. O kit não impõe limites artificiais de arquivos que impeçam integridade.
Não inclui config.toml que force modelo/esforço/permissões: ajuste pelo cliente
instalado e disponibilidade real. Não instala skills ou MCP externos.
