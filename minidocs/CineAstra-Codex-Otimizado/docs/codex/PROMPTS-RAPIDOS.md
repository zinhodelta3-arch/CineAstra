# Prompts de uma tarefa

## Começar
Execute somente a tarefa 00 de docs/codex/tasks. Leia AGENTS.md e CONTRATO.md.
Faça diagnóstico focado do projeto existente e registre decisões/comandos/bloqueios.
Não implemente módulos nesta rodada. Atualize progresso e continuidade; pare.

## Próxima tarefa
Execute somente a tarefa ID indicada em docs/codex/tasks. Use DECISOES.md e
CONTINUIDADE.md; consulte contrato se ainda não lido. Leia fontes direcionadas.
Entregue implementação integrada e verificação adequada; atualize OpenAPI afetado.
Registre progresso e próximo passo; resumo de até 10 linhas; pare nesta tarefa.

## Corrigir erro
Corrija o erro abaixo no fluxo indicado. Localize causa nos arquivos relacionados,
faça a menor alteração suficiente e execute a verificação pertinente. Se depender
de serviço indisponível, registre bloqueio em vez de repetir comando sem mudança.
Erro: [mensagem redigida, sem segredos]
Fluxo: [rota/operação]

## Retomar
Leia AGENTS.md, DECISOES.md e CONTINUIDADE.md. Confira estado real dos arquivos.
Retome somente a tarefa ID, usando os requisitos necessários. Não reinicie
diagnóstico completo. Registre checkpoint se houver bloqueio e pare ao concluir.

## Revisar entrega específica
Revise somente a tarefa ID e seus consumidores afetados. Compare com aceite,
autorização, schema e OpenAPI. Corrija defeitos concretos e reexecute checks
afetados; informe evidência e bloqueios. Auditoria geral fica na tarefa51.

ID deve ser substituído pelo número; helper `prompt ID` já faz essa substituição.
